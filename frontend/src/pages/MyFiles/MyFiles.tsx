import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardHeader from '../../components/DashboardHeader/DashboardHeader'
import Sidebar from '../../components/Sidebar/Sidebar'
import Dialog from '../../components/Dialog/Dialog'
import styles from './MyFiles.module.css'
import { IoTrashOutline, IoDownloadOutline, IoGridOutline, IoListOutline, IoDocumentTextOutline, IoFolderOutline, IoEyeOutline, IoCloseOutline } from 'react-icons/io5'
import { apiGetCurrentUser, apiListFiles, apiDeleteFile, apiDownloadFile, apiPermanentDeleteFile } from '../../utils/api'
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
            const includeDeleted = activeSection === 'trash'
            const response = await apiListFiles(50, 0, includeDeleted)
            if (response.success && response.files) {
                setFiles(response.files)
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

    const handleNewClick = () => {
        navigate('/home')
    }

    const handleDeleteFile = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete "${name}"? This will move it to trash.`)) {
            try {
                const response = await apiDeleteFile(id)
                if (response.success) {
                    setFiles((prev) => prev.filter((f) => f.file_id !== id))
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

    // Filter files based on active section
    const filteredFiles = files.filter((file) => {
        switch (activeSection) {
            case 'trash':
                return file.is_deleted === true
            case 'starred':
                return false // TODO: Implement starred filter
            case 'recent':
                return true // Show all for now
            case 'shared':
                return false // TODO: Implement shared filter
            default:
                return !file.is_deleted
        }
    })

    const handlePermanentDelete = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) {
            try {
                const response = await apiPermanentDeleteFile(id)
                if (response.success) {
                    setFiles((prev) => prev.filter((f) => f.file_id !== id))
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
                            <button className={styles.uploadButton} onClick={() => navigate('/home')}>
                                Upload Files
                            </button>
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
                                                            <button className={styles.actionButton} title="Permanently Delete" onClick={() => handlePermanentDelete(file.file_id, file.original_name)}>
                                                                <IoTrashOutline size={18} />
                                                            </button>
                                                        ) : (
                                                            <button className={styles.actionButton} title="Delete" onClick={() => handleDeleteFile(file.file_id, file.original_name)}>
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
                                                return (
                                                    <div key={fileItem.file_id} className={styles.fileItem}>
                                                        <div className={styles.fileIcon}>
                                                            <IconComponent size={24} />
                                                        </div>
                                                        <span className={styles.fileName}>{fileItem.original_name}</span>
                                                        <span className={styles.fileSize}>{formatFileSize(fileItem.file_size)}</span>
                                                        <span className={styles.fileDate}>{formatDate(fileItem.created_at)}</span>
                                                        <div className={styles.fileActions}>
                                                            {canPreviewFile(fileItem.mime_type, fileItem.original_name) && (
                                                                <button className={styles.actionButton} title="Preview" onClick={() => handlePreviewFile(fileItem)}>
                                                                    <IoEyeOutline size={18} />
                                                                </button>
                                                            )}
                                                            <button className={styles.actionButton} title="Download" onClick={() => handleDownloadFile(fileItem)}>
                                                                <IoDownloadOutline size={18} />
                                                            </button>
                                                            {activeSection === 'trash' ? (
                                                                <button className={styles.actionButton} title="Permanently Delete" onClick={() => handlePermanentDelete(fileItem.file_id, fileItem.original_name)}>
                                                                    <IoTrashOutline size={18} />
                                                                </button>
                                                            ) : (
                                                                <button className={styles.actionButton} title="Delete" onClick={() => handleDeleteFile(fileItem.file_id, fileItem.original_name)}>
                                                                    <IoTrashOutline size={18} />
                                                                </button>
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
                                        return (
                                            <div key={file.file_id} className={styles.fileCard}>
                                                <div className={styles.fileIcon}>
                                                    <IconComponent size={48} color="var(--blue)" />
                                                </div>
                                                <span className={styles.fileCardName}>{file.original_name}</span>
                                                <div className={styles.fileCardActions}>
                                                    {!file.isFolder && canPreviewFile(file.mime_type, file.original_name) && (
                                                        <button className={styles.actionButton} title="Preview" onClick={() => handlePreviewFile(file)}>
                                                            <IoEyeOutline size={18} />
                                                        </button>
                                                    )}
                                                    {!file.isFolder && (
                                                        <button className={styles.actionButton} title="Download" onClick={() => handleDownloadFile(file)}>
                                                            <IoDownloadOutline size={18} />
                                                        </button>
                                                    )}
                                                    {activeSection === 'trash' ? (
                                                        <button className={styles.actionButton} title="Permanently Delete" onClick={() => handlePermanentDelete(file.file_id, file.original_name)}>
                                                            <IoTrashOutline size={18} />
                                                        </button>
                                                    ) : (
                                                        <button className={styles.actionButton} title="Delete" onClick={() => handleDeleteFile(file.file_id, file.original_name)}>
                                                            <IoTrashOutline size={18} />
                                                        </button>
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
                                <pre className={styles.previewText}>{previewText}</pre>
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

