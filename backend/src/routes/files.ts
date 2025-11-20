import { Hono } from 'hono'
import { 
  saveFile, 
  getFileMetadata, 
  getFileStream, 
  listUserFiles, 
  deleteFile,
  getUserStorageUsage,
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

    // List files
    const files = await listUserFiles(user.uuid, parentFolderId || undefined, limit, offset)

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

    return c.json({
      success: true,
      storage: {
        used: totalSize,
        max: MAX_FILE_SIZE,
        usedFormatted: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
        maxFormatted: `${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)} MB`
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

export default fileRouter
