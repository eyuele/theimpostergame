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

// Rank system


/// All rank thresholds in one place, lowest to highest.
/// (rank name, minimum score needed)
pub const RANK_THRESHOLDS: [(&str, i64); 7] = [
    ("Recruit", 0),
    ("Rookie", 300),
    ("Sleuth", 800),
    ("Detective", 1_800),
    ("Inspector", 3_500),
    ("Mastermind", 6_500),
    ("Legend", 12_000),
];

#[derive(Debug, Serialize, PartialEq)]
pub struct NextRank {
    pub name: &'static str,
    pub points_remaining: i64,
}

#[derive(Debug, Serialize, PartialEq)]
pub struct RankInfo {
    pub rank: &'static str,
    /// None for the top rank (Legend).
    pub next_rank: Option<NextRank>,
}

/// Maps a score to its rank. A score exactly at a threshold gets that rank.
pub fn rank_for_score(score: i64) -> RankInfo {
    let score = score.max(0); // negative scores count as 0

    // Last threshold the score has reached. Recruit (0) always matches.
    let idx = RANK_THRESHOLDS
        .iter()
        .rposition(|(_, min)| score >= *min)
        .unwrap_or(0);

    let next_rank = RANK_THRESHOLDS.get(idx + 1).map(|(name, min)| NextRank {
        name,
        points_remaining: min - score,
    });

    RankInfo {
        rank: RANK_THRESHOLDS[idx].0,
        next_rank,
    }
}


// GET /api/stats  (read-only)


/// One row from players LEFT JOIN playerstats. COALESCE gives zeros and an
/// empty titles list when the player has no playerstats row yet.
#[derive(FromRow)]
struct PlayerStatsRow {
    username: String,
    avatar_url: Option<String>,
    times_imposter: i64,
    times_civilian: i64,
    wins_as_imposter: i64,
    loss_as_imposter: i64,
    wins_as_civilian: i64,
    loss_as_civilian: i64,
    score: i64,
    titles: Vec<String>,
}

#[derive(Serialize)]
pub struct StatsResponse {
    username: String,
    avatar_url: Option<String>,
    times_imposter: i64,
    times_civilian: i64,
    wins_as_imposter: i64,
    loss_as_imposter: i64,
    wins_as_civilian: i64,
    loss_as_civilian: i64,
    score: i64,
    titles: Vec<String>,
    #[serde(flatten)]
    rank: RankInfo,
}

/// Returns the logged-in player's stats plus a rank computed from their score
/// right now. Nothing is written, awarded, or unlocked here.
pub async fn stats_handler(
    State(pool): State<PgPool>,
    session: Session,
) -> Result<Json<StatsResponse>, StatusCode> {
    let username = session
        .get::<String>(USER_KEY)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let row = sqlx::query_as::<_, PlayerStatsRow>(
        "
        SELECT
            p.username,
            p.avatar_url,
            COALESCE(s.times_imposter, 0)::BIGINT AS times_imposter,
            COALESCE(s.times_civilian, 0)::BIGINT AS times_civilian,
            COALESCE(s.wins_as_imposter, 0)::BIGINT AS wins_as_imposter,
            COALESCE(s.losse_as_imposter, 0)::BIGINT AS loss_as_imposter,
            COALESCE(s.wins_as_civilian, 0)::BIGINT AS wins_as_civilian,
           COALESCE(s.losse_as_civilian, 0)::BIGINT AS loss_as_civilian,
            COALESCE(s.score, 0)::BIGINT AS score,
            COALESCE(s.titles, ARRAY[]::TEXT[]) AS titles
        FROM players p
        LEFT JOIN playerstats s ON s.player_id = p.id
        WHERE p.username = $1
        ",
    )
    .bind(&username)
    .fetch_optional(&pool)
    .await
    .map_err(|e| {
        eprintln!("🚨 DB ERROR (Get Stats): {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?
    .ok_or(StatusCode::UNAUTHORIZED)?; // session points at a player that no longer exists

    let rank = rank_for_score(row.score);

    Ok(Json(StatsResponse {
        username: row.username,
        avatar_url: row.avatar_url,
        times_imposter: row.times_imposter,
        times_civilian: row.times_civilian,
        wins_as_imposter: row.wins_as_imposter,
        loss_as_imposter: row.loss_as_imposter,
        wins_as_civilian: row.wins_as_civilian,
        loss_as_civilian: row.loss_as_civilian,
        score: row.score,
        titles: row.titles,
        rank,
    }))
}
#[cfg(test)]
mod rank_tests {
    use super::*;

    #[test]
    fn zero_is_recruit() {
        let r = rank_for_score(0);
        assert_eq!(r.rank, "Recruit");
        assert_eq!(r.next_rank.unwrap().points_remaining, 300);
    }

    #[test]
    fn just_below_threshold_is_lower_rank() {
        assert_eq!(rank_for_score(299).rank, "Recruit");
        assert_eq!(rank_for_score(799).rank, "Rookie");
    }

    #[test]
    fn exactly_at_threshold_is_higher_rank() {
        assert_eq!(rank_for_score(300).rank, "Rookie");
        assert_eq!(rank_for_score(800).rank, "Sleuth");
        assert_eq!(rank_for_score(1_800).rank, "Detective");
    }

    #[test]
    fn legend_has_no_next_rank() {
        let r = rank_for_score(12_000);
        assert_eq!(r.rank, "Legend");
        assert!(r.next_rank.is_none());
        assert!(rank_for_score(999_999).next_rank.is_none());
    }
}