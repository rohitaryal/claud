import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { createUser, createSession, query, getUserDetails } from '../utils/db'

export interface AuthResponse {
  success: boolean
  message: string
  user?: {
    uuid: string
    username: string
    email: string
  }
  session?: string
}

export interface AuthError {
  success: false
  message: string
  code: string
}

/**
 * Register a new user
 */
export async function register(
  username: string,
  email: string,
  password: string
): Promise<AuthResponse | AuthError> {
  try {
    // Validate input
    if (!username || username.length < 3) {
      return {
        success: false,
        message: 'Username must be at least 3 characters',
        code: 'INVALID_USERNAME'
      }
    }

    if (!email || !email.includes('@')) {
      return {
        success: false,
        message: 'Invalid email address',
        code: 'INVALID_EMAIL'
      }
    }

    if (!password || password.length < 8) {
      return {
        success: false,
        message: 'Password must be at least 8 characters',
        code: 'WEAK_PASSWORD'
      }
    }

    // Check if user already exists
    const existingResult = await query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    )

    if (existingResult.rowCount && existingResult.rowCount > 0) {
      return {
        success: false,
        message: 'Email or username already registered',
        code: 'USER_EXISTS'
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create file bucket ID
    const fileBucketID = uuidv4()

    // Create user
    const user = await createUser(username, email, hashedPassword, fileBucketID)

    // Create session
    const sessionId = uuidv4()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await createSession(user.uuid, sessionId, expiresAt)

    return {
      success: true,
      message: 'User registered successfully',
      user: {
        uuid: user.uuid,
        username: user.username,
        email: user.email
      },
      session: sessionId
    }
  } catch (error) {
    console.error('Register error:', error)
    return {
      success: false,
      message: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    }
  }
}

/**
 * Login user
 */
export async function login(
  emailOrUsername: string,
  password: string
): Promise<AuthResponse | AuthError> {
  try {
    if (!emailOrUsername || !password) {
      return {
        success: false,
        message: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      }
    }

    // Find user by email or username
    const result = await query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [emailOrUsername, emailOrUsername]
    )

    if (!result.rows[0]) {
      return {
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      }
    }

    const user = result.rows[0]

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.hashed_password)

    if (!passwordMatch) {
      return {
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      }
    }

    // Create session
    const sessionId = uuidv4()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await createSession(user.uuid, sessionId, expiresAt)

    return {
      success: true,
      message: 'Login successful',
      user: {
        uuid: user.uuid,
        username: user.username,
        email: user.email
      },
      session: sessionId
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      message: 'Login failed',
      code: 'LOGIN_ERROR'
    }
  }
}

/**
 * Request password reset (mock - in production would send email)
 */
export async function requestPasswordReset(
  email: string
): Promise<AuthResponse | AuthError> {
  try {
    if (!email || !email.includes('@')) {
      return {
        success: false,
        message: 'Invalid email address',
        code: 'INVALID_EMAIL'
      }
    }

    // Check if user exists
    const result = await query('SELECT uuid FROM users WHERE email = $1', [email])

    if (!result.rows[0]) {
      // For security, don't reveal if email exists
      return {
        success: true,
        message: 'If account exists, password reset link sent to email'
      }
    }

    // In production: generate token, save to DB, send email
    // For now, just return success
    console.log(`Password reset requested for: ${email}`)

    return {
      success: true,
      message: 'If account exists, password reset link sent to email'
    }
  } catch (error) {
    console.error('Password reset error:', error)
    return {
      success: false,
      message: 'Password reset request failed',
      code: 'RESET_ERROR'
    }
  }
}

/**
 * Get current user from session
 */
export async function getCurrentUser(sessionId: string) {
  try {
    const result = await query(
      `SELECT u.uuid, u.username, u.email, u.created_at 
       FROM users u
       JOIN sessions s ON u.uuid = s.user_uuid
       WHERE s.session_id = $1 AND s.expires_at > NOW()`,
      [sessionId]
    )

    return result.rows[0] || null
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}
