import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardHeader from '../../components/DashboardHeader/DashboardHeader'
import Sidebar from '../../components/Sidebar/Sidebar'
import Dialog from '../../components/Dialog/Dialog'
import styles from './MyFiles.module.css'
import { IoTrashOutline, IoDownloadOutline, IoGridOutline, IoListOutline, IoDocumentTextOutline, IoFolderOutline, IoStarOutline, IoStar, IoEllipsisVerticalOutline, IoShareSocialOutline, IoCloseOutline, IoRefreshOutline } from 'react-icons/io5'
import { apiGetCurrentUser, apiListFiles, apiDeleteFile, apiDownloadFile, apiPermanentDeleteFile, apiToggleStarFile, apiRestoreFile, apiShareFilePublic, apiListPublicFiles, apiListSharedWithMe, apiRemoveFromSharedWithMe } from '../../utils/api'
import { logger } from '../../utils/logger'
import { getFileIcon } from '../../utils/fileIcons'
import { showDialog } from '../../utils/dialog'

interface FileItem {
    file_id: string
    original_name: string
    file_size: number
    mime_type: string
    created_at: string
    isFolder?: boolean
    is_deleted?: boolean
    is_starred?: boolean
}

const MyFiles = function () {
    const navigate = useNavigate()
    const [files, setFiles] = useState<FileItem[]>([])
    const [loading, setLoading] = useState(true)
    const [activeSection, setActiveSection] = useState('my-files')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
    const [, setUser] = useState<any>(null)
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [previewError, setPreviewError] = useState<string | null>(null)
    const [previewText, setPreviewText] = useState<string | null>(null)
    const [menuOpenFileId, setMenuOpenFileId] = useState<string | null>(null)
    const [imageThumbnails, setImageThumbnails] = useState<Record<string, string>>({})

    useEffect(() => {
        // Check authentication
        const checkAuth = async () => {
            const response = await apiGetCurrentUser()
            if (!response.success || !response.user) {
                navigate('/login')
                return
            }
            setUser(response.user)
        }
        checkAuth()

        // Load files
        loadFiles()
    }, [navigate])

    const loadFiles = async () => {
        setLoading(true)
        try {
            if (activeSection === 'public-pool') {
                const response = await apiListPublicFiles(50, 0)
                if (response.success && response.files) {
                    // Map public files to FileItem format
                    const mappedFiles = response.files.map((f: any) => ({
                        file_id: f.file_id,
                        original_name: f.original_name,
                        file_size: f.file_size,
                        mime_type: f.mime_type,
                        created_at: f.shared_at || f.created_at,
                        is_starred: false,
                        is_deleted: false,
                        shared_by_username: f.shared_by_username,
                        share_token: f.share_token
                    }))
                    setFiles(mappedFiles)
                }
            } else if (activeSection === 'shared') {
                const response = await apiListSharedWithMe(50, 0)
                if (response.success && response.files) {
                    // Map shared files to FileItem format
                    const mappedFiles = response.files.map((f: any) => ({
                        file_id: f.file_id,
                        original_name: f.original_name,
                        file_size: f.file_size,
                        mime_type: f.mime_type,
                        created_at: f.shared_at || f.created_at,
                        is_starred: false,
                        is_deleted: false,
                        shared_by_username: f.shared_by_username,
                        share_id: f.share_id,
                        permission: f.permission
                    }))
                    setFiles(mappedFiles)
                }
            } else {
                const includeDeleted = activeSection === 'trash'
                const response = await apiListFiles(50, 0, includeDeleted)
                if (response.success && response.files) {
                    setFiles(response.files)
                }
            }
        } catch (error) {
            logger.error('Failed to load files', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadFiles()
    }, [activeSection])

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuOpenFileId) {
                const target = event.target as HTMLElement
                // Check if click is outside the menu container
                const menuContainer = target.closest(`.${styles.menuContainer}`)
                if (!menuContainer) {
                    setMenuOpenFileId(null)
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [menuOpenFileId])

    const handleNewClick = () => {
        navigate('/home')
    }

    const handleDeleteFile = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete "${name}"? This will move it to trash.`)) {
            try {
                const response = await apiDeleteFile(id)
                if (response.success) {
                    // Reload files to reflect the deletion
                    await loadFiles()
                    logger.success('File deleted', name)
                } else {
                    logger.error('Delete failed', response.message)
                    alert(`Failed to delete file: ${response.message}`)
                }
            } catch (error) {
                logger.error('Delete error', error)
                alert('Failed to delete file. Please try again.')
            }
        }
    }

    const handleDownloadFile = async (file: FileItem) => {
        try {
            await apiDownloadFile(file.file_id, file.original_name)
            logger.success('File downloaded', file.original_name)
        } catch (error) {
            logger.error('Download error', error)
            alert('Failed to download file. Please try again.')
        }
    }

    const handleFileClick = async (file: FileItem) => {
        if (file.isFolder) return
        
        // For public pool files, download via share token
        if (activeSection === 'public-pool' && (file as any).share_token) {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
            const url = `${API_BASE}/api/share/${(file as any).share_token}/download`
            try {
                const response = await fetch(url, { credentials: 'include' })
                if (!response.ok) throw new Error('Download failed')
                const blob = await response.blob()
                const downloadUrl = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = downloadUrl
                a.download = file.original_name
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(downloadUrl)
                document.body.removeChild(a)
                logger.success('File downloaded from public pool', file.original_name)
            } catch (error) {
                logger.error('Download error', error)
                alert('Failed to download file. Please try again.')
            }
            return
        }
        
        // Check if it's a binary file that should be downloaded
        if (isBinaryFile(file.mime_type, file.original_name)) {
            if (confirm('This file type cannot be previewed. Would you like to download it instead?')) {
                await handleDownloadFile(file)
            }
            return
        }

        // Open preview
        await handlePreviewFile(file)
    }

    const handlePreviewFile = async (file: FileItem) => {
        setPreviewFile(file)
        setPreviewError(null)
        setPreviewUrl(null)
        setPreviewText(null)

        // Check if file can be previewed
        const canPreview = canPreviewFile(file.mime_type, file.original_name)
        
        if (!canPreview) {
            setPreviewError('This file type cannot be previewed. Please download it to view.')
            return
        }

        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
            const url = `${API_BASE}/api/files/${file.file_id}/download`
            
            // For images, videos, and PDFs, we can create a preview URL
            if (file.mime_type?.startsWith('image/')) {
                setPreviewUrl(url)
            } else if (file.mime_type?.startsWith('video/')) {
                setPreviewUrl(url)
            } else if (file.mime_type === 'application/pdf') {
                setPreviewUrl(url)
            } else if (file.mime_type?.startsWith('text/')) {
                // For text files, fetch and display content
                const response = await fetch(url, { credentials: 'include' })
                if (!response.ok) {
                    throw new Error('Failed to fetch file')
                }
                const text = await response.text()
                setPreviewText(text)
            } else {
                setPreviewError('This file type cannot be previewed. Please download it to view.')
            }
        } catch (error) {
            logger.error('Preview error', error)
            setPreviewError('Failed to load preview. Please download the file to view it.')
        }
    }

    const isBinaryFile = (mimeType?: string, filename?: string): boolean => {
        if (!mimeType && !filename) return false
        
        const ext = filename?.split('.').pop()?.toLowerCase() || ''
        const binaryExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'exe', 'dmg', 'pkg', 'deb', 'rpm']
        const binaryMimeTypes = ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip', 'application/x-bzip2']
        
        return binaryExtensions.includes(ext) || (mimeType && binaryMimeTypes.some(bmt => mimeType.includes(bmt)))
    }

    const canPreviewFile = (mimeType?: string, filename?: string): boolean => {
        if (!mimeType && !filename) return false
        
        const ext = filename?.split('.').pop()?.toLowerCase() || ''
        
        // Images
        if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
            return true
        }
        
        // Videos
        if (mimeType?.startsWith('video/') || ['mp4', 'webm', 'ogg'].includes(ext)) {
            return true
        }
        
        // PDF
        if (mimeType === 'application/pdf' || ext === 'pdf') {
            return true
        }
        
        // Text files
        if (mimeType?.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'csv'].includes(ext)) {
            return true
        }
        
        return false
    }

    const closePreview = () => {
        setPreviewFile(null)
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl)
        }
        setPreviewUrl(null)
        setPreviewError(null)
        setPreviewText(null)
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const handleToggleStar = async (fileId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            const response = await apiToggleStarFile(fileId)
            if (response.success) {
                setFiles((prev) => prev.map((f) => 
                    f.file_id === fileId ? { ...f, is_starred: response.is_starred } : f
                ))
                logger.success('Star status toggled', fileId)
            } else {
                logger.error('Toggle star failed', response.message)
                alert(`Failed to toggle star: ${response.message}`)
            }
        } catch (error) {
            logger.error('Toggle star error', error)
            alert('Failed to toggle star. Please try again.')
        }
    }

    const handleRestoreFile = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to restore "${name}"?`)) {
            try {
                const response = await apiRestoreFile(id)
                if (response.success) {
                    // Reload files to reflect the restoration
                    await loadFiles()
                    logger.success('File restored', name)
                } else {
                    logger.error('Restore failed', response.message)
                    alert(`Failed to restore file: ${response.message}`)
                }
            } catch (error) {
                logger.error('Restore error', error)
                alert('Failed to restore file. Please try again.')
            }
        }
    }

    const handleShareFile = async (fileId: string, shareType: 'public' | 'link') => {
        setMenuOpenFileId(null)
        try {
            if (shareType === 'public') {
                const response = await apiShareFilePublic(fileId)
                if (response.success && response.shareToken) {
                    const shareUrl = `${window.location.origin}/api/share/${response.shareToken}`
                    navigator.clipboard.writeText(shareUrl).then(() => {
                        alert(`File shared publicly! Share link copied to clipboard: ${shareUrl}`)
                        logger.success('File shared publicly', fileId)
                    }).catch(() => {
                        alert(`File shared publicly! Share link: ${shareUrl}`)
                    })
                } else {
                    const errorMsg = response.message || 'Unknown error'
                    if (errorMsg.includes('already shared')) {
                        alert('This file is already shared publicly or privately. You cannot share it again.')
                    } else {
                        alert(`Failed to share file: ${errorMsg}`)
                    }
                }
            } else {
                // Link-only sharing - same as public for now
                const response = await apiShareFilePublic(fileId)
                if (response.success && response.shareToken) {
                    const shareUrl = `${window.location.origin}/api/share/${response.shareToken}`
                    navigator.clipboard.writeText(shareUrl).then(() => {
                        alert(`Share link copied to clipboard: ${shareUrl}`)
                        logger.success('Share link created', fileId)
                    }).catch(() => {
                        alert(`Share link: ${shareUrl}`)
                    })
                } else {
                    const errorMsg = response.message || 'Unknown error'
                    if (errorMsg.includes('already shared')) {
                        alert('This file is already shared publicly or privately. You cannot share it again.')
                    } else {
                        alert(`Failed to create share link: ${errorMsg}`)
                    }
                }
            }
        } catch (error) {
            logger.error('Share file error', error)
            alert('Failed to share file. Please try again.')
        }
    }

    const handleRemoveFromSharedWithMe = async (shareId: string, fileName: string) => {
        if (confirm(`Remove "${fileName}" from Shared With Me?`)) {
            try {
                const response = await apiRemoveFromSharedWithMe(shareId)
                if (response.success) {
                    await loadFiles()
                    logger.success('File removed from shared with me', fileName)
                } else {
                    logger.error('Remove from shared failed', response.message)
                    alert(`Failed to remove from shared with me: ${response.message}`)
                }
            } catch (error) {
                logger.error('Remove from shared error', error)
                alert('Failed to remove from shared with me. Please try again.')
            }
        }
    }

    // Load thumbnails for images
    useEffect(() => {
        const loadThumbnails = async () => {
            const imageFiles = files.filter(f => !f.isFolder && f.mime_type?.startsWith('image/') && !f.is_deleted)
            const thumbnails: Record<string, string> = {}
            
            for (const file of imageFiles) {
                try {
                    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
                    const url = `${API_BASE}/api/files/${file.file_id}/download`
                    thumbnails[file.file_id] = url
                } catch (error) {
                    console.error('Failed to load thumbnail for', file.file_id)
                }
            }
            
            setImageThumbnails(thumbnails)
        }
        
        if (files.length > 0) {
            loadThumbnails()
        }
    }, [files])

    // Filter files based on active section
    const filteredFiles = files.filter((file) => {
        switch (activeSection) {
            case 'trash':
                return file.is_deleted === true
            case 'starred':
                return file.is_starred === true && !file.is_deleted
            case 'recent':
                return !file.is_deleted // Show all non-deleted files for now
            case 'shared':
                return true // All files in shared are already filtered by the API
            case 'public-pool':
                return true // All files in public pool are already filtered by the API
            default:
                return !file.is_deleted
        }
    })

    const handlePermanentDelete = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) {
            try {
                const response = await apiPermanentDeleteFile(id)
                if (response.success) {
                    // Reload files to reflect the deletion
                    await loadFiles()
                    logger.success('File permanently deleted', name)
                } else {
                    logger.error('Permanent delete failed', response.message)
                    alert(`Failed to permanently delete file: ${response.message}`)
                }
            } catch (error) {
                logger.error('Permanent delete error', error)
                alert('Failed to permanently delete file. Please try again.')
            }
        }
    }

    // Separate folders and files
    const folders = filteredFiles.filter(f => f.isFolder)
    const regularFiles = filteredFiles.filter(f => !f.isFolder)

    return (
        <div className={styles.dashboard}>
            <DashboardHeader />
            <div className={styles.dashboardContent}>
                <Sidebar
                    activeSection={activeSection}
                    onSectionChange={setActiveSection}
                    onNewClick={handleNewClick}
                />
                <main className={styles.mainContent}>
                    <div className={styles.contentHeader}>
                        <h1 className={styles.contentTitle}>
                            {activeSection === 'my-files' && 'My Files'}
                            {activeSection === 'shared' && 'Shared With Me'}
                            {activeSection === 'recent' && 'Recent'}
                            {activeSection === 'starred' && 'Starred'}
                            {activeSection === 'trash' && 'Trash'}
                            {activeSection === 'public-pool' && 'Public Pool'}
                        </h1>
                        <div className={styles.viewControls}>
                            <button
                                className={`${styles.viewButton} ${viewMode === 'grid' ? styles.viewButtonActive : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="Grid view"
                            >
                                <IoGridOutline size={20} />
                            </button>
                            <button
                                className={`${styles.viewButton} ${viewMode === 'list' ? styles.viewButtonActive : ''}`}
                                onClick={() => setViewMode('list')}
                                title="List view"
                            >
                                <IoListOutline size={20} />
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className={styles.emptyState}>
                            <p>Loading files...</p>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className={styles.emptyState}>
                            <IoFolderOutline size={64} color="#ccc" />
                            <p>No files yet</p>
                            {(activeSection === 'my-files' || activeSection === 'recent') && (
                                <button className={styles.uploadButton} onClick={() => navigate('/home')}>
                                    Upload Files
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className={styles.filesContainer}>
                            {viewMode === 'list' ? (
                                <div className={styles.filesList}>
                                    {folders.length > 0 && (
                                        <>
                                            <div className={styles.sectionHeader}>Folders</div>
                                            {folders.map((file) => (
                                                <div key={file.file_id} className={styles.fileItem}>
                                                    <IoFolderOutline size={24} color="var(--blue)" />
                                                    <span className={styles.fileName}>{file.original_name}</span>
                                                    <span className={styles.fileDate}>{formatDate(file.created_at)}</span>
                                                    <div className={styles.fileActions}>
                                                        {activeSection === 'trash' ? (
                                                            <>
                                                                <button className={styles.actionButton} title="Restore" onClick={() => handleRestoreFile(file.file_id, file.original_name)}>
                                                                    <IoRefreshOutline size={18} />
                                                                </button>
                                                                <button className={styles.actionButton} title="Permanently Delete" onClick={() => handlePermanentDelete(file.file_id, file.original_name)}>
                                                                    <IoTrashOutline size={18} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button 
                                                                className={styles.actionButton} 
                                                                title="Delete" 
                                                                onClick={(e) => {
                                                                    e.preventDefault()
                                                                    e.stopPropagation()
                                                                    handleDeleteFile(file.file_id, file.original_name)
                                                                }}
                                                            >
                                                                <IoTrashOutline size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                    {regularFiles.length > 0 && (
                                        <>
                                            {folders.length > 0 && <div className={styles.sectionHeader}>Files</div>}
                                            {regularFiles.map((fileItem) => {
                                                const IconComponent = getFileIcon(fileItem.original_name, fileItem.mime_type)
                                                const isImage = fileItem.mime_type?.startsWith('image/')
                                                const thumbnail = imageThumbnails[fileItem.file_id]
                                                return (
                                                    <div 
                                                        key={fileItem.file_id} 
                                                        className={styles.fileItem}
                                                        onClick={() => handleFileClick(fileItem)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className={styles.fileIcon}>
                                                            {isImage && thumbnail ? (
                                                                <img src={thumbnail} alt={fileItem.original_name} className={styles.fileThumbnail} />
                                                            ) : (
                                                                <IconComponent size={24} />
                                                            )}
                                                        </div>
                                                        <span className={styles.fileName}>{fileItem.original_name}</span>
                                                        <span className={styles.fileSize}>{formatFileSize(fileItem.file_size)}</span>
                                                        <span className={styles.fileDate}>{formatDate(fileItem.created_at)}</span>
                                                        <div className={styles.fileActions} onClick={(e) => e.stopPropagation()}>
                                                            {activeSection !== 'trash' && (
                                                                <button 
                                                                    className={styles.actionButton} 
                                                                    title={fileItem.is_starred ? "Unstar" : "Star"} 
                                                                    onClick={(e) => handleToggleStar(fileItem.file_id, e)}
                                                                >
                                                                    {fileItem.is_starred ? <IoStar size={18} color="#ffc107" /> : <IoStarOutline size={18} />}
                                                                </button>
                                                            )}
                                                            <button className={styles.actionButton} title="Download" onClick={() => handleDownloadFile(fileItem)}>
                                                                <IoDownloadOutline size={18} />
                                                            </button>
                                                            {activeSection === 'trash' ? (
                                                                <>
                                                                    <button className={styles.actionButton} title="Restore" onClick={() => handleRestoreFile(fileItem.file_id, fileItem.original_name)}>
                                                                        <IoRefreshOutline size={18} />
                                                                    </button>
                                                                    <button className={styles.actionButton} title="Permanently Delete" onClick={() => handlePermanentDelete(fileItem.file_id, fileItem.original_name)}>
                                                                        <IoTrashOutline size={18} />
                                                                    </button>
                                                                </>
                                                            ) : activeSection === 'shared' ? (
                                                                <>
                                                                    <button 
                                                                        className={styles.actionButton} 
                                                                        title="Remove from Shared With Me" 
                                                                        onClick={() => handleRemoveFromSharedWithMe((fileItem as any).share_id, fileItem.original_name)}
                                                                    >
                                                                        <IoCloseOutline size={18} />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className={styles.menuContainer}>
                                                                        <button 
                                                                            className={styles.actionButton} 
                                                                            title="More options"
                                                                            onClick={(e) => {
                                                                                e.preventDefault()
                                                                                e.stopPropagation()
                                                                                setMenuOpenFileId(menuOpenFileId === fileItem.file_id ? null : fileItem.file_id)
                                                                            }}
                                                                        >
                                                                            <IoEllipsisVerticalOutline size={18} />
                                                                        </button>
                                                                        {menuOpenFileId === fileItem.file_id && (
                                                                            <div 
                                                                                className={styles.menuDropdown}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                }}
                                                                            >
                                                                                <button 
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault()
                                                                                        e.stopPropagation()
                                                                                        setMenuOpenFileId(null)
                                                                                        handleShareFile(fileItem.file_id, 'public')
                                                                                    }}
                                                                                >
                                                                                    <IoShareSocialOutline size={16} />
                                                                                    Share Publicly
                                                                                </button>
                                                                                <button 
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault()
                                                                                        e.stopPropagation()
                                                                                        setMenuOpenFileId(null)
                                                                                        handleShareFile(fileItem.file_id, 'link')
                                                                                    }}
                                                                                >
                                                                                    <IoShareSocialOutline size={16} />
                                                                                    Share with Link
                                                                                </button>
                                                                                <button 
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault()
                                                                                        e.stopPropagation()
                                                                                        setMenuOpenFileId(null)
                                                                                        handleDeleteFile(fileItem.file_id, fileItem.original_name)
                                                                                    }}
                                                                                >
                                                                                    <IoTrashOutline size={16} />
                                                                                    Delete
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.filesGrid}>
                                    {[...folders, ...regularFiles].map((file) => {
                                        const IconComponent = file.isFolder 
                                            ? IoFolderOutline 
                                            : getFileIcon(file.original_name, file.mime_type)
                                        const isImage = !file.isFolder && file.mime_type?.startsWith('image/')
                                        const thumbnail = imageThumbnails[file.file_id]
                                        return (
                                            <div 
                                                key={file.file_id} 
                                                className={styles.fileCard}
                                                onClick={() => !file.isFolder && handleFileClick(file)}
                                                style={{ cursor: file.isFolder ? 'default' : 'pointer' }}
                                            >
                                                <div className={styles.fileIcon}>
                                                    {isImage && thumbnail ? (
                                                        <img src={thumbnail} alt={file.original_name} className={styles.fileThumbnail} />
                                                    ) : (
                                                        <IconComponent size={48} color="var(--blue)" />
                                                    )}
                                                </div>
                                                <span className={styles.fileCardName}>{file.original_name}</span>
                                                <div className={styles.fileCardActions} onClick={(e) => e.stopPropagation()}>
                                                    {!file.isFolder && activeSection !== 'trash' && activeSection !== 'shared' && activeSection !== 'public-pool' && (
                                                        <button 
                                                            className={styles.actionButton} 
                                                            title={file.is_starred ? "Unstar" : "Star"} 
                                                            onClick={(e) => handleToggleStar(file.file_id, e)}
                                                        >
                                                            {file.is_starred ? <IoStar size={18} color="#ffc107" /> : <IoStarOutline size={18} />}
                                                        </button>
                                                    )}
                                                    {!file.isFolder && (
                                                        <button className={styles.actionButton} title="Download" onClick={() => handleDownloadFile(file)}>
                                                            <IoDownloadOutline size={18} />
                                                        </button>
                                                    )}
                                                    {activeSection === 'trash' ? (
                                                        <>
                                                            <button 
                                                                className={styles.actionButton} 
                                                                title="Restore" 
                                                                onClick={(e) => {
                                                                    e.preventDefault()
                                                                    e.stopPropagation()
                                                                    handleRestoreFile(file.file_id, file.original_name)
                                                                }}
                                                            >
                                                                <IoRefreshOutline size={18} />
                                                            </button>
                                                            <button 
                                                                className={styles.actionButton} 
                                                                title="Permanently Delete" 
                                                                onClick={(e) => {
                                                                    e.preventDefault()
                                                                    e.stopPropagation()
                                                                    handlePermanentDelete(file.file_id, file.original_name)
                                                                }}
                                                            >
                                                                <IoTrashOutline size={18} />
                                                            </button>
                                                        </>
                                                    ) : activeSection === 'shared' && !file.isFolder ? (
                                                        <button 
                                                            className={styles.actionButton} 
                                                            title="Remove from Shared With Me" 
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                handleRemoveFromSharedWithMe((file as any).share_id, file.original_name)
                                                            }}
                                                        >
                                                            <IoCloseOutline size={18} />
                                                        </button>
                                                    ) : !file.isFolder && (
                                                        <div className={styles.menuContainer}>
                                                            <button 
                                                                className={styles.actionButton} 
                                                                title="More options"
                                                                onClick={() => setMenuOpenFileId(menuOpenFileId === file.file_id ? null : file.file_id)}
                                                            >
                                                                <IoEllipsisVerticalOutline size={18} />
                                                            </button>
                                                            {menuOpenFileId === file.file_id && (
                                                                <div 
                                                                    className={styles.menuDropdown}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                    }}
                                                                >
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.preventDefault()
                                                                            e.stopPropagation()
                                                                            setMenuOpenFileId(null)
                                                                            handleShareFile(file.file_id, 'public')
                                                                        }}
                                                                    >
                                                                        <IoShareSocialOutline size={16} />
                                                                        Share Publicly
                                                                    </button>
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.preventDefault()
                                                                            e.stopPropagation()
                                                                            setMenuOpenFileId(null)
                                                                            handleShareFile(file.file_id, 'link')
                                                                        }}
                                                                    >
                                                                        <IoShareSocialOutline size={16} />
                                                                        Share with Link
                                                                    </button>
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.preventDefault()
                                                                            e.stopPropagation()
                                                                            setMenuOpenFileId(null)
                                                                            handleDeleteFile(file.file_id, file.original_name)
                                                                        }}
                                                                    >
                                                                        <IoTrashOutline size={16} />
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
            
            {previewFile && (
                <Dialog
                    isOpen={true}
                    onClose={closePreview}
                    title={previewFile.original_name}
                    large={true}
                >
                    <div className={styles.previewContainer}>
                        {previewError ? (
                            <div className={styles.previewError}>
                                <p>{previewError}</p>
                                <button
                                    className={styles.previewDownloadButton}
                                    onClick={() => {
                                        handleDownloadFile(previewFile)
                                        closePreview()
                                    }}
                                >
                                    <IoDownloadOutline size={20} />
                                    Download File
                                </button>
                            </div>
                        ) : previewUrl ? (
                            <div className={styles.previewContent}>
                                {previewFile.mime_type?.startsWith('image/') && (
                                    <img src={previewUrl} alt={previewFile.original_name} className={styles.previewImage} />
                                )}
                                {previewFile.mime_type?.startsWith('video/') && (
                                    <video src={previewUrl} controls className={styles.previewVideo} />
                                )}
                                {previewFile.mime_type === 'application/pdf' && (
                                    <iframe src={previewUrl} className={styles.previewIframe} title={previewFile.original_name} />
                                )}
                            </div>
                        ) : previewText !== null ? (
                            <div className={styles.previewContent}>
                                <code className={styles.previewText}>{previewText}</code>
                            </div>
                        ) : (
                            <div className={styles.previewLoading}>Loading preview...</div>
                        )}
                    </div>
                </Dialog>
            )}
        </div>
    )
}

export default MyFiles

