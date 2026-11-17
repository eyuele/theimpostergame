/// Include the game_logic.rs file as a module so we can use what's inside it.
mod game_logic ;
//tools from frameworks and jason,lhic,rs handlers
use axum::{extract::State, http::StatusCode, routing::post, Json, Router};
use game_logic::{load_words, pick_random_word, GameWord, WordDatabase};
use serde::Deserialize;
use std::sync::Arc;

#[derive(Clone)]
struct AppState {
    words:Arc<WordDatabase>
}

/// The JSON body we expect
#[derive(Deserialize) ]
struct json{
    categories:Vec<String>
}
async fn testword(
    State(state): State<AppState>,
    Json(req): Json<json>,
) -> Result<Json<GameWord>, (StatusCode, String)> {
    pick_random_word(&state.words ,&req.categories)
        .map(Json)
        .ok_or((
            StatusCode::BAD_REQUEST,
            "No words found for the selected categories".to_string(),
        ))
}
// #[tokio::main] sets up the async runtime so main can be async.
#[tokio::main]
async fn main(){
    let words =load_words("words.json").expect("failed to load words.json");
    println!("loaded{} categories" ,words.len());

    // Put the database in the shared state
    let state = AppState{
        words: Arc::new(words),

    };
    //sets up routes 
    let app =Router::new()
     .route("/api/testword", post(testword))
        .with_state(state);
        //opens port to recive requests 
        let listener =tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
        println!("listening on https//localhost:3000");
        //starts the server
        axum::serve(listener,app).await.unwrap();
}
