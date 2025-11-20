import { Pool, QueryResult, QueryResultRow } from "pg";
import { dbConfig } from "../config/db";

// Create a connection pool
const pool = new Pool({
  host: dbConfig.host,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password,
  port: dbConfig.port,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.on("connect", () => {
  console.log("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

/**
 * Execute a query with parameters
 * @param text SQL query string
 * @param params Query parameters
 * @returns Query result
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient() {
  return await pool.connect();
}

/**
 * Initialize database tables
 * Creates all required tables if they don't exist
 */
export async function initDatabase() {
  const client = await getClient();
  try {
    await client.query("BEGIN");

    // Enable pgcrypto extension for gen_random_uuid()
    await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        file_bucket_id VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sessions table for authentication
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id VARCHAR(255) PRIMARY KEY,
        user_uuid UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT
      )
    `);

    // Create files table
    await client.query(`
      CREATE TABLE IF NOT EXISTS files (
        file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_uuid UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(127),
        is_deleted BOOLEAN DEFAULT FALSE,
        is_starred BOOLEAN DEFAULT FALSE,
        parent_folder_id UUID REFERENCES files(file_id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add is_starred column if it doesn't exist (for existing databases)
    await client.query(`
      ALTER TABLE files 
      ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE
    `);

    // Create file_shares table for sharing files
    await client.query(`
      CREATE TABLE IF NOT EXISTS file_shares (
        share_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_id UUID NOT NULL REFERENCES files(file_id) ON DELETE CASCADE,
        shared_by UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
        shared_with UUID REFERENCES users(uuid) ON DELETE CASCADE,
        share_token VARCHAR(255) UNIQUE,
        permission VARCHAR(20) DEFAULT 'read' CHECK (permission IN ('read', 'write', 'admin')),
        is_public BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better query performance
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_sessions_user_uuid ON sessions(user_uuid)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_files_user_uuid ON files(user_uuid)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_files_parent_folder ON files(parent_folder_id)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON file_shares(file_id)"
    );

    await client.query("COMMIT");
    console.log("Database initialized successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error initializing database:", error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get user details by session ID
 * @param session Session ID string
 * @returns User object or null
 */
export async function getFromSession(session: string) {
  const result = await query(
    `SELECT u.* FROM users u
     JOIN sessions s ON u.uuid = s.user_uuid
     WHERE s.session_id = $1 AND s.expires_at > NOW()`,
    [session]
  );
  return result.rows[0] || null;
}

/**
 * Get user details by UUID
 * @param uuid User UUID
 * @returns User object or null
 */
export async function getUserDetails(uuid: string) {
  const result = await query(
    "SELECT uuid, username, email, file_bucket_id, created_at FROM users WHERE uuid = $1",
    [uuid]
  );
  return result.rows[0] || null;
}

/**
 * Create a new user
 * @param username Username
 * @param email Email address
 * @param hashedPassword Hashed password
 * @param fileBucketID File bucket ID
 * @returns Created user object
 */
export async function createUser(
  username: string,
  email: string,
  hashedPassword: string,
  fileBucketID: string
) {
  const result = await query(
    `INSERT INTO users (username, email, hashed_password, file_bucket_id)
     VALUES ($1, $2, $3, $4)
     RETURNING uuid, username, email, file_bucket_id, created_at`,
    [username, email, hashedPassword, fileBucketID]
  );
  return result.rows[0];
}

/**
 * Create a new session
 * @param userId User UUID
 * @param sessionId Session ID
 * @param expiresAt Expiration timestamp
 * @param ipAddress IP address
 * @param userAgent User agent string
 * @returns Created session object
 */
export async function createSession(
  userId: string,
  sessionId: string,
  expiresAt: Date,
  ipAddress?: string,
  userAgent?: string
) {
  const result = await query(
    `INSERT INTO sessions (session_id, user_uuid, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [sessionId, userId, expiresAt, ipAddress, userAgent]
  );
  return result.rows[0];
}

/**
 * Delete a session (logout)
 * @param sessionId Session ID
 */
export async function deleteSession(sessionId: string) {
  await query("DELETE FROM sessions WHERE session_id = $1", [sessionId]);
}

/**
 * Close the database connection pool
 */
export async function closePool() {
  await pool.end();
  console.log("Database pool closed");
}

export { pool };
