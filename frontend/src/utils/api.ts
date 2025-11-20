// Use localhost for all API calls (works from browser on host machine)
// In Docker, the backend port is mapped to localhost:3000
import { logger } from './logger'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  code?: string
}

export type AuthUser = {
  uuid: string
  username: string
  email: string
}

export interface AuthResponse {
  success: boolean
  message: string
  user?: AuthUser
  session?: string
  code?: string
}

/**
 * Register a new user
 */
export async function apiRegister(
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    logger.api('POST /api/auth/register', { username, email })
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        username,
        email,
        password
      })
    })

    const data = await response.json()

    if (response.ok) {
      logger.success('Registration successful', data.user)
      // Store session info in localStorage
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }
    } else {
      logger.error('Registration failed', data)
    }

    return data
  } catch (error) {
    logger.error('Register error', error)
    return {
      success: false,
      message: 'Network error. Please try again.',
      code: 'NETWORK_ERROR'
    }
  }
}

/**
 * Login user
 */
export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  try {
    logger.api('POST /api/auth/login', { email })
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        email,
        password
      })
    })

    const data = await response.json()

    if (response.ok) {
      logger.success('Login successful', data.user)
      // Store session info in localStorage
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }
    } else {
      logger.error('Login failed', data)
    }

    return data
  } catch (error) {
    logger.error('Login error', error)
    return {
      success: false,
      message: 'Network error. Please try again.',
      code: 'NETWORK_ERROR'
    }
  }
}

/**
 * Request password reset
 */
export async function apiForgotPassword(email: string): Promise<AuthResponse> {
  try {
    logger.api('POST /api/auth/forgot-password', { email })
    const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email
      })
    })

    const data = await response.json()
    if (response.ok) {
      logger.success('Password reset requested', { email })
    } else {
      logger.warn('Password reset failed', data)
    }
    return data
  } catch (error) {
    logger.error('Forgot password error', error)
    return {
      success: false,
      message: 'Network error. Please try again.',
      code: 'NETWORK_ERROR'
    }
  }
}

/**
 * Get current user
 */
export async function apiGetCurrentUser(): Promise<{ success: boolean; user?: AuthUser }> {
  try {
    logger.api('GET /api/auth/me')
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'GET',
      credentials: 'include'
    })

    const data = await response.json()
    if (response.ok && data.user) {
      logger.success('User fetched', data.user)
    } else {
      logger.warn('User not authenticated')
    }
    return data
  } catch (error) {
    logger.error('Get current user error', error)
    return {
      success: false
    }
  }
}

/**
 * Logout user
 */
export async function apiLogout(): Promise<{ success: boolean; message: string }> {
  try {
    logger.api('POST /api/auth/logout')
    const response = await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    })

    const data = await response.json()

    if (response.ok) {
      logger.success('Logout successful')
      localStorage.removeItem('user')
    } else {
      logger.warn('Logout failed', data)
    }

    return data
  } catch (error) {
    logger.error('Logout error', error)
    return {
      success: false,
      message: 'Logout failed'
    }
  }
}

/**
 * Get storage usage
 */
export async function getUserStorageUsage(): Promise<{ success: boolean; storage?: { used: number; max: number; usedFormatted: string; maxFormatted: string } }> {
  try {
    logger.api('GET /api/files/storage/usage')
    const response = await fetch(`${API_BASE}/api/files/storage/usage`, {
      method: 'GET',
      credentials: 'include'
    })

    const data = await response.json()
    if (response.ok) {
      logger.success('Storage usage fetched', data.storage)
    } else {
      logger.warn('Failed to fetch storage usage', data)
    }
    return data
  } catch (error) {
    logger.error('Get storage usage error', error)
    return {
      success: false
    }
  }
}
