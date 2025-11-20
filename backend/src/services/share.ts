import { query } from '../utils/db'
import { getFileMetadata, getFileStream } from './file'
import { v4 as uuidv4 } from 'uuid'

export interface ShareFileParams {
  fileId: string
  sharedBy: string
  sharedWith?: string
  permission: 'read' | 'write' | 'admin'
}

export interface PublicShareParams {
  fileId: string
  sharedBy: string
  permission: 'read' | 'write' | 'admin'
  expiresAt?: Date
}

/**
 * Share file with a specific user
 */
export async function shareFileWithUser(params: ShareFileParams): Promise<{
  success: boolean
  share?: any
  message?: string
  code?: string
}> {
  try {
    const { fileId, sharedBy, sharedWith, permission } = params

    // Validate permission
    if (!['read', 'write', 'admin'].includes(permission)) {
      return {
        success: false,
        message: 'Invalid permission. Must be read, write, or admin',
        code: 'INVALID_PERMISSION'
      }
    }

    // Verify file exists and belongs to the sharer
    const file = await getFileMetadata(fileId, sharedBy)
    if (!file) {
      return {
        success: false,
        message: 'File not found',
        code: 'FILE_NOT_FOUND'
      }
    }

    // Verify shared_with user exists if provided
    if (sharedWith) {
      const userResult = await query('SELECT uuid FROM users WHERE uuid = $1', [sharedWith])
      if (!userResult.rows[0]) {
        return {
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      }

      // Check if share already exists
      const existingShare = await query(
        `SELECT share_id FROM file_shares 
         WHERE file_id = $1 AND shared_by = $2 AND shared_with = $3 AND (expires_at IS NULL OR expires_at > NOW())`,
        [fileId, sharedBy, sharedWith]
      )

      if (existingShare.rows[0]) {
        // Update existing share
        const result = await query(
          `UPDATE file_shares 
           SET permission = $1, updated_at = CURRENT_TIMESTAMP
           WHERE share_id = $2
           RETURNING share_id, file_id, shared_by, shared_with, permission, created_at`,
          [permission, existingShare.rows[0].share_id]
        )

        return {
          success: true,
          share: result.rows[0]
        }
      }
    }

    // Create new share
    const shareId = uuidv4()
    const result = await query(
      `INSERT INTO file_shares (share_id, file_id, shared_by, shared_with, permission, is_public)
       VALUES ($1, $2, $3, $4, $5, FALSE)
       RETURNING share_id, file_id, shared_by, shared_with, permission, created_at`,
      [shareId, fileId, sharedBy, sharedWith || null, permission]
    )

    return {
      success: true,
      share: result.rows[0]
    }
  } catch (error) {
    console.error('Error sharing file:', error)
    return {
      success: false,
      message: 'Failed to share file',
      code: 'SHARE_ERROR'
    }
  }
}

/**
 * Create public share link
 */
export async function createPublicShare(params: PublicShareParams): Promise<{
  success: boolean
  share?: any
  shareToken?: string
  message?: string
  code?: string
}> {
  try {
    const { fileId, sharedBy, permission, expiresAt } = params

    // Validate permission
    if (!['read', 'write', 'admin'].includes(permission)) {
      return {
        success: false,
        message: 'Invalid permission. Must be read, write, or admin',
        code: 'INVALID_PERMISSION'
      }
    }

    // Verify file exists and belongs to the sharer
    const file = await getFileMetadata(fileId, sharedBy)
    if (!file) {
      return {
        success: false,
        message: 'File not found',
        code: 'FILE_NOT_FOUND'
      }
    }

    // Generate unique share token
    const shareToken = uuidv4()

    // Create public share
    const shareId = uuidv4()
    const result = await query(
      `INSERT INTO file_shares (share_id, file_id, shared_by, share_token, permission, is_public, expires_at)
       VALUES ($1, $2, $3, $4, $5, TRUE, $6)
       RETURNING share_id, file_id, share_token, permission, is_public, expires_at, created_at`,
      [shareId, fileId, sharedBy, shareToken, permission, expiresAt || null]
    )

    return {
      success: true,
      share: result.rows[0],
      shareToken
    }
  } catch (error) {
    console.error('Error creating public share:', error)
    return {
      success: false,
      message: 'Failed to create public share',
      code: 'SHARE_ERROR'
    }
  }
}

/**
 * Access shared file by token
 */
export async function getSharedFileByToken(token: string): Promise<{
  success: boolean
  file?: any
  share?: any
  message?: string
  code?: string
}> {
  try {
    // Get share by token
    const shareResult = await query(
      `SELECT s.*, f.file_id, f.filename, f.original_name, f.file_path, f.file_size, f.mime_type, f.created_at
       FROM file_shares s
       JOIN files f ON s.file_id = f.file_id
       WHERE s.share_token = $1 
         AND s.is_public = TRUE 
         AND f.is_deleted = FALSE
         AND (s.expires_at IS NULL OR s.expires_at > NOW())`,
      [token]
    )

    if (!shareResult.rows[0]) {
      return {
        success: false,
        message: 'Share not found or expired',
        code: 'SHARE_NOT_FOUND'
      }
    }

    const share = shareResult.rows[0]

    return {
      success: true,
      file: {
        file_id: share.file_id,
        original_name: share.original_name,
        file_path: share.file_path,
        file_size: share.file_size,
        mime_type: share.mime_type,
        created_at: share.created_at
      },
      share: {
        permission: share.permission,
        expires_at: share.expires_at
      }
    }
  } catch (error) {
    console.error('Error accessing shared file:', error)
    return {
      success: false,
      message: 'Failed to access shared file',
      code: 'ACCESS_ERROR'
    }
  }
}

/**
 * Get shared file stream for download
 */
export function getSharedFileStream(filePath: string): any {
  return getFileStream(filePath)
}

/**
 * Delete share
 */
export async function deleteShare(shareId: string, userUuid: string): Promise<{
  success: boolean
  message?: string
  code?: string
}> {
  try {
    // Verify share exists and user is the owner
    const shareResult = await query(
      `SELECT share_id FROM file_shares WHERE share_id = $1 AND shared_by = $2`,
      [shareId, userUuid]
    )

    if (!shareResult.rows[0]) {
      return {
        success: false,
        message: 'Share not found or unauthorized',
        code: 'SHARE_NOT_FOUND'
      }
    }

    // Delete share
    await query('DELETE FROM file_shares WHERE share_id = $1', [shareId])

    return {
      success: true
    }
  } catch (error) {
    console.error('Error deleting share:', error)
    return {
      success: false,
      message: 'Failed to delete share',
      code: 'DELETE_ERROR'
    }
  }
}

/**
 * Get shares for a file
 */
export async function getFileShares(fileId: string, userUuid: string): Promise<any[]> {
  const result = await query(
    `SELECT s.share_id, s.shared_with, s.share_token, s.permission, s.is_public, s.expires_at, s.created_at,
            u.username as shared_with_username, u.email as shared_with_email
     FROM file_shares s
     LEFT JOIN users u ON s.shared_with = u.uuid
     WHERE s.file_id = $1 AND s.shared_by = $2
     ORDER BY s.created_at DESC`,
    [fileId, userUuid]
  )
  return result.rows
}

