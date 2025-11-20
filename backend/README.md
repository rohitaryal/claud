# Backend

The backend server for Claud, a cloud-based file storage system.

## Features

- User authentication (register, login, logout)
- File upload/download with streaming
- File management (list, delete, get metadata)
- Storage usage tracking
- User-specific file directories
- File size validation (100MB default limit)

## Getting Started

To install dependencies:

```sh
bun install
```

To run:

```sh
bun run dev
```

Open http://localhost:3000

## API Documentation

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset

### File Management
- `POST /api/files/upload` - Upload a file
- `GET /api/files/:fileId/download` - Download a file
- `GET /api/files` - List user's files
- `GET /api/files/:fileId` - Get file metadata
- `DELETE /api/files/:fileId` - Delete a file
- `GET /api/files/storage/usage` - Get storage usage

For detailed API documentation, see [/docs/FILE_API.md](../docs/FILE_API.md)

## Environment Variables

- `PORT` - Server port (default: 3000)
- `DB_HOST` - Database host (default: localhost)
- `DB_NAME` - Database name (default: claud)
- `DB_USER` - Database user (default: claud)
- `DB_PASSWORD` - Database password (default: claud_password)
- `DB_PORT` - Database port (default: 5432)
- `UPLOAD_DIR` - Upload directory (default: ./uploads)
- `MAX_FILE_SIZE` - Maximum file size in bytes (default: 104857600 = 100MB)

## File Storage

Files are stored in user-specific directories under the `uploads/` folder:

```
uploads/
  └── {user-file-bucket-id}/
      ├── {file-uuid-1}.ext
      ├── {file-uuid-2}.ext
      └── ...
```

The `uploads/` directory is automatically created on server start and is excluded from git.
