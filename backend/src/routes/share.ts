import { Hono } from 'hono'
import {
  shareFileWithUser,
  createPublicShare,
  getSharedFileByToken,
  getSharedFileStream,
  deleteShare,
  getFileShares,
  listPublicFiles,
  listSharedWithMe,
  removeFromSharedWithMe
} from '../services/share'
import { getFileMetadata, getFileStream } from '../services/file'
import { getFromSession, query } from '../utils/db'

const shareRouter = new Hono()

/**
 * POST /files/:fileId/share
 * Share file with a specific user
 */
shareRouter.post('/files/:fileId/share', async (c) => {
  try {
    // Get session from cookie
    const cookies = c.req.header('Cookie')
    if (!cookies) {
      return c.json(
        {
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        401
      )
    }

    const sessionMatch = cookies.match(/session=([^;]+)/)
    if (!sessionMatch) {
      return c.json(
        {
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        401
      )
    }

    const sessionId = Buffer.from(sessionMatch[1], 'base64').toString('utf-8').split(':')[0]
    const user = await getFromSession(sessionId)

    if (!user) {
      return c.json(
        {
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        401
      )
    }

    const fileId = c.req.param('fileId')
    const body = await c.req.json()
    const { shared_with, permission = 'read' } = body

    if (!shared_with) {
      return c.json(
        {
          success: false,
          message: 'shared_with (user UUID) is required',
          code: 'MISSING_USER'
        },
        400
      )
    }

    const result = await shareFileWithUser({
      fileId,
      sharedBy: user.uuid,
      sharedWith: shared_with,
      permission
    })

    if (!result.success) {
      return c.json(result, result.code === 'FILE_NOT_FOUND' || result.code === 'USER_NOT_FOUND' ? 404 : 400)
    }

    return c.json({
      success: true,
      share: result.share
    }, 201)
  } catch (error) {
    console.error('Share file endpoint error:', error)
    return c.json(
      {
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      },
      500
    )
  }
})

/**
 * POST /files/:fileId/share/public
 * Create public share link
 */
shareRouter.post('/files/:fileId/share/public', async (c) => {
  try {
    // Get session from cookie
    const cookies = c.req.header('Cookie')
    if (!cookies) {
      return c.json(
        {
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        401
      )
    }

    const sessionMatch = cookies.match(/session=([^;]+)/)
    if (!sessionMatch) {
      return c.json(
        {
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        401
      )
    }

    const sessionId = Buffer.from(sessionMatch[1], 'base64').toString('utf-8').split(':')[0]
    const user = await getFromSession(sessionId)

    if (!user) {
      return c.json(
        {
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        401
      )
    }

    const fileId = c.req.param('fileId')
    const body = await c.req.json()
    const { permission = 'read', expires_at } = body

    const expiresAt = expires_at ? new Date(expires_at) : undefined

    const result = await createPublicShare({
      fileId,
      sharedBy: user.uuid,
      permission,
      expiresAt
    })

    if (!result.success) {
      return c.json(result, result.code === 'FILE_NOT_FOUND' ? 404 : 400)
    }

    return c.json({
      success: true,
      share: result.share,
      shareToken: result.shareToken,
      shareUrl: `/api/share/${result.shareToken}`
    }, 201)
  } catch (error) {
    console.error('Create public share endpoint error:', error)
    return c.json(
      {
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      },
      500
    )
  }
})

/**
 * GET /share/public
 * List all publicly shared files (global pool)
 */
shareRouter.get('/share/public', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')

    const files = await listPublicFiles(limit, offset)

    return c.json({
      success: true,
      files,
      count: files.length
    })
  } catch (error) {
    console.error('List public files endpoint error:', error)
    return c.json(
      {
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      },
      500
    )
  }
})

/**
 * GET /share/with-me
 * List files shared with the current user (private shares)
 */
shareRouter.get('/share/with-me', async (c) => {
  try {
    // Get session from cookie
    const cookies = c.req.header('Cookie')
    if (!cookies) {
      return c.json(
        {
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        401
      )
    }

    const sessionMatch = cookies.match(/session=([^;]+)/)
    if (!sessionMatch) {
      return c.json(
        {
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        401
      )
    }

    const sessionId = Buffer.from(sessionMatch[1], 'base64').toString('utf-8').split(':')[0]
    const user = await getFromSession(sessionId)

    if (!user) {
      return c.json(
        {
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        401
      )
    }

    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')

    const files = await listSharedWithMe(user.uuid, limit, offset)

    return c.json({
      success: true,
      files,
      count: files.length
    })
  } catch (error) {
    console.error('List shared with me endpoint error:', error)
    return c.json(
      {
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      },
      500
    )
  }
})

/**
 * GET /share/:token
 * Access shared file by token
 */
shareRouter.get('/share/:token', async (c) => {
  try {
    const token = c.req.param('token')
    // Try to get session user (optional)
    const cookies = c.req.header('Cookie')
    let user: any | undefined
    if (cookies) {
      const sessionMatch = cookies.match(/session=([^;]+)/)
      if (sessionMatch) {
        try {
          const sessionId = Buffer.from(sessionMatch[1], 'base64').toString('utf-8').split(':')[0]
          user = await getFromSession(sessionId)
        } catch (e) {
          // ignore and treat as unauthenticated
        }
      }
    }

    const result = await getSharedFileByToken(token, user?.uuid)

    if (!result.success) {
      if (result.code === 'SHARE_NOT_FOUND') return c.json(result, 404)
      if (result.code === 'NOT_AUTHENTICATED') return c.json(result, 401)
      if (result.code === 'UNAUTHORIZED') return c.json(result, 403)
      return c.json(result, 400)
    }

    return c.json({
      success: true,
      file: result.file,
      share: result.share
    })
  } catch (error) {
    console.error('Get shared file endpoint error:', error)
    return c.json(
      {
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      },
      500
    )
  }
})

/**
 * GET /share/:token/download
 * Download shared file by token
 */
shareRouter.get('/share/:token/download', async (c) => {
  try {
    const token = c.req.param('token')
    // Try to get session user (optional)
    const cookies = c.req.header('Cookie')
    let user: any | undefined
    if (cookies) {
      const sessionMatch = cookies.match(/session=([^;]+)/)
      if (sessionMatch) {
        try {
          const sessionId = Buffer.from(sessionMatch[1], 'base64').toString('utf-8').split(':')[0]
          user = await getFromSession(sessionId)
        } catch (e) {
          // ignore and treat as unauthenticated
        }
      }
    }

    const result = await getSharedFileByToken(token, user?.uuid)

    if (!result.success) {
      if (result.code === 'SHARE_NOT_FOUND') return c.json(result, 404)
      if (result.code === 'NOT_AUTHENTICATED') return c.json(result, 401)
      if (result.code === 'UNAUTHORIZED') return c.json(result, 403)
      return c.json(result, 400)
    }

    // Get file metadata including path
    const file = result.file

    // Get file stream
    const fileStream = getSharedFileStream(file.file_path)
    if (!fileStream) {
      return c.json(
        {
          success: false,
          message: 'File not found on disk',
          code: 'FILE_NOT_FOUND'
        },
        404
      )
    }

    // Set appropriate headers
    c.header('Content-Type', file.mime_type || 'application/octet-stream')
    c.header('Content-Disposition', `attachment; filename="${file.original_name}"`)
    c.header('Content-Length', file.file_size.toString())

    // Stream the file
    return c.body(fileStream as any)
  } catch (error) {
    console.error('Download shared file endpoint error:', error)
    return c.json(
      {
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      },
      500
    )
  }
})

/**
 * DELETE /share/:shareId
 * Remove share access
 */
shareRouter.delete('/share/:shareId', async (c) => {
  try {
    // Get session from cookie
    const cookies = c.req.header('Cookie')
    if (!cookies) {
      return c.json(
        {
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        401
      )
    }

    const sessionMatch = cookies.match(/session=([^;]+)/)
    if (!sessionMatch) {
      return c.json(
        {
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        401
      )
    }

    const sessionId = Buffer.from(sessionMatch[1], 'base64').toString('utf-8').split(':')[0]
    const user = await getFromSession(sessionId)

    if (!user) {
      return c.json(
        {
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        401
      )
    }

    const shareId = c.req.param('shareId')

    const result = await deleteShare(shareId, user.uuid)

    if (!result.success) {
      return c.json(result, result.code === 'SHARE_NOT_FOUND' ? 404 : 400)
    }

    return c.json({
      success: true,
      message: 'Share deleted successfully'
    })
  } catch (error) {
    console.error('Delete share endpoint error:', error)
    return c.json(
      {
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      },
      500
    )
  }
})

/**
 * GET /files/:fileId/shares
 * Get all shares for a file
 */
shareRouter.get('/files/:fileId/shares', async (c) => {
  try {
    // Get session from cookie
    const cookies = c.req.header('Cookie')
    if (!cookies) {
      return c.json(
        {
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        401
      )
    }

    const sessionMatch = cookies.match(/session=([^;]+)/)
    if (!sessionMatch) {
      return c.json(
        {
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        401
      )
    }

    const sessionId = Buffer.from(sessionMatch[1], 'base64').toString('utf-8').split(':')[0]
    const user = await getFromSession(sessionId)

    if (!user) {
      return c.json(
        {
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        401
      )
    }

    const fileId = c.req.param('fileId')

    // Verify file belongs to user
    const file = await getFileMetadata(fileId, user.uuid)
    if (!file) {
      return c.json(
        {
          success: false,
          message: 'File not found',
          code: 'FILE_NOT_FOUND'
        },
        404
      )
    }

    const shares = await getFileShares(fileId, user.uuid)

    return c.json({
      success: true,
      shares
    })
  } catch (error) {
    console.error('Get file shares endpoint error:', error)
    return c.json(
      {
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      },
      500
    )
  }
})

/**
 * DELETE /share/file/:fileId
 * Remove all shares for a file (owner action to unshare)
 */
shareRouter.delete('/share/file/:fileId', async (c) => {
  try {
    // Get session from cookie
    const cookies = c.req.header('Cookie')
    if (!cookies) {
      return c.json(
        {
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        401
      )
    }

    const sessionMatch = cookies.match(/session=([^;]+)/)
    if (!sessionMatch) {
      return c.json(
        {
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        401
      )
    }

    const sessionId = Buffer.from(sessionMatch[1], 'base64').toString('utf-8').split(':')[0]
    const user = await getFromSession(sessionId)

    if (!user) {
      return c.json(
        {
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        401
      )
    }

    const fileId = c.req.param('fileId')

    // Verify file belongs to user
    const file = await getFileMetadata(fileId, user.uuid)
    if (!file) {
      return c.json(
        {
          success: false,
          message: 'File not found',
          code: 'FILE_NOT_FOUND'
        },
        404
      )
    }

    // Delete all shares for this file
    const result = await query(
      'DELETE FROM file_shares WHERE file_id = $1 AND shared_by = $2',
      [fileId, user.uuid]
    )

    return c.json({
      success: true,
      message: 'All shares removed successfully',
      deletedCount: result.rowCount || 0
    })
  } catch (error) {
    console.error('Unshare file endpoint error:', error)
    return c.json(
      {
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      },
      500
    )
  }
})

/**
 * DELETE /share/with-me/:shareId
 * Remove a file from "Shared With Me" for the recipient
 */
shareRouter.delete('/share/with-me/:shareId', async (c) => {
  try {
    // Get session from cookie
    const cookies = c.req.header('Cookie')
    if (!cookies) {
      return c.json(
        {
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        401
      )
    }

    const sessionMatch = cookies.match(/session=([^;]+)/)
    if (!sessionMatch) {
      return c.json(
        {
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        401
      )
    }

    const sessionId = Buffer.from(sessionMatch[1], 'base64').toString('utf-8').split(':')[0]
    const user = await getFromSession(sessionId)

    if (!user) {
      return c.json(
        {
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        401
      )
    }

    const shareId = c.req.param('shareId')

    const result = await removeFromSharedWithMe(shareId, user.uuid)

    if (!result.success) {
      return c.json(result, result.code === 'SHARE_NOT_FOUND' ? 404 : 400)
    }

    return c.json({
      success: true,
      message: 'Share removed successfully'
    })
  } catch (error) {
    console.error('Remove from shared with me endpoint error:', error)
    return c.json(
      {
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      },
      500
    )
  }
})

export default shareRouter

