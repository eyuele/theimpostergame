use std::env;

use axum::{
    Router,
    http::HeaderValue,
    routing::{get, post},
};
use dotenvy::dotenv;
use sqlx::postgres::PgPoolOptions;
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};
use tower_sessions::{Expiry, SessionManagerLayer, cookie::time::Duration};
use tower_sessions_sqlx_store::PostgresStore;
mod api;

use crate::api::{dbhandler, userauth};

#[tokio::main]
async fn main() {
    dotenv().ok();

    println!("Hello, world!");
    let dburl = env::var("DB_URL").expect("failed to read");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&dburl)
        .await
        .expect("Failed to connect to Postgres");

    //create the database if they dont exist
    // reference the dbhandler.rs file in the /api folder for more information

    dbhandler::player_table_handler(&pool).await;
    dbhandler::player_status_table_handler(&pool).await;

    let store = PostgresStore::new(pool.clone());
    store
        .migrate()
        .await
        .expect("Failed to run session migrations");

    let session_layer = SessionManagerLayer::new(store)
        .with_secure(false)
        .with_expiry(Expiry::OnInactivity(Duration::hours(24)));

    let cors = CorsLayer::new()
        .allow_origin(vec![
            "http://localhost:5173".parse::<HeaderValue>().unwrap(),
            "https://theimpostorup.vercel.app"
                .parse::<HeaderValue>()
                .unwrap(), // <-- Add your Vercel URL
        ])
        .allow_credentials(true)
        .allow_methods(Any)
        .allow_headers(Any);

    let api = Router::new()
        .route("/login", post(userauth::login_handler))
        .route("/me", get(userauth::me_handler))
        .route("/register", post(userauth::register_handler))
        .route("/logout", get(userauth::logouthandler));
    let app = Router::new()
        .nest("/api", api)
        .layer(session_layer)
        .layer(cors)
        .with_state(pool);

    let port = std::env::var("PORT").unwrap_or_else(|_| "12659".to_string());

    let listener = TcpListener::bind(format!("0.0.0.0:{}", port))
        .await
        .unwrap();

    println!("Listening on: {}", listener.local_addr().unwrap());

    axum::serve(listener, app).await.expect("Whats going on");
}
