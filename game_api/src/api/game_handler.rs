use std::sync::Arc;

use axum::{Json, extract::State, http::StatusCode};
use serde::Deserialize;

use crate::api::game_logic::{GameWord, WordDatabase, pick_random_word};

/// The JSON body we expect
#[derive(Deserialize)]
struct Word {
    categories: Vec<String>,
}
#[derive(Clone)]
struct AppState {
    words: Arc<WordDatabase>,
}

async fn get_word(
    State(state): State<AppState>,
    Json(req): Json<Word>,
) -> Result<Json<GameWord>, (StatusCode, String)> {
    pick_random_word(&state.words, &req.categories)
        .map(Json)
        .ok_or((
            StatusCode::BAD_REQUEST,
            "No words found for the selected categories".to_string(),
        ))
}
