import { query } from '../utils/db'
import { getFileMetadata, getFileStream } from './file'
import { v4 as uuidv4 } from 'uuid'

export interface ShareFileParams {
  fileId: string
  sharedBy: string
  sharedWith?: string
  permission: 'read' | 'write' | 'admin'
  /**
   * If true, generate a share token for this private share so it can be
   * accessed via a link. Defaults to false.
   */
  createLink?: boolean
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
    const { fileId, sharedBy, sharedWith, permission, createLink } = params

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

    // Check if file is already shared (publicly or with this user)
    const existingShare = await query(
      `SELECT share_id FROM file_shares 
       WHERE file_id = $1 AND (
         (is_public = TRUE AND (expires_at IS NULL OR expires_at > NOW()))
         OR (shared_with = $2 AND (expires_at IS NULL OR expires_at > NOW()))
       )`,
      [fileId, sharedWith || null]
    )

    if (existingShare.rows.length > 0) {
      return {
        success: false,
        message: 'File is already shared',
        code: 'ALREADY_SHARED'
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

    // Create new share. If createLink is true, generate a share_token
    const shareId = uuidv4()
    if (createLink) {
      const shareToken = uuidv4()
      const result = await query(
        `INSERT INTO file_shares (share_id, file_id, shared_by, shared_with, share_token, permission, is_public)
         VALUES ($1, $2, $3, $4, $5, $6, FALSE)
         RETURNING share_id, file_id, shared_by, shared_with, share_token, permission, created_at`,
        [shareId, fileId, sharedBy, sharedWith || null, shareToken, permission]
      )

      return {
        success: true,
        share: result.rows[0]
      }
    }

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

    // Check if file is already publicly shared
    const existingPublicShare = await query(
      `SELECT share_id FROM file_shares 
       WHERE file_id = $1 AND is_public = TRUE AND (expires_at IS NULL OR expires_at > NOW())`,
      [fileId]
    )

    if (existingPublicShare.rows.length > 0) {
      return {
        success: false,
        message: 'File is already publicly shared',
        code: 'ALREADY_SHARED'
      }
    }

    // Generate unique share token
    const shareToken = uuidv4()

    // Create public share
    const shareId = uuidv4()
    const result = await query(
      `INSERT INTO file_shares (share_id, file_id, shared_by, shared_with, share_token, permission, is_public, expires_at)
       VALUES ($1, $2, $3, NULL, $4, $5, TRUE, $6)
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
export async function getSharedFileByToken(token: string, userUuid?: string): Promise<{
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

    // If the share is private (is_public = FALSE) and tied to a specific recipient
    // enforce that the requester (if present) matches the recipient.
    // If the share has no `shared_with` (link-only private share), allow access
    // without authentication. If the share is public, allow access without auth.
    if (!share.is_public) {
      if (share.shared_with) {
        if (!userUuid) {
          return {
            success: false,
            message: 'Authentication required to access this share',
            code: 'NOT_AUTHENTICATED'
          }
        }

        if (userUuid !== share.shared_with) {
          return {
            success: false,
            message: 'Unauthorized to access this share',
            code: 'UNAUTHORIZED'
          }
        }
      }
      // else: private link without shared_with => anyone with token can access
    }

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
        expires_at: share.expires_at,
        is_public: share.is_public,
        shared_with: share.shared_with || null
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

/**
 * List all publicly shared files (global pool)
 * Only returns files where is_public = TRUE and shared_with IS NULL
 */
export async function listPublicFiles(limit: number = 50, offset: number = 0): Promise<any[]> {
  const result = await query(
    `SELECT f.file_id, f.original_name, f.file_size, f.mime_type, f.created_at,
            s.share_id, s.share_token, s.permission, s.created_at as shared_at,
            u.username as shared_by_username
     FROM file_shares s
     JOIN files f ON s.file_id = f.file_id
     JOIN users u ON s.shared_by = u.uuid
     WHERE s.is_public = TRUE
       AND s.shared_with IS NULL
       AND f.is_deleted = FALSE
       AND (s.expires_at IS NULL OR s.expires_at > NOW())
     ORDER BY s.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  return result.rows
}

/**
 * List files shared with the current user (private shares)
 */
export async function listSharedWithMe(userUuid: string, limit: number = 50, offset: number = 0): Promise<any[]> {
  const result = await query(
    `SELECT f.file_id, f.original_name, f.file_size, f.mime_type, f.created_at,
            s.share_id, s.permission, s.created_at as shared_at,
            u.username as shared_by_username, u.uuid as shared_by_uuid
     FROM file_shares s
     JOIN files f ON s.file_id = f.file_id
     JOIN users u ON s.shared_by = u.uuid
     WHERE s.shared_with = $1 
       AND s.is_public = FALSE
       AND f.is_deleted = FALSE
       AND (s.expires_at IS NULL OR s.expires_at > NOW())
     ORDER BY s.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userUuid, limit, offset]
  )
  return result.rows
}

/**
 * Remove a file from "Shared With Me" for a specific user
 * The recipient can remove access without deleting the share
 */
export async function removeFromSharedWithMe(shareId: string, userUuid: string): Promise<{
  success: boolean
  message?: string
  code?: string
}> {
  try {
    // Verify share exists and user is the recipient
    const shareResult = await query(
      `SELECT share_id FROM file_shares WHERE share_id = $1 AND shared_with = $2 AND is_public = FALSE`,
      [shareId, userUuid]
    )

    if (!shareResult.rows[0]) {
      return {
        success: false,
        message: 'Share not found or unauthorized',
        code: 'SHARE_NOT_FOUND'
      }
    }

    // Delete share (recipient perspective - removes it from their shared with me)
    await query('DELETE FROM file_shares WHERE share_id = $1', [shareId])

    return {
      success: true
    }
  } catch (error) {
    console.error('Error removing from shared with me:', error)
    return {
      success: false,
      message: 'Failed to remove from shared with me',
      code: 'DELETE_ERROR'
    }
  }
}

