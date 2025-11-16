import { Hono } from 'hono'
import { register, login, requestPasswordReset, getCurrentUser } from '../services/auth'

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

export default authRouter
