use std::env;

use axum::{
    Router,
    http::{HeaderValue, Method, header},
    middleware,
    routing::{get, post},
};
use dotenvy::dotenv;

use sqlx::postgres::PgPoolOptions;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tower_sessions::{
    Expiry, SessionManagerLayer,
    cookie::{SameSite, time::Duration},
};
use tower_sessions_sqlx_store::PostgresStore;
mod api;

use crate::api::{auth_middleware, dbhandler, game_utils, userauth};

mod test;
use test::rank_tests;

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
        .with_secure(true)
        .with_same_site(SameSite::None)
        .with_expiry(Expiry::OnInactivity(Duration::hours(24)));

    let cors = CorsLayer::new()
        .allow_origin(vec![
            "http://localhost:5173".parse::<HeaderValue>().unwrap(),
            "https://impostersup.vercel.app"
                .parse::<HeaderValue>()
                .unwrap(), // New domain
            "https://theimpostorup.vercel.app"
                .parse::<HeaderValue>()
                .unwrap(), // Old domain
        ])
        .allow_credentials(true)
        .allow_methods([
            Method::POST,
            Method::GET,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([
            header::CONTENT_TYPE,
            header::AUTHORIZATION,
            header::ACCEPT,
            header::ORIGIN,
            header::UPGRADE,
            header::SEC_WEBSOCKET_KEY,
        ]);

    let public_layer = Router::new()
        .route("/login", post(userauth::login_handler))
        .route("/register", post(userauth::register_handler));

    let protected_layer = Router::new()
        .route("/me", get(userauth::me_handler))
        .route("/logout", post(userauth::logout_handler))
        .route("/pfp_setter", post(game_utils::user_pfp_handler))
        .route("/pass_change", post(game_utils::pass_change_handler))
        .route("/stats", get(game_utils::stats_handler)) // <- new line
        .route_layer(middleware::from_fn(auth_middleware::require_login));

    let api = Router::new().merge(public_layer).merge(protected_layer);

    let app = Router::new()
        .nest("/api", api)
        .layer(session_layer)
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(pool);

    let port = std::env::var("PORT").unwrap_or_else(|_| "12659".to_string());

    let listener = TcpListener::bind(format!("0.0.0.0:{}", port))
        .await
        .unwrap();

    println!("Listening on: {}", listener.local_addr().unwrap());

    axum::serve(listener, app).await.expect("Whats going on");
}
