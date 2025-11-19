const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  code?: string
}

export interface AuthUser {
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
    const response = await fetch(`${API_URL}/api/auth/register`, {
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
      // Store session info in localStorage
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }
    }

    return data
  } catch (error) {
    console.error('Register error:', error)
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
    const response = await fetch(`${API_URL}/api/auth/login`, {
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
      // Store session info in localStorage
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }
    }

    return data
  } catch (error) {
    console.error('Login error:', error)
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
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email
      })
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Forgot password error:', error)
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
    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include'
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Get current user error:', error)
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
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    })

    const data = await response.json()

    if (response.ok) {
      localStorage.removeItem('user')
    }

    return data
  } catch (error) {
    console.error('Logout error:', error)
    return {
      success: false,
      message: 'Logout failed'
    }
  }
}
