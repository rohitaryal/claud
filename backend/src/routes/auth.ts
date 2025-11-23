import { Hono } from 'hono'
import { register, login, requestPasswordReset, getCurrentUser, changePassword, updateUsername, deleteAccount, updateProfilePicture, updateStorageLimit, updateEmail, getUserByEmail } from '../services/auth'
import { deleteSession, getFromSession } from '../utils/db'
import { saveFile } from '../services/file'
import { v4 as uuidv4 } from 'uuid'

const authRouter = new Hono()

/**
 * POST /auth/register
 * Register a new user
 */
authRouter.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const { username, email, password } = body

    const result = await register(username, email, password)

    if (!result.success) {
      return c.json(result, 400)
    }

    // Set session cookie
    const cookie = Buffer.from([result.session, username, result.user?.uuid || ''].join(':')).toString('base64').split('=').join('')
    c.header('Set-Cookie', `session=${cookie}; Path=/; HttpOnly; SameSite=Strict`)

    return c.json(result, 201)
  } catch (error) {
    console.error('Register endpoint error:', error)
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
 * POST /auth/login
 * Login user
 */
authRouter.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const { email, password } = body

    const result = await login(email, password)

    if (!result.success) {
      return c.json(result, 401)
    }

    // Set session cookie
    const cookie = Buffer.from([result.session, result.user?.username || '', result.user?.uuid || ''].join(':')).toString('base64').split('=').join('')
    c.header('Set-Cookie', `session=${cookie}; Path=/; HttpOnly; SameSite=Strict`)

    return c.json(result, 200)
  } catch (error) {
    console.error('Login endpoint error:', error)
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
 * POST /auth/forgot-password
 * Request password reset
 */
authRouter.post('/forgot-password', async (c) => {
  try {
    const body = await c.req.json()
    const { email } = body

    const result = await requestPasswordReset(email)

    return c.json(result, 200)
  } catch (error) {
    console.error('Forgot password endpoint error:', error)
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
 * GET /auth/me
 * Get current user
 */
authRouter.get('/me', async (c) => {
  try {
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

    // Parse session from cookie
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

    const user = await getCurrentUser(sessionId)

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

    return c.json(
      {
        success: true,
        user
      },
      200
    )
  } catch (error) {
    console.error('Get me endpoint error:', error)
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
 * POST /auth/logout
 * Logout user
 */
authRouter.post('/logout', async (c) => {
  try {
    // Get session from cookie
    const cookies = c.req.header('Cookie')
    if (cookies) {
      const sessionMatch = cookies.match(/session=([^;]+)/)
      if (sessionMatch) {
        try {
          const sessionId = Buffer.from(sessionMatch[1], 'base64').toString('utf-8').split(':')[0]
          // Delete session from database
          await deleteSession(sessionId)
        } catch (error) {
          // If session parsing fails, continue with logout anyway
          console.error('Error parsing session during logout:', error)
        }
      }
    }

    // Clear session cookie
    c.header('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')

    return c.json(
      {
        success: true,
        message: 'Logged out successfully'
      },
      200
    )
  } catch (error) {
    console.error('Logout endpoint error:', error)
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
 * POST /auth/change-password
 * Change user password
 */
authRouter.post('/change-password', async (c) => {
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

    const body = await c.req.json()
    const { currentPassword, newPassword } = body

    const result = await changePassword(user.uuid, currentPassword, newPassword)

    if (!result.success) {
      return c.json(result, 400)
    }

    return c.json(result, 200)
  } catch (error) {
    console.error('Change password endpoint error:', error)
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
 * PUT /auth/update-username
 * Update username
 */
authRouter.put('/update-username', async (c) => {
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

    const body = await c.req.json()
    const { username } = body

    const result = await updateUsername(user.uuid, username)

    if (!result.success) {
      return c.json(result, 400)
    }

    return c.json(result, 200)
  } catch (error) {
    console.error('Update username endpoint error:', error)
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
 * DELETE /auth/delete-account
 * Delete user account
 */
authRouter.delete('/delete-account', async (c) => {
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

    const result = await deleteAccount(user.uuid)

    if (!result.success) {
      return c.json(result, 400)
    }

    // Clear session cookie
    c.header('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')

    return c.json(result, 200)
  } catch (error) {
    console.error('Delete account endpoint error:', error)
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
 * POST /auth/upload-profile-picture
 * Upload profile picture
 */
authRouter.post('/upload-profile-picture', async (c) => {
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

    // Validate file type (only images)
    if (!file.type.startsWith('image/')) {
      return c.json(
        {
          success: false,
          message: 'File must be an image',
          code: 'INVALID_FILE_TYPE'
        },
        400
      )
    }

    // Validate file size (max 5MB for profile pictures)
    const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_PROFILE_PICTURE_SIZE) {
      return c.json(
        {
          success: false,
          message: 'Profile picture must be less than 5MB',
          code: 'FILE_TOO_LARGE'
        },
        400
      )
    }

    // Save file
    const result = await saveFile(
      user.uuid,
      user.file_bucket_id,
      file
    )

    if (!result.success || !result.file) {
      return c.json(result, 400)
    }

    // Update user's profile_picture_url to point to the file download endpoint
    const profilePictureUrl = `/api/files/${result.file.file_id}/download`
    const updateResult = await updateProfilePicture(user.uuid, profilePictureUrl)

    if (!updateResult.success) {
      return c.json(updateResult, 400)
    }

    return c.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profile_picture_url: profilePictureUrl,
      user: updateResult.user
    }, 200)
  } catch (error) {
    console.error('Upload profile picture endpoint error:', error)
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
 * PUT /auth/update-email
 * Update user email
 */
authRouter.put('/update-email', async (c) => {
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

    const body = await c.req.json()
    const { email } = body

    const result = await updateEmail(user.uuid, email)

    if (!result.success) {
      return c.json(result, 400)
    }

    return c.json(result, 200)
  } catch (error) {
    console.error('Update email endpoint error:', error)
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
 * PUT /auth/update-storage-limit
 * Update user storage limit
 */
authRouter.put('/update-storage-limit', async (c) => {
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

    const body = await c.req.json()
    const { storageLimitGB } = body

    const result = await updateStorageLimit(user.uuid, storageLimitGB)

    if (!result.success) {
      return c.json(result, 400)
    }

    return c.json(result, 200)
  } catch (error) {
    console.error('Update storage limit endpoint error:', error)
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
 * GET /auth/user-by-email
 * Get user information by email (for sharing)
 */
authRouter.get('/user-by-email', async (c) => {
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

    const email = c.req.query('email')
    if (!email) {
      return c.json(
        {
          success: false,
          message: 'Email parameter is required',
          code: 'MISSING_EMAIL'
        },
        400
      )
    }

    const result = await getUserByEmail(email)
    return c.json(result, result.success ? 200 : 404)
  } catch (error) {
    console.error('Get user by email endpoint error:', error)
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

export default authRouter
