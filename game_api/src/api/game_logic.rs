use rand::seq::SliceRandom;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::error::Error;
use std::fs;
/// One word the game can use, plus its hints.
/// The field names must match the keys in words.json ("word" and "hints").
///
/// The derives give this struct free abilities:
/// - Debug: can be printed for debugging
/// - Clone: can be copied with .clone()
/// - Deserialize: can be built FROM JSON (reading words.json)
/// - Serialize: can be turned INTO JSON (sending the API response)


#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct GameWord {
    pub word: String,
    pub hints: Vec<String>,}
    /// A nickname for the whole database:
/// category name (like "Animals") -> list of words in that category.
/// It mirrors the structure of words.json exactly.
    
    pub type WordDatabase=HashMap<String,Vec<GameWord>>;
    pub fn load_words(path: &str)-> Result<WordDatabase, Box<dyn Error>> {
        let contents = fs::read_to_string(path)?;
        let db: WordDatabase = serde_json::from_str(&contents)?;
        Ok(db)
    }
    /// Reads words.json (or any path we give it) and turns it into a WordDatabase.
/// Returns Ok(database) on success, or Err(...) if the file is missing
/// or the JSON is broken.
    pub fn pick_random_word(db: &WordDatabase, categories: &[String]) -> Result<Json<GameWord>, StatusCode > {
    let pool: Vec<&GameWord> = categories
        .iter()
        .filter_map(|cat| db.get(cat))
        .flatten()
        .collect();
        let mut rng =rand::thread_rng();

    // Choose one word from the pile at random, then copy it so we return
    //our own gameword. If the pile is empty, this stays None.
        pool.choose(&mut rng).map(|w| (*w).clone());

        
        match GameWord {
            Ok(word) => word,
            Err() => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
