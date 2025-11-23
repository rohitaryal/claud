import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { createUser, createSession, query, getUserDetails } from '../utils/db'

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<{
  success: boolean
  user?: { uuid: string; username: string; email: string }
  message?: string
}> {
  try {
    const result = await query(
      'SELECT uuid, username, email FROM users WHERE email = $1',
      [email]
    )
    
    if (result.rows[0]) {
      return {
        success: true,
        user: result.rows[0]
      }
    }
    
    return {
      success: false,
      message: 'User not found'
    }
  } catch (error) {
    console.error('Get user by email error:', error)
    return {
      success: false,
      message: 'Failed to fetch user'
    }
  }
}

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
        email: user.email,
        profile_picture_url: user.profile_picture_url || null
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
        email: user.email,
        profile_picture_url: user.profile_picture_url || null
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
      `SELECT u.uuid, u.username, u.email, u.profile_picture_url, u.storage_limit, u.created_at 
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

/**
 * Change user password
 */
export async function changePassword(
  userUuid: string,
  currentPassword: string,
  newPassword: string
): Promise<AuthResponse | AuthError> {
  try {
    if (!newPassword || newPassword.length < 8) {
      return {
        success: false,
        message: 'Password must be at least 8 characters',
        code: 'WEAK_PASSWORD'
      }
    }

    // Get user with password
    const result = await query(
      'SELECT hashed_password FROM users WHERE uuid = $1',
      [userUuid]
    )

    if (!result.rows[0]) {
      return {
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      }
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, result.rows[0].hashed_password)
    if (!passwordMatch) {
      return {
        success: false,
        message: 'Current password is incorrect',
        code: 'INVALID_PASSWORD'
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await query(
      'UPDATE users SET hashed_password = $1, updated_at = CURRENT_TIMESTAMP WHERE uuid = $2',
      [hashedPassword, userUuid]
    )

    return {
      success: true,
      message: 'Password changed successfully'
    }
  } catch (error) {
    console.error('Change password error:', error)
    return {
      success: false,
      message: 'Failed to change password',
      code: 'PASSWORD_CHANGE_ERROR'
    }
  }
}

/**
 * Update username
 */
export async function updateUsername(
  userUuid: string,
  newUsername: string
): Promise<AuthResponse | AuthError> {
  try {
    if (!newUsername || newUsername.length < 3) {
      return {
        success: false,
        message: 'Username must be at least 3 characters',
        code: 'INVALID_USERNAME'
      }
    }

    // Check if username is already taken
    const existingResult = await query(
      'SELECT uuid FROM users WHERE username = $1 AND uuid != $2',
      [newUsername, userUuid]
    )

    if (existingResult.rowCount && existingResult.rowCount > 0) {
      return {
        success: false,
        message: 'Username already taken',
        code: 'USERNAME_EXISTS'
      }
    }

    // Update username
    await query(
      'UPDATE users SET username = $1, updated_at = CURRENT_TIMESTAMP WHERE uuid = $2',
      [newUsername, userUuid]
    )

    // Get updated user
    const userResult = await query(
      'SELECT uuid, username, email, profile_picture_url FROM users WHERE uuid = $1',
      [userUuid]
    )

    return {
      success: true,
      message: 'Username updated successfully',
      user: {
        uuid: userResult.rows[0].uuid,
        username: userResult.rows[0].username,
        email: userResult.rows[0].email,
        profile_picture_url: userResult.rows[0].profile_picture_url || null
      }
    }
  } catch (error) {
    console.error('Update username error:', error)
    return {
      success: false,
      message: 'Failed to update username',
      code: 'UPDATE_USERNAME_ERROR'
    }
  }
}

/**
 * Delete user account and all associated data
 */
/**
 * Update user storage limit
 */
export async function updateStorageLimit(
  userUuid: string,
  storageLimitGB: number
): Promise<AuthResponse | AuthError> {
  try {
    // Validate storage limit (4-20GB)
    if (storageLimitGB < 4 || storageLimitGB > 20) {
      return {
        success: false,
        message: 'Storage limit must be between 4GB and 20GB',
        code: 'INVALID_STORAGE_LIMIT'
      }
    }

    const storageLimitBytes = storageLimitGB * 1024 * 1024 * 1024

    const result = await query(
      `UPDATE users 
       SET storage_limit = $1, updated_at = CURRENT_TIMESTAMP
       WHERE uuid = $2
       RETURNING uuid, username, email, storage_limit`,
      [storageLimitBytes, userUuid]
    )

    if (!result.rows[0]) {
      return {
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      }
    }

    return {
      success: true,
      message: 'Storage limit updated successfully',
      user: {
        uuid: result.rows[0].uuid,
        username: result.rows[0].username,
        email: result.rows[0].email,
        profile_picture_url: result.rows[0].profile_picture_url || null
      }
    }
  } catch (error) {
    console.error('Update storage limit error:', error)
    return {
      success: false,
      message: 'Failed to update storage limit',
      code: 'UPDATE_ERROR'
    }
  }
}

/**
 * Update user email
 */
export async function updateEmail(
  userUuid: string,
  newEmail: string
): Promise<AuthResponse | AuthError> {
  try {
    if (!newEmail || !newEmail.includes('@')) {
      return {
        success: false,
        message: 'Invalid email address',
        code: 'INVALID_EMAIL'
      }
    }

    // Check if email is already taken
    const existingResult = await query(
      'SELECT uuid FROM users WHERE email = $1 AND uuid != $2',
      [newEmail, userUuid]
    )

    if (existingResult.rowCount && existingResult.rowCount > 0) {
      return {
        success: false,
        message: 'Email already in use',
        code: 'EMAIL_EXISTS'
      }
    }

    const result = await query(
      `UPDATE users 
       SET email = $1, updated_at = CURRENT_TIMESTAMP
       WHERE uuid = $2
       RETURNING uuid, username, email, profile_picture_url`,
      [newEmail, userUuid]
    )

    if (!result.rows[0]) {
      return {
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      }
    }

    return {
      success: true,
      message: 'Email updated successfully',
      user: {
        uuid: result.rows[0].uuid,
        username: result.rows[0].username,
        email: result.rows[0].email,
        profile_picture_url: result.rows[0].profile_picture_url || null
      }
    }
  } catch (error) {
    console.error('Update email error:', error)
    return {
      success: false,
      message: 'Failed to update email',
      code: 'UPDATE_ERROR'
    }
  }
}

/**
 * Update user profile picture
 */
export async function updateProfilePicture(
  userUuid: string,
  profilePictureUrl: string
): Promise<AuthResponse | AuthError> {
  try {
    const result = await query(
      `UPDATE users 
       SET profile_picture_url = $1, updated_at = CURRENT_TIMESTAMP
       WHERE uuid = $2
       RETURNING uuid, username, email, profile_picture_url`,
      [profilePictureUrl, userUuid]
    )

    if (!result.rows[0]) {
      return {
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      }
    }

    return {
      success: true,
      message: 'Profile picture updated successfully',
      user: {
        uuid: result.rows[0].uuid,
        username: result.rows[0].username,
        email: result.rows[0].email,
        profile_picture_url: result.rows[0].profile_picture_url
      }
    }
  } catch (error) {
    console.error('Update profile picture error:', error)
    return {
      success: false,
      message: 'Failed to update profile picture',
      code: 'UPDATE_ERROR'
    }
  }
}

export async function deleteAccount(userUuid: string): Promise<AuthResponse | AuthError> {
  try {
    // Get file bucket ID
    const userResult = await query(
      'SELECT file_bucket_id FROM users WHERE uuid = $1',
      [userUuid]
    )

    if (!userResult.rows[0]) {
      return {
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      }
    }

    // Delete user (CASCADE will delete all related data: files, sessions, shares)
    await query('DELETE FROM users WHERE uuid = $1', [userUuid])

    // Note: File deletion from filesystem should be handled by a cleanup job
    // For now, we rely on database CASCADE to clean up references

    return {
      success: true,
      message: 'Account deleted successfully'
    }
  } catch (error) {
    console.error('Delete account error:', error)
    return {
      success: false,
      message: 'Failed to delete account',
      code: 'DELETE_ACCOUNT_ERROR'
    }
  }
}