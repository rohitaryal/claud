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
  offset: number = 0,
  includeDeleted: boolean = false
): Promise<any[]> {
  const deletedCondition = includeDeleted ? 'is_deleted = TRUE' : 'is_deleted = FALSE'
  const result = await query(
    `SELECT file_id, filename, original_name, file_size, mime_type, parent_folder_id, created_at, updated_at, is_deleted
     FROM files
     WHERE user_uuid = $1 AND ${deletedCondition} AND parent_folder_id ${parentFolderId ? '= $2' : 'IS NULL'}
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
 * Permanently delete file (hard delete)
 */
export async function permanentlyDeleteFile(fileId: string, userUuid: string): Promise<{ success: boolean; filePath?: string }> {
  try {
    // First get the file path before deleting
    const fileResult = await query(
      `SELECT file_path FROM files
       WHERE file_id = $1 AND user_uuid = $2 AND is_deleted = TRUE`,
      [fileId, userUuid]
    )

    if (fileResult.rows.length === 0) {
      return { success: false }
    }

    const filePath = fileResult.rows[0].file_path

    // Delete from database
    const deleteResult = await query(
      `DELETE FROM files
       WHERE file_id = $1 AND user_uuid = $2 AND is_deleted = TRUE`,
      [fileId, userUuid]
    )

    if (deleteResult.rowCount === 0) {
      return { success: false }
    }

    // Delete physical file
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (fileError) {
      console.error('Error deleting physical file:', fileError)
      // Continue even if physical file deletion fails
    }

    return { success: true, filePath }
  } catch (error) {
    console.error('Error permanently deleting file:', error)
    return { success: false }
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

/**
 * Update file metadata
 */
export async function updateFileMetadata(
  fileId: string,
  userUuid: string,
  updates: { original_name?: string; parent_folder_id?: string | null }
): Promise<{ success: boolean; file?: any; message?: string; code?: string }> {
  try {
    // Verify file exists and belongs to user
    const file = await getFileMetadata(fileId, userUuid)
    if (!file) {
      return {
        success: false,
        message: 'File not found',
        code: 'FILE_NOT_FOUND'
      }
    }

    // Build update query dynamically
    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramIndex = 1

    if (updates.original_name !== undefined) {
      updateFields.push(`original_name = $${paramIndex}`)
      updateValues.push(updates.original_name)
      paramIndex++
    }

    if (updates.parent_folder_id !== undefined) {
      updateFields.push(`parent_folder_id = $${paramIndex}`)
      updateValues.push(updates.parent_folder_id)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return {
        success: false,
        message: 'No fields to update',
        code: 'NO_UPDATES'
      }
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)

    // Add file_id and user_uuid for WHERE clause
    updateValues.push(fileId, userUuid)

    const result = await query(
      `UPDATE files 
       SET ${updateFields.join(', ')}
       WHERE file_id = $${paramIndex} AND user_uuid = $${paramIndex + 1} AND is_deleted = FALSE
       RETURNING file_id, filename, original_name, file_size, mime_type, parent_folder_id, created_at, updated_at`,
      updateValues
    )

    if (result.rowCount === 0) {
      return {
        success: false,
        message: 'File not found or update failed',
        code: 'UPDATE_FAILED'
      }
    }

    return {
      success: true,
      file: result.rows[0]
    }
  } catch (error) {
    console.error('Error updating file metadata:', error)
    return {
      success: false,
      message: 'Failed to update file metadata',
      code: 'UPDATE_ERROR'
    }
  }
}

/**
 * Search files by name
 */
export async function searchFiles(
  userUuid: string,
  searchQuery: string,
  limit: number = 20
): Promise<any[]> {
  const searchPattern = `%${searchQuery}%`
  const exactPattern = `${searchQuery}%`
  const result = await query(
    `SELECT file_id, filename, original_name, file_size, mime_type, parent_folder_id, created_at, updated_at
     FROM files
     WHERE user_uuid = $1 AND is_deleted = FALSE AND original_name ILIKE $2
     ORDER BY 
       CASE 
         WHEN original_name ILIKE $3 THEN 1
         WHEN original_name ILIKE $4 THEN 2
         ELSE 3
       END,
       created_at DESC
     LIMIT $5`,
    [userUuid, searchPattern, exactPattern, searchPattern, limit]
  )
  return result.rows
}

export { MAX_FILE_SIZE }
