use axum::{Json, extract::State, http::StatusCode};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, prelude::FromRow};
use tower_sessions::Session;

use crate::api::userauth::{self, USER_KEY, verify_password};

#[derive(Deserialize, Serialize)]
pub struct UserPfp {
    pfp: String,
}

pub async fn user_pfp_handler(
    State(pool): State<PgPool>,
    session: Session,
    Json(payload): Json<UserPfp>,
) -> Result<Json<UserPfp>, StatusCode> {
    let username = session
        .get::<String>(USER_KEY)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let res = sqlx::query_as(
        "
        update players 
        SET avatar_url = $1 
        WHERE username = $2
        RETURNING avatar_url
        ",
    )
    .bind(payload.pfp)
    .bind(&username)
    .fetch_optional(&pool)
    .await
    .map_err(|e| {
        eprintln!("🚨 DB ERROR (Update PFP): {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    match res {
        Some((n,)) => Ok(Json(UserPfp { pfp: n })),
        None => Err(StatusCode::NOT_FOUND),
    }
}

#[derive(Deserialize)]

pub struct PassChange {
    old_pass: String,
    new_pass: String,
    confirm_pass: String,
}

#[derive(Serialize, Deserialize, FromRow)]
pub struct PlayerPassword {
    password_hash: String,
}

pub async fn pass_change_handler(
    session: Session,
    State(pool): State<PgPool>,
    Json(payload): Json<PassChange>,
) -> Result<StatusCode, StatusCode> {
    // this part of the code check if the password is the same

    let username = session
        .get::<String>(USER_KEY)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let password = userauth::hashpassword(&payload.new_pass);

    if payload.new_pass.is_empty() || payload.new_pass != payload.confirm_pass {
        return Err(StatusCode::BAD_REQUEST);
    }
    if payload.old_pass == payload.new_pass {
        return Err(StatusCode::BAD_REQUEST);
    }

    let check_res = sqlx::query_as::<_, PlayerPassword>(
        "
        SELECT password_hash FROM players WHERE username = $1 
    ",
    )
    .bind(&username)
    .fetch_optional(&pool)
    .await
    .map_err(|e| {
        eprintln!("🚨 DATABASE ERROR: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let storedhash = match check_res {
        Some(data) => data,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    //this part of the code checks the old password

    let is_valid = tokio::task::spawn_blocking(move || {
        verify_password(&payload.old_pass, &storedhash.password_hash)
    })
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if !is_valid {
        return Err(StatusCode::BAD_REQUEST);
    }

    //this part of the code changes the user password
    sqlx::query(
        "
        UPDATE players 
        SET password_hash = $1
        WHERE username = $2
        ",
    )
    .bind(password)
    .bind(&username)
    .execute(&pool)
    .await
    .map_err(|e| {
        println!("{}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;
    Ok(StatusCode::ACCEPTED)
}
