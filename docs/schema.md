# Database Schema Documentation

This document describes the database schema for the Claud file storage system.

## Overview

The Claud application uses PostgreSQL as its primary database. The schema is designed to support user management, file storage, authentication sessions, and file sharing capabilities.

## Tables

### 1. `users`

Stores user account information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `uuid` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for the user (never exposed to users) |
| `username` | VARCHAR(255) | UNIQUE, NOT NULL | User's chosen username |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| `hashed_password` | TEXT | NOT NULL | Bcrypt hashed password |
| `file_bucket_id` | VARCHAR(255) | UNIQUE, NOT NULL | Unique identifier for user's file storage bucket |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `idx_users_email` on `email`
- `idx_users_username` on `username`

**Security Notes:**
- `uuid` should never be exposed in public APIs
- Passwords must always be hashed before storage
- `file_bucket_id` is used to organize user files in object storage

---

### 2. `sessions`

Manages user authentication sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `session_id` | VARCHAR(255) | PRIMARY KEY | Unique session identifier (stored in cookies) |
| `user_uuid` | UUID | NOT NULL, FOREIGN KEY → users(uuid) | Reference to the user |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Session creation time |
| `expires_at` | TIMESTAMP | NOT NULL | Session expiration time |
| `ip_address` | VARCHAR(45) | | IP address of the client |
| `user_agent` | TEXT | | Browser user agent string |

**Indexes:**
- `idx_sessions_user_uuid` on `user_uuid`

**Relationships:**
- `user_uuid` references `users(uuid)` with CASCADE delete

**Notes:**
- Sessions are automatically cleaned up when users are deleted
- Expired sessions should be periodically cleaned up
- Session validation checks `expires_at > NOW()`

---

### 3. `files`

Stores metadata about uploaded files and folders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `file_id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique file/folder identifier |
| `user_uuid` | UUID | NOT NULL, FOREIGN KEY → users(uuid) | Owner of the file |
| `filename` | VARCHAR(255) | NOT NULL | System filename (unique per user) |
| `original_name` | VARCHAR(255) | NOT NULL | Original filename from upload |
| `file_path` | TEXT | NOT NULL | Full path in storage system |
| `file_size` | BIGINT | NOT NULL | File size in bytes |
| `mime_type` | VARCHAR(127) | | MIME type of the file |
| `is_deleted` | BOOLEAN | DEFAULT FALSE | Soft delete flag |
| `parent_folder_id` | UUID | FOREIGN KEY → files(file_id) | Parent folder (NULL for root) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Upload timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification timestamp |

**Indexes:**
- `idx_files_user_uuid` on `user_uuid`
- `idx_files_parent_folder` on `parent_folder_id`

**Relationships:**
- `user_uuid` references `users(uuid)` with CASCADE delete
- `parent_folder_id` references `files(file_id)` with CASCADE delete (for folder hierarchy)

**Notes:**
- Folders are represented as files with a special MIME type
- `parent_folder_id` NULL indicates root-level files
- Soft delete allows for file recovery

---

### 4. `file_shares`

Manages file sharing and permissions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `share_id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique share identifier |
| `file_id` | UUID | NOT NULL, FOREIGN KEY → files(file_id) | Shared file reference |
| `shared_by` | UUID | NOT NULL, FOREIGN KEY → users(uuid) | User who shared the file |
| `shared_with` | UUID | FOREIGN KEY → users(uuid) | User receiving access (NULL for public) |
| `share_token` | VARCHAR(255) | UNIQUE | Token for link-based sharing |
| `permission` | VARCHAR(20) | DEFAULT 'read', CHECK | Access level: 'read', 'write', 'admin' |
| `is_public` | BOOLEAN | DEFAULT FALSE | Public link sharing flag |
| `expires_at` | TIMESTAMP | | Optional expiration for share |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Share creation time |

**Indexes:**
- `idx_file_shares_file_id` on `file_id`

**Relationships:**
- `file_id` references `files(file_id)` with CASCADE delete
- `shared_by` references `users(uuid)` with CASCADE delete
- `shared_with` references `users(uuid)` with CASCADE delete

**Permission Levels:**
- `read` - View and download only
- `write` - Read + upload/modify files
- `admin` - Write + manage sharing and permissions

**Notes:**
- `shared_with` can be NULL for public shares
- `share_token` is used for anonymous access via link
- Shares are automatically cleaned up when files or users are deleted

---

## Database Initialization

The database schema is automatically initialized when the application starts by calling the `initDatabase()` function from `/backend/src/utils/db.ts`.

### Manual Initialization

If needed, you can manually initialize the database:

```typescript
import { initDatabase } from './utils/db';

await initDatabase();
```

---

## Connection Configuration

Database connection settings are configured in `/backend/src/config/db.ts` and can be overridden using environment variables:

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_NAME` | claud | Database name |
| `DB_USER` | claud | Database user |
| `DB_PASSWORD` | claud_password | Database password |
| `DB_PORT` | 5432 | PostgreSQL port |

---

## Usage Examples

### Creating a User

```typescript
import { createUser } from './utils/db';

const user = await createUser(
  'johndoe',
  'john@example.com',
  hashedPassword,
  'bucket-uuid-123'
);
```

### Getting User from Session

```typescript
import { getFromSession } from './utils/db';

const user = await getFromSession(sessionId);
if (user) {
  console.log('Authenticated user:', user.username);
}
```

### Creating a Session

```typescript
import { createSession } from './utils/db';

const session = await createSession(
  userId,
  sessionId,
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  req.ip,
  req.headers['user-agent']
);
```

---

## Maintenance

### Cleaning Up Expired Sessions

Periodically run:

```sql
DELETE FROM sessions WHERE expires_at < NOW();
```

### Recovering Soft-Deleted Files

To permanently delete soft-deleted files older than 30 days:

```sql
DELETE FROM files WHERE is_deleted = TRUE AND updated_at < NOW() - INTERVAL '30 days';
```

---

## Security Considerations

1. **Password Security**: Always hash passwords using bcrypt or argon2 before storing
2. **UUID Protection**: Never expose user UUIDs in public APIs
3. **Session Management**: 
   - Use secure, httpOnly cookies for session IDs
   - Implement session expiration and rotation
   - Track IP and user agent for anomaly detection
4. **File Access**: Always validate user permissions before file operations
5. **SQL Injection**: Use parameterized queries (all utility functions use prepared statements)
6. **Soft Deletes**: Implement proper cleanup policies for deleted files

---

## Future Enhancements

Potential schema additions:

- `file_versions` - Track file version history
- `user_storage_quotas` - Manage storage limits per user
- `audit_logs` - Track user actions for security
- `file_tags` - Tag-based file organization
- `shared_folders` - Folder-level sharing capabilities
