import { Hono } from 'hono'
import { 
  saveFile, 
  getFileMetadata, 
  getFileStream, 
  listUserFiles, 
  deleteFile,
  permanentlyDeleteFile,
  getUserStorageUsage,
  updateFileMetadata,
  searchFiles,
  toggleStarFile,
  restoreFile,
  MAX_FILE_SIZE
} from '../services/file'
import { getFromSession } from '../utils/db'

const fileRouter = new Hono()

/**
 * POST /files/upload
 * Upload a file
 */
fileRouter.post('/upload', async (c) => {
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

    // Parse multipart form data
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    const parentFolderId = formData.get('parentFolderId') as string | null

    if (!file) {
      return c.json(
        {
          success: false,
          message: 'No file provided',
          code: 'NO_FILE'
        },
        400
      )
    }

    // Save file
    const result = await saveFile(
      user.uuid,
      user.file_bucket_id,
      file,
      parentFolderId || undefined
    )

    if (!result.success) {
      return c.json(result, 400)
    }

    return c.json(result, 201)
  } catch (error) {
    console.error('Upload endpoint error:', error)
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
 * GET /files/:fileId/download
 * Download a file
 */
fileRouter.get('/:fileId/download', async (c) => {
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

    // Get file metadata
    const fileMetadata = await getFileMetadata(fileId, user.uuid)
    if (!fileMetadata) {
      return c.json(
        {
          success: false,
          message: 'File not found',
          code: 'FILE_NOT_FOUND'
        },
        404
      )
    }

    // Get file stream
    const fileStream = getFileStream(fileMetadata.file_path)
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
    c.header('Content-Type', fileMetadata.mime_type || 'application/octet-stream')
    c.header('Content-Disposition', `attachment; filename="${fileMetadata.original_name}"`)
    c.header('Content-Length', fileMetadata.file_size.toString())

    // Stream the file
    return c.body(fileStream as any)
  } catch (error) {
    console.error('Download endpoint error:', error)
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
 * GET /files
 * List user's files
 */
fileRouter.get('/', async (c) => {
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

    // Get query parameters
    const parentFolderId = c.req.query('parentFolderId')
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')
    const includeDeleted = c.req.query('includeDeleted') === 'true'

    // List files
    const files = await listUserFiles(user.uuid, parentFolderId || undefined, limit, offset, includeDeleted)

    return c.json({
      success: true,
      files,
      count: files.length
    })
  } catch (error) {
    console.error('List files endpoint error:', error)
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
 * GET /files/storage/usage
 * Get user's storage usage
 */
fileRouter.get('/storage/usage', async (c) => {
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

    // Get storage usage
    const totalSize = await getUserStorageUsage(user.uuid)
    
    // Get user's storage limit (default to 4GB if not set)
    const userStorageLimit = user.storage_limit || (4 * 1024 * 1024 * 1024)

    return c.json({
      success: true,
      storage: {
        used: totalSize,
        max: userStorageLimit,
        usedFormatted: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
        maxFormatted: `${(userStorageLimit / 1024 / 1024 / 1024).toFixed(2)} GB`
      }
    })
  } catch (error) {
    console.error('Get storage usage endpoint error:', error)
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
 * GET /files/search
 * Search files by name
 */
fileRouter.get('/search', async (c) => {
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

    const searchQuery = c.req.query('q') || ''
    const limit = parseInt(c.req.query('limit') || '20')

    if (!searchQuery || searchQuery.trim().length === 0) {
      return c.json({
        success: true,
        files: [],
        count: 0
      })
    }

    // Search files
    const files = await searchFiles(user.uuid, searchQuery.trim(), limit)

    return c.json({
      success: true,
      files,
      count: files.length
    })
  } catch (error) {
    console.error('Search endpoint error:', error)
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
 * GET /files/:fileId
 * Get file metadata
 */
fileRouter.get('/:fileId', async (c) => {
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

    // Get file metadata
    const fileMetadata = await getFileMetadata(fileId, user.uuid)
    if (!fileMetadata) {
      return c.json(
        {
          success: false,
          message: 'File not found',
          code: 'FILE_NOT_FOUND'
        },
        404
      )
    }

    return c.json({
      success: true,
      file: fileMetadata
    })
  } catch (error) {
    console.error('Get file metadata endpoint error:', error)
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
 * PUT /files/:fileId
 * Update file metadata
 */
fileRouter.put('/:fileId', async (c) => {
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
    const { original_name, parent_folder_id } = body

    // Validate that at least one field is provided
    if (original_name === undefined && parent_folder_id === undefined) {
      return c.json(
        {
          success: false,
          message: 'At least one field (original_name or parent_folder_id) must be provided',
          code: 'INVALID_REQUEST'
        },
        400
      )
    }

    // Update file metadata
    const result = await updateFileMetadata(fileId, user.uuid, {
      original_name,
      parent_folder_id: parent_folder_id === null ? null : parent_folder_id
    })

    if (!result.success) {
      return c.json(result, result.code === 'FILE_NOT_FOUND' ? 404 : 400)
    }

    return c.json({
      success: true,
      file: result.file
    })
  } catch (error) {
    console.error('Update file metadata endpoint error:', error)
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
 * DELETE /files/:fileId
 * Delete a file (soft delete)
 */
fileRouter.delete('/:fileId', async (c) => {
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

    // Delete file (soft delete)
    const deleted = await deleteFile(fileId, user.uuid)
    if (!deleted) {
      return c.json(
        {
          success: false,
          message: 'File not found or already deleted',
          code: 'FILE_NOT_FOUND'
        },
        404
      )
    }

    return c.json({
      success: true,
      message: 'File deleted successfully'
    })
  } catch (error) {
    console.error('Delete endpoint error:', error)
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
 * POST /files/:fileId/star
 * Toggle star status of a file
 */
fileRouter.post('/:fileId/star', async (c) => {
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

    // Toggle star status
    const result = await toggleStarFile(fileId, user.uuid)
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: result.message || 'Failed to toggle star status',
          code: 'STAR_ERROR'
        },
        400
      )
    }

    return c.json({
      success: true,
      is_starred: result.is_starred
    })
  } catch (error) {
    console.error('Star endpoint error:', error)
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
 * POST /files/:fileId/restore
 * Restore a file from trash
 */
fileRouter.post('/:fileId/restore', async (c) => {
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

    // Restore file
    const restored = await restoreFile(fileId, user.uuid)
    if (!restored) {
      return c.json(
        {
          success: false,
          message: 'File not found in trash or restore failed',
          code: 'FILE_NOT_FOUND'
        },
        404
      )
    }

    return c.json({
      success: true,
      message: 'File restored successfully'
    })
  } catch (error) {
    console.error('Restore endpoint error:', error)
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
 * DELETE /files/:fileId/permanent
 * Permanently delete a file from trash
 */
fileRouter.delete('/:fileId/permanent', async (c) => {
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

    // Permanently delete file
    const result = await permanentlyDeleteFile(fileId, user.uuid)
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: 'File not found in trash or already deleted',
          code: 'FILE_NOT_FOUND'
        },
        404
      )
    }

    return c.json({
      success: true,
      message: 'File permanently deleted'
    })
  } catch (error) {
    console.error('Permanent delete endpoint error:', error)
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

export default fileRouter
