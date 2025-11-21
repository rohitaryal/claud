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
  profile_picture_url?: string
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

/**
 * Upload a file with progress tracking
 */
export async function apiUploadFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; file?: any; message?: string; code?: string }> {
  try {
    logger.api('POST /api/files/upload', { filename: file.name, size: file.size })
    
    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100
          onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            if (data.success) {
              logger.success('File uploaded', data.file)
              resolve(data)
            } else {
              logger.error('Upload failed', data)
              resolve(data)
            }
          } catch (error) {
            logger.error('Parse response error', error)
            reject(error)
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText)
            logger.error('Upload failed', data)
            resolve(data)
          } catch (error) {
            logger.error('Upload error', error)
            reject(error)
          }
        }
      })

      xhr.addEventListener('error', () => {
        logger.error('Upload network error')
        reject(new Error('Network error'))
      })

      xhr.open('POST', `${API_BASE}/api/files/upload`)
      xhr.withCredentials = true
      xhr.send(formData)
    })
  } catch (error) {
    logger.error('Upload error', error)
    return {
      success: false,
      message: 'Network error. Please try again.',
      code: 'NETWORK_ERROR'
    }
  }
}

/**
 * List user files
 */
export async function apiListFiles(limit = 50, offset = 0, includeDeleted = false): Promise<{ success: boolean; files?: any[]; count?: number }> {
  try {
    logger.api('GET /api/files', { limit, offset, includeDeleted })
    const url = `${API_BASE}/api/files?limit=${limit}&offset=${offset}${includeDeleted ? '&includeDeleted=true' : ''}`
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    })

    const data = await response.json()
    if (response.ok) {
      logger.success('Files fetched', { count: data.count })
    } else {
      logger.warn('Failed to fetch files', data)
    }
    return data
  } catch (error) {
    logger.error('List files error', error)
    return {
      success: false
    }
  }
}

/**
 * Search files
 */
