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

export interface FileData {
  file_id: string
  original_name: string
  file_size: number
  mime_type: string
  created_at: string
  is_starred?: boolean
  is_deleted?: boolean
  shared_at?: string
  shared_by_username?: string
  share_token?: string
  share_id?: string
  permission?: string
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
): Promise<{ success: boolean; file?: FileData; message?: string; code?: string }> {
  try {
    logger.api('POST /api/files/upload', { filename: file.name, size: file.size })
    
    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()

    return new Promise((resolve, reject) => {
      // Calculate timeout based on file size (15 minutes for 1GB, scales linearly)
      // Minimum 5 minutes, maximum 30 minutes
      const fileSizeMB = file.size / (1024 * 1024)
      const timeoutMs = Math.max(5 * 60 * 1000, Math.min(30 * 60 * 1000, (fileSizeMB / 100) * 15 * 60 * 1000))
      
      xhr.timeout = timeoutMs

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
        reject(new Error('Network error. Please check your connection and try again.'))
      })

      xhr.addEventListener('timeout', () => {
        logger.error('Upload timeout', { timeout: timeoutMs, fileSize: file.size })
        reject(new Error(`Upload timeout. The file is too large or your connection is too slow. Please try again or upload a smaller file.`))
      })

      xhr.addEventListener('abort', () => {
        logger.warn('Upload aborted')
        reject(new Error('Upload was cancelled'))
      })

      xhr.open('POST', `${API_BASE}/api/files/upload`)
      xhr.withCredentials = true
      xhr.send(formData)
    })
  } catch (error) {
    logger.error('Upload error', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error. Please try again.',
      code: 'NETWORK_ERROR'
    }
  }
}

/**
 * List user files
 */
export async function apiListFiles(limit = 50, offset = 0, includeDeleted = false): Promise<{ success: boolean; files?: FileData[]; count?: number }> {
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
export async function apiSearchFiles(query: string, limit = 20): Promise<{ success: boolean; files?: FileData[]; count?: number }> {
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
export async function apiUpdateFile(fileId: string, originalName: string): Promise<{ success: boolean; file?: FileData; message?: string }> {
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
export async function apiListPublicFiles(limit = 50, offset = 0): Promise<{ success: boolean; files?: FileData[]; count?: number }> {
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
 * List files shared with the current user (private shares)
 */
export async function apiListSharedWithMe(limit = 50, offset = 0): Promise<{ success: boolean; files?: FileData[]; count?: number }> {
  try {
    logger.api('GET /api/share/with-me', { limit, offset })
    const response = await fetch(`${API_BASE}/api/share/with-me?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      credentials: 'include'
    })

    const data = await response.json()
    if (response.ok) {
      logger.success('Shared with me files fetched', { count: data.count })
    } else {
      logger.warn('Failed to fetch shared with me files', data)
    }
    return data
  } catch (error) {
    logger.error('List shared with me error', error)
    return {
      success: false
    }
  }
}

/**
 * Share file with a specific user (private share)
 */
export async function apiShareFileWithUser(fileId: string, userUuid: string, permission: string = 'read'): Promise<{ success: boolean; share?: { share_id: string; file_id: string; shared_with_uuid: string; permission: string }; message?: string }> {
  try {
    logger.api('POST /api/files/:fileId/share', { fileId, userUuid })
    const response = await fetch(`${API_BASE}/api/files/${fileId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ shared_with: userUuid, permission })
    })

    const data = await response.json()
    if (response.ok) {
      logger.success('File shared with user', { fileId, userUuid })
    } else {
      logger.warn('Failed to share file with user', data)
    }
    return data
  } catch (error) {
    logger.error('Share file with user error', error)
    return {
      success: false,
      message: 'Network error. Please try again.'
    }
  }
}

/**
 * Remove a file from "Shared With Me" (recipient action)
 */
export async function apiRemoveFromSharedWithMe(shareId: string): Promise<{ success: boolean; message?: string }> {
  try {
    logger.api('DELETE /api/share/:shareId/remove-access', { shareId })
    const response = await fetch(`${API_BASE}/api/share/${shareId}/remove-access`, {
      method: 'DELETE',
      credentials: 'include'
    })

    const data = await response.json()
    if (response.ok) {
      logger.success('Removed from shared with me', { shareId })
    } else {
      logger.warn('Failed to remove from shared with me', data)
    }
    return data
  } catch (error) {
    logger.error('Remove from shared with me error', error)
    return {
      success: false,
      message: 'Network error. Please try again.'
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

// Image Generation Types and Functions
export interface ImageGenerationSettings {
  prompt: string
  seed?: number
  numberOfImages?: number
  aspectRatio?: string
  generationModel?: string
  googleCookie: string
}

export interface GeneratedImage {
  imageId: string
  url: string
  mediaId: string
}

export interface ImageGenerationResponse {
  success: boolean
  message: string
  images?: GeneratedImage[]
  prompt?: string
  settings?: ImageGenerationSettings
  code?: string
  error?: string
}

/**
 * Generate images using ImageFX API
 */
export async function apiGenerateImage(
  settings: ImageGenerationSettings
): Promise<ImageGenerationResponse> {
  try {
    logger.api('POST /api/image/generate', { prompt: settings.prompt })
    const response = await fetch(`${API_BASE}/api/image/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(settings)
    })

    const data = await response.json()

    if (response.ok) {
      logger.success('Images generated successfully', { count: data.images?.length || 0 })
    } else {
      logger.error('Image generation failed', data)
    }

    return data
  } catch (error) {
    logger.error('Image generation error', error)
    return {
      success: false,
      message: 'Network error. Please try again.',
      code: 'NETWORK_ERROR'
    }
  }
}

/**
 * Validate Google cookie for ImageFX
 */
export async function apiValidateGoogleCookie(
  googleCookie: string
): Promise<{ success: boolean; message: string; valid?: boolean; code?: string }> {
  try {
    logger.api('POST /api/image/validate-cookie')
    const response = await fetch(`${API_BASE}/api/image/validate-cookie`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ googleCookie })
    })

    const data = await response.json()

    if (response.ok) {
      logger.success('Cookie validation successful')
    } else {
      logger.error('Cookie validation failed', data)
    }

    return data
  } catch (error) {
    logger.error('Cookie validation error', error)
    return {
      success: false,
      message: 'Network error. Please try again.',
      code: 'NETWORK_ERROR'
    }
  }
}
