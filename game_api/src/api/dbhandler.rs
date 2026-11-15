use sqlx::PgPool;

pub async fn player_table_handler(pool: &PgPool) {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS players (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            avatar_url VARCHAR(255) DEFAULT '/pfp/pfp_01.webp',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );",
    )
    .execute(pool) // Use execute for CREATE/INSERT/UPDATE
    .await // MUST AWAIT
    .expect("Failed to create table");
}

pub async fn player_status_table_handler(pool: &PgPool) {
    sqlx::query(
        "
            create table if not exists playerstats (
                player_id int primary key references players(id) on delete cascade,
                times_imposter int default 0,
                times_civilian int default 0,
                wins_as_civilian int default 0,
                wins_as_imposter int default 0,
                losse_as_civilian int default 0,
                losse_as_imposter int default 0,                
                score int default 0,
                titles text[] default'{}'
            );
    ",
    )
    .execute(pool)
    .await
    .expect("Failed To Create Status Database");
}
