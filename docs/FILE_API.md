# File Upload/Download API Documentation

This document describes the file management endpoints available in the Claud API.

## Base URL
All endpoints are prefixed with: `/api/files`

## Authentication
All endpoints require authentication via session cookies. Users must be logged in to use these endpoints.

## Endpoints

### 1. Upload File
Upload a file to the user's storage.

**Endpoint:** `POST /api/files/upload`

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file` (required): The file to upload
  - `parentFolderId` (optional): UUID of parent folder if organizing files in folders

**Response (201):**
```json
{
  "success": true,
  "file": {
    "file_id": "uuid",
    "filename": "stored-filename.ext",
    "original_name": "original-filename.ext",
    "file_size": "bytes",
    "mime_type": "application/octet-stream",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: No file provided or file too large
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

**File Size Limit:**
Default maximum file size is 100MB (configurable via `MAX_FILE_SIZE` environment variable).

**Example:**
```bash
curl -X POST http://localhost:3000/api/files/upload \
  -b cookies.txt \
  -F "file=@/path/to/file.txt"
```

---

### 2. Download File
Download a file by its ID.

**Endpoint:** `GET /api/files/:fileId/download`

**Parameters:**
- `fileId` (path): UUID of the file to download

**Response:**
- Content-Type: The file's MIME type
- Content-Disposition: `attachment; filename="original-filename.ext"`
- Body: File stream

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: File not found
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X GET http://localhost:3000/api/files/{fileId}/download \
  -b cookies.txt \
  -o downloaded-file.txt
```

---

### 3. List Files
List all files for the authenticated user.

**Endpoint:** `GET /api/files`

**Query Parameters:**
- `limit` (optional, default: 50): Maximum number of files to return
- `offset` (optional, default: 0): Number of files to skip (for pagination)
- `parentFolderId` (optional): Filter files by parent folder ID

**Response (200):**
```json
{
  "success": true,
  "files": [
    {
      "file_id": "uuid",
      "filename": "stored-filename.ext",
      "original_name": "original-filename.ext",
      "file_size": "bytes",
      "mime_type": "application/octet-stream",
      "parent_folder_id": "uuid or null",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

**Example:**
```bash
curl -X GET "http://localhost:3000/api/files?limit=10&offset=0" \
  -b cookies.txt
```

---

### 4. Get File Metadata
Get metadata for a specific file.

**Endpoint:** `GET /api/files/:fileId`

**Parameters:**
- `fileId` (path): UUID of the file

**Response (200):**
```json
{
  "success": true,
  "file": {
    "file_id": "uuid",
    "user_uuid": "uuid",
    "filename": "stored-filename.ext",
    "original_name": "original-filename.ext",
    "file_path": "/path/to/file",
    "file_size": "bytes",
    "mime_type": "application/octet-stream",
    "parent_folder_id": "uuid or null",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: File not found
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X GET http://localhost:3000/api/files/{fileId} \
  -b cookies.txt
```

---

### 5. Delete File
Delete a file (soft delete).

**Endpoint:** `DELETE /api/files/:fileId`

**Parameters:**
- `fileId` (path): UUID of the file to delete

**Response (200):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: File not found or already deleted
- `500 Internal Server Error`: Server error

**Note:** This is a soft delete. The file is marked as deleted in the database but not physically removed from disk.

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/files/{fileId} \
  -b cookies.txt
```

---

### 6. Get Storage Usage
Get the authenticated user's storage usage statistics.

**Endpoint:** `GET /api/files/storage/usage`

**Response (200):**
```json
{
  "success": true,
  "storage": {
    "used": 1048576,
    "max": 104857600,
    "usedFormatted": "1.00 MB",
    "maxFormatted": "100.00 MB"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X GET http://localhost:3000/api/files/storage/usage \
  -b cookies.txt
```

---

## File Storage Structure

Files are stored on disk in user-specific directories:
```
uploads/
  └── {user-file-bucket-id}/
      ├── {file-uuid-1}.ext
      ├── {file-uuid-2}.ext
      └── ...
```

Each user has their own directory based on their `file_bucket_id`, ensuring file isolation between users.

## Configuration

The following environment variables can be used to configure file storage:

- `UPLOAD_DIR`: Directory where files are stored (default: `./uploads`)
- `MAX_FILE_SIZE`: Maximum file size in bytes (default: `104857600` = 100MB)

## Security Considerations

1. **Authentication Required**: All endpoints require valid session authentication
2. **User Isolation**: Users can only access their own files
3. **File Size Limits**: Enforced to prevent abuse
4. **Soft Deletion**: Files are marked as deleted rather than immediately removed
5. **MIME Type Detection**: Files are stored with their MIME type for proper handling
6. **Unique Filenames**: Files are stored with UUID-based names to prevent conflicts

## Error Codes

- `NOT_AUTHENTICATED`: User is not logged in
- `NO_FILE`: No file was provided in the upload request
- `FILE_TOO_LARGE`: Uploaded file exceeds size limit
- `FILE_NOT_FOUND`: Requested file does not exist or user doesn't have access
- `SAVE_ERROR`: Error occurred while saving the file
- `SERVER_ERROR`: Internal server error
