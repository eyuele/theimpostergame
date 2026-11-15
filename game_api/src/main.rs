use std::env;

use axum::{
    Router,
    routing::{get, post},
};
use dotenvy::dotenv;
use sqlx::postgres::PgPoolOptions;
use tokio::net::TcpListener;
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

    let listener = TcpListener::bind("127.0.0.1:12659").await.unwrap();

    println!("Listening on: {}", listener.local_addr().unwrap());

    let api = Router::new()
        .route("/login", post(userauth::login_handler))
        .route("/me", get(userauth::me_handler))
        .route("/register", post(userauth::register_handler))
        .route("/logout", get(userauth::logouthandler));
    let app = Router::new()
        .nest("/api", api)
        .layer(session_layer)
        .with_state(pool);
    axum::serve(listener, app).await.expect("Whats going on");
}