export async function apiSearchFiles(query: string, limit = 20): Promise<{ success: boolean; files?: any[]; count?: number }> {
  try {
    logger.api('GET /api/files/search', { query, limit })
    const response = await fetch(`${API_BASE}/api/files/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
      method: 'GET',
      credentials: 'include'
    })

    const data = await response.json()
    if (response.ok) {
      logger.success('Files searched', { count: data.count })
    } else {
      logger.warn('Failed to search files', data)
    }
    return data
  } catch (error) {
    logger.error('Search files error', error)
    return {
      success: false
    }
  }
}

/**
 * Delete a file
 */
export async function apiDeleteFile(fileId: string): Promise<{ success: boolean; message?: string }> {
  try {
    logger.api('DELETE /api/files/:fileId', { fileId })
    const response = await fetch(`${API_BASE}/api/files/${fileId}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    const data = await response.json()
    if (response.ok) {
      logger.success('File deleted', fileId)
    } else {
      logger.warn('Failed to delete file', data)
    }
    return data
  } catch (error) {
    logger.error('Delete file error', error)
    return {
      success: false,
      message: 'Network error. Please try again.'
    }
  }
}

/**
 * Download a file
 */
export async function apiDownloadFile(fileId: string, filename: string): Promise<void> {
  try {
    logger.api('GET /api/files/:fileId/download', { fileId })
    const response = await fetch(`${API_BASE}/api/files/${fileId}/download`, {
      method: 'GET',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Download failed')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    logger.success('File downloaded', filename)
  } catch (error) {
    logger.error('Download file error', error)
    throw error
  }
}

/**
 * Update file metadata (e.g., rename file)
 */
export async function apiUpdateFile(fileId: string, originalName: string): Promise<{ success: boolean; file?: any; message?: string }> {
  try {
    logger.api('PUT /api/files/:fileId', { fileId, originalName })
    const response = await fetch(`${API_BASE}/api/files/${fileId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ original_name: originalName })
    })

    const data = await response.json()
    if (response.ok) {
      logger.success('File updated', fileId)
    } else {
      logger.warn('Failed to update file', data)
    }
    return data
  } catch (error) {
    logger.error('Update file error', error)
    return {
      success: false,
      message: 'Network error. Please try again.'
    }
  }
}

/**
 * Permanently delete a file from trash
 */
export async function apiPermanentDeleteFile(fileId: string): Promise<{ success: boolean; message?: string }> {
  try {
    logger.api('DELETE /api/files/:fileId/permanent', { fileId })
    const response = await fetch(`${API_BASE}/api/files/${fileId}/permanent`, {
      method: 'DELETE',
      credentials: 'include'
    })

    const data = await response.json()
    if (response.ok) {
      logger.success('File permanently deleted', fileId)
    } else {
      logger.warn('Failed to permanently delete file', data)
    }
    return data
  } catch (error) {
    logger.error('Permanent delete file error', error)
    return {
      success: false,
      message: 'Network error. Please try again.'
    }
  }
}

/**
 * Toggle star status of a file
 */
export async function apiToggleStarFile(fileId: string): Promise<{ success: boolean; is_starred?: boolean; message?: string }> {
  try {
    logger.api('POST /api/files/:fileId/star', { fileId })
    const response = await fetch(`${API_BASE}/api/files/${fileId}/star`, {
      method: 'POST',
      credentials: 'include'
    })

    const data = await response.json()
    if (response.ok) {
      logger.success('File star status toggled', { fileId, is_starred: data.is_starred })
    } else {
      logger.warn('Failed to toggle star status', data)
    }
    return data
  } catch (error) {
    logger.error('Toggle star file error', error)
    return {
      success: false,
      message: 'Network error. Please try again.'
    }
  }
}

/**
 * Restore a file from trash
 */
export async function apiRestoreFile(fileId: string): Promise<{ success: boolean; message?: string }> {
  try {
    logger.api('POST /api/files/:fileId/restore', { fileId })
    const response = await fetch(`${API_BASE}/api/files/${fileId}/restore`, {
      method: 'POST',
      credentials: 'include'
    })

    const data = await response.json()
    if (response.ok) {
      logger.success('File restored', fileId)
    } else {
      logger.warn('Failed to restore file', data)
    }
    return data
  } catch (error) {
    logger.error('Restore file error', error)
    return {
      success: false,
      message: 'Network error. Please try again.'
    }
  }
}

/**
 * Share file publicly
 */
export async function apiShareFilePublic(fileId: string): Promise<{ success: boolean; shareToken?: string; shareUrl?: string; message?: string }> {
  try {
    logger.api('POST /api/files/:fileId/share/public', { fileId })
    const response = await fetch(`${API_BASE}/api/files/${fileId}/share/public`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ permission: 'read' })
    })

    const data = await response.json()
    if (response.ok) {
      logger.success('File shared publicly', { fileId, shareToken: data.shareToken })
    } else {
      logger.warn('Failed to share file publicly', data)
    }
    return data
  } catch (error) {
    logger.error('Share file public error', error)
    return {
      success: false,
      message: 'Network error. Please try again.'
    }
  }
}

/**
 * List all publicly shared files (global pool)
 */
export async function apiListPublicFiles(limit = 50, offset = 0): Promise<{ success: boolean; files?: any[]; count?: number }> {
  try {
    logger.api('GET /api/share/public', { limit, offset })
    const response = await fetch(`${API_BASE}/api/share/public?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      credentials: 'include'
    })

    const data = await response.json()
    if (response.ok) {
      logger.success('Public files fetched', { count: data.count })
    } else {
      logger.warn('Failed to fetch public files', data)
    }
    return data
  } catch (error) {
    logger.error('List public files error', error)
    return {
      success: false
    }
  }
}

/**
 * Change user password
 */
export async function apiChangePassword(
  currentPassword: string,
  newPassword: string
): Promise<AuthResponse> {
  try {
    logger.api('POST /api/auth/change-password')
    const response = await fetch(`${API_BASE}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    })

    const data = await response.json()
    if (response.ok) {
      logger.success('Password changed successfully')
    } else {
      logger.warn('Password change failed', data)
    }
    return data
  } catch (error) {
    logger.error('Change password error', error)
    return {
      success: false,
      message: 'Network error. Please try again.',
      code: 'NETWORK_ERROR'
    }
  }
}

/**
 * Update username
 */
export async function apiUpdateUsername(username: string): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
  try {
    logger.api('PUT /api/auth/update-username', { username })
    const response = await fetch(`${API_BASE}/api/auth/update-username`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ username })
    })

    const data = await response.json()
    if (response.ok) {
      logger.success('Username updated', data.user)
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }
    } else {
      logger.warn('Username update failed', data)
    }
    return data
  } catch (error) {
    logger.error('Update username error', error)
    return {
      success: false,
      message: 'Network error. Please try again.'
    }
  }
}

/**
 * Update user email
 */
export async function apiUpdateEmail(email: string): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
  try {
    logger.api('PUT /api/auth/update-email', { email })
    const response = await fetch(`${API_BASE}/api/auth/update-email`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email })
    })

    const data = await response.json()
    if (response.ok) {
      logger.success('Email updated', data.user)
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }
    } else {
      logger.warn('Email update failed', data)
    }
    return data
  } catch (error) {
    logger.error('Update email error', error)
    return {
      success: false,
      message: 'Network error. Please try again.'
    }
  }
}

/**
 * Update user storage limit
 */
export async function apiUpdateStorageLimit(storageLimitGB: number): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
  try {
    logger.api('PUT /api/auth/update-storage-limit', { storageLimitGB })
    const response = await fetch(`${API_BASE}/api/auth/update-storage-limit`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ storageLimitGB })
    })

    const data = await response.json()
    if (response.ok) {
      logger.success('Storage limit updated', data.user)
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }
    } else {
      logger.warn('Storage limit update failed', data)
    }
    return data
  } catch (error) {
    logger.error('Update storage limit error', error)
    return {
      success: false,
      message: 'Network error. Please try again.'
    }
  }
}

/**
 * Delete user account
 */
export async function apiDeleteAccount(): Promise<{ success: boolean; message?: string }> {
  try {
    logger.api('DELETE /api/auth/delete-account')
    const response = await fetch(`${API_BASE}/api/auth/delete-account`, {
      method: 'DELETE',
      credentials: 'include'
    })

    const data = await response.json()
    if (response.ok) {
      logger.success('Account deleted')
      localStorage.removeItem('user')
    } else {
      logger.warn('Account deletion failed', data)
    }
    return data
  } catch (error) {
    logger.error('Delete account error', error)
    return {
      success: false,
      message: 'Network error. Please try again.'
    }
  }
}

/**
 * Upload profile picture
 */
export async function apiUploadProfilePicture(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; profile_picture_url?: string; user?: AuthUser; message?: string; code?: string }> {
  try {
    logger.api('POST /api/auth/upload-profile-picture', { filename: file.name, size: file.size })
    
    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100
          onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            if (data.success) {
              logger.success('Profile picture uploaded', data.profile_picture_url)
              if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user))
              }
              resolve(data)
            } else {
              logger.error('Upload failed', data)
              resolve(data)
            }
          } catch (error) {
            logger.error('Parse response error', error)
            reject(error)
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText)
            logger.error('Upload failed', data)
            resolve(data)
          } catch (error) {
            logger.error('Upload error', error)
            reject(error)
          }
        }
      })

      xhr.addEventListener('error', () => {
        logger.error('Upload network error')
        reject(new Error('Network error'))
      })

      xhr.open('POST', `${API_BASE}/api/auth/upload-profile-picture`)
      xhr.withCredentials = true
      xhr.send(formData)
    })
  } catch (error) {
    logger.error('Upload profile picture error', error)
    return {
      success: false,
      message: 'Network error. Please try again.',
      code: 'NETWORK_ERROR'
    }
  }
}