use tower_sessions::Session;

use crate::api::userauth::USER_KEY;
use axum::{
    extract::Request, // Use axum::extract::Request
    http::StatusCode,
    middleware::Next, // Use axum::middleware::Next
    response::Response,
};

pub async fn require_login(
    session: Session,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let existing_user = session
        .get::<String>(USER_KEY)
        .await
        .unwrap_or(None)
        .is_some();
    if existing_user {
        Ok(next.run(request).await)
    } else {
        Err(StatusCode::UNAUTHORIZED)
    }
}
