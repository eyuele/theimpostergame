/// Include the game_logic.rs file as a module so we can use what's inside it.
mod game_logic;
//tools from frameworks and jason,lhic,rs handlers
use axum::{Json, Router, extract::State, http::StatusCode, routing::post};
use game_logic::{GameWord, WordDatabase, load_words, pick_random_word};
use serde::Deserialize;
use std::sync::Arc;

// #[tokio::main] sets up the async runtime so main can be async.
#[tokio::main]
async fn main() {
    let words = load_words("words.json").expect("failed to load words.json");
    println!("loaded{} categories", words.len());

    // Put the database in the shared state
    let state = AppState {
        words: Arc::new(words),
    };
    //sets up routes
    let app = Router::new()
        .route("/api/testword", post(testword))
        .with_state(state);
    //opens port to recive requests
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("listening on https//localhost:3000");
    //starts the server
    axum::serve(listener, app).await.unwrap();
}
