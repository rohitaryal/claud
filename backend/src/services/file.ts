import { query } from '../utils/db'
import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '104857600') // 100MB default

/**
 * Initialize upload directory
 */
export async function initUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
    console.log(`Created upload directory: ${UPLOAD_DIR}`)
  }
}

/**
 * Get user's upload directory path
 */
function getUserUploadDir(fileBucketId: string): string {
  const userDir = path.join(UPLOAD_DIR, fileBucketId)
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true })
  }
  return userDir
}

/**
 * Save uploaded file
 */
export async function saveFile(
  userUuid: string,
  fileBucketId: string,
  file: File,
  parentFolderId?: string
): Promise<{ success: boolean; file?: any; message?: string; code?: string }> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        message: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        code: 'FILE_TOO_LARGE'
      }
    }

    // Generate unique filename
    const fileId = uuidv4()
    const fileExt = path.extname(file.name)
    const filename = `${fileId}${fileExt}`
    
    // Get user's upload directory
    const userDir = getUserUploadDir(fileBucketId)
    const filePath = path.join(userDir, filename)
    
    // Save file to disk
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    fs.writeFileSync(filePath, buffer)
    
    // Save file metadata to database
    const result = await query(
      `INSERT INTO files (file_id, user_uuid, filename, original_name, file_path, file_size, mime_type, parent_folder_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING file_id, filename, original_name, file_size, mime_type, created_at`,
      [fileId, userUuid, filename, file.name, filePath, file.size, file.type || 'application/octet-stream', parentFolderId || null]
    )
    
    return {
      success: true,
      file: result.rows[0]
    }
  } catch (error) {
    console.error('Error saving file:', error)
    return {
      success: false,
      message: 'Failed to save file',
      code: 'SAVE_ERROR'
    }
  }
}

/**
 * Get file metadata by ID
 */
export async function getFileMetadata(fileId: string, userUuid: string): Promise<any> {
  const result = await query(
    `SELECT file_id, user_uuid, filename, original_name, file_path, file_size, mime_type, parent_folder_id, created_at, updated_at
     FROM files
     WHERE file_id = $1 AND user_uuid = $2 AND is_deleted = FALSE`,
    [fileId, userUuid]
  )
  return result.rows[0] || null
}

/**
 * Get file stream for download
 */
export function getFileStream(filePath: string): fs.ReadStream | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null
    }
    return fs.createReadStream(filePath)
  } catch (error) {
    console.error('Error creating file stream:', error)
    return null
  }
}

/**
 * List user's files
 */
export async function listUserFiles(
  userUuid: string,
  parentFolderId?: string,
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  const result = await query(
    `SELECT file_id, filename, original_name, file_size, mime_type, parent_folder_id, created_at, updated_at
     FROM files
     WHERE user_uuid = $1 AND is_deleted = FALSE AND parent_folder_id ${parentFolderId ? '= $2' : 'IS NULL'}
     ORDER BY created_at DESC
     LIMIT $${parentFolderId ? '3' : '2'} OFFSET $${parentFolderId ? '4' : '3'}`,
    parentFolderId 
      ? [userUuid, parentFolderId, limit, offset]
      : [userUuid, limit, offset]
  )
  return result.rows
}

/**
 * Delete file (soft delete)
 */
export async function deleteFile(fileId: string, userUuid: string): Promise<boolean> {
  try {
    const result = await query(
      `UPDATE files SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE file_id = $1 AND user_uuid = $2 AND is_deleted = FALSE
       RETURNING file_id`,
      [fileId, userUuid]
    )
    return result.rowCount !== null && result.rowCount > 0
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}

/**
 * Get total storage used by user
 */
export async function getUserStorageUsage(userUuid: string): Promise<number> {
  const result = await query(
    `SELECT COALESCE(SUM(file_size), 0) as total_size
     FROM files
     WHERE user_uuid = $1 AND is_deleted = FALSE`,
    [userUuid]
  )
  return parseInt(result.rows[0]?.total_size || '0')
}

export { MAX_FILE_SIZE }
