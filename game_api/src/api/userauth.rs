use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use axum::{Json, extract::State, http::StatusCode};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use tower_sessions::Session;

#[derive(Deserialize)]
pub struct AuthRequest {
    pub username: String,
    pub password: String,
    // pub access_key: String,
}

// 2. What the Database returns (Notice we don't return the password!)
#[derive(Serialize, sqlx::FromRow)]
pub struct AuthResponse {
    pub id: i32,
    pub username: String,
    pub avatar_url: String,
}

pub const USER_KEY: &str = "user";

// Add this to userauth.rs
pub async fn me_handler(
    State(pool): State<PgPool>,
    session: Session,
) -> Result<Json<AuthResponse>, StatusCode> {
    // Check if the user is in the session

    if let Ok(Some(username)) = session.get::<String>(USER_KEY).await {
        let user = sqlx::query_as::<_, AuthResponse>(
            "
            SELECT id, username, avatar_url FROM players WHERE username = $1
            ",
        )
        .bind(&username)
        .fetch_optional(&pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        match user {
            Some(auth_response) => Ok(Json(auth_response)),
            None => Err(StatusCode::UNAUTHORIZED),
        }
    } else {
        Err(StatusCode::UNAUTHORIZED)
    }
}

pub fn hashpassword(password: &str) -> String {
    Argon2::default()
        .hash_password(&password.as_bytes())
        .expect("hahs failed")
        .to_string()
}

pub fn verify_password(password: &str, storedhash: &str) -> bool {
    let Ok(parsed) = PasswordHash::new(storedhash) else {
        return false;
    };
    Argon2::default()
        .verify_password(password.as_bytes(), &parsed)
        .is_ok()
}

pub async fn register_handler(
    State(pool): State<PgPool>,
    session: Session,
    Json(payload): Json<AuthRequest>,
) -> Result<(StatusCode, Json<AuthResponse>), StatusCode> {
    let password = hashpassword(payload.password.as_str());

    if payload.username.is_empty() || payload.password.is_empty() || payload.password.len() <= 4 {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let res = sqlx::query_as::<_, AuthResponse>(
        "
        INSERT INTO players (username, password_hash) 
        VALUES ($1, $2)
        RETURNING id, username, avatar_url
        ",
    )
    .bind(payload.username.clone())
    .bind(password)
    .fetch_one(&pool)
    .await;

    session
        .cycle_id()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    session
        .insert(USER_KEY, payload.username.clone())
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    match res {
        Ok(player) => Ok((StatusCode::CREATED, Json(player))),
        Err(sqlx::Error::Database(db_err)) if db_err.is_unique_violation() => {
            // This triggers if the username is already taken
            Err(StatusCode::CONFLICT)
        }
        Err(_) => {
            // Other database errors
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

#[derive(sqlx::FromRow)]
struct PlayerRow {
    id: i32,
    username: String,
    password_hash: String,
    avatar_url: String, // ⚠️ see nullability note below
}

pub async fn login_handler(
    State(pool): State<PgPool>,
    session: Session,
    Json(payload): Json<AuthRequest>,
) -> Result<(StatusCode, Json<AuthResponse>), StatusCode> {
    if payload.username.is_empty() || payload.password.is_empty() {
        return Err(StatusCode::UNAUTHORIZED);
    }
    let row: Option<PlayerRow> = sqlx::query_as(
        "SELECT id, username, password_hash, avatar_url FROM players WHERE username = $1 ",
    )
    .bind(&payload.username)
    .fetch_optional(&pool)
    .await
    .map_err(|e| {
        eprintln!("🚨 DATABASE ERROR: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let player = match row {
        Some(data) => data,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    // 4. Verify the password
    let password_check = payload.password.clone();
    let is_valid = tokio::task::spawn_blocking(move || {
        verify_password(&password_check, &player.password_hash)
    })
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    if !is_valid {
        return Err(StatusCode::UNAUTHORIZED);
    }

    session
        .cycle_id()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    session
        .insert(USER_KEY, payload.username.clone())
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = AuthResponse {
        id: player.id,
        username: player.username,
        avatar_url: player.avatar_url,
    };

    Ok((StatusCode::OK, Json(response)))
}

// this part of the code handles the logout

pub async fn logout_handler(session: Session) -> Result<StatusCode, StatusCode> {
    session.clear().await;
    session
        .flush()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::NO_CONTENT)
}
