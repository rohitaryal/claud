import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardHeader from '../../components/DashboardHeader/DashboardHeader'
import Sidebar from '../../components/Sidebar/Sidebar'
import styles from './Home.module.css'
import { IoAddOutline, IoCloudUploadOutline, IoCloseOutline, IoCreateOutline } from 'react-icons/io5'
import { apiGetCurrentUser, apiUploadFile, apiUpdateFile } from '../../utils/api'
import { logger } from '../../utils/logger'
import { getFileIcon } from '../../utils/fileIcons'

interface UploadProgress {
    file: File
    progress: number
    status: 'pending' | 'uploading' | 'success' | 'error'
    error?: string
    fileId?: string
    customName?: string
}

const Home = function () {
    const navigate = useNavigate()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const dropZoneRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [uploads, setUploads] = useState<UploadProgress[]>([])
    const [, setUser] = useState<any>(null)
    const [editingFileName, setEditingFileName] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')

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
    }, [navigate])

    const handleNewClick = () => {
        fileInputRef.current?.click()
    }

    const uploadFile = async (file: File, customName?: string) => {
        // Update status to uploading
        setUploads((prev) =>
            prev.map((upload) =>
                upload.file === file
                    ? { ...upload, status: 'uploading' }
                    : upload
            )
        )

        try {
            const response = await apiUploadFile(file, (progress) => {
                setUploads((prev) =>
                    prev.map((upload) =>
                        upload.file === file
                            ? { ...upload, progress }
                            : upload
                    )
                )
            })

            if (response.success && response.file) {
                const fileId = response.file.file_id
                
                // If custom name is different, update it
                if (customName && customName !== file.name) {
                    try {
                        await apiUpdateFile(fileId, customName)
                    } catch (error) {
                        logger.error('Failed to update file name', error)
                    }
                }

                setUploads((prev) =>
                    prev.map((upload) =>
                        upload.file === file
                            ? { ...upload, progress: 100, status: 'success', fileId }
                            : upload
                    )
                )
                logger.success('File uploaded', customName || file.name)
            } else {
                setUploads((prev) =>
                    prev.map((upload) =>
                        upload.file === file
                            ? { ...upload, status: 'error', error: response.message || 'Upload failed' }
                            : upload
                    )
                )
                logger.error('Upload failed', response.message)
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Network error. Please try again.'
            setUploads((prev) =>
                prev.map((upload) =>
                    upload.file === file
                        ? { ...upload, status: 'error', error: errorMessage }
                        : upload
                )
            )
            logger.error('Upload error', error)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.currentTarget.files
        if (!selectedFiles) return

        // Add files to uploads list with pending status
        const newUploads: UploadProgress[] = Array.from(selectedFiles).map(file => ({
            file,
            progress: 0,
            status: 'pending',
            customName: file.name
        }))

        setUploads((prev) => [...prev, ...newUploads])

        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleUploadAll = async () => {
        const pendingUploads = uploads.filter(u => u.status === 'pending')
        for (const upload of pendingUploads) {
            await uploadFile(upload.file, upload.customName)
        }
    }

    const handleRemoveFile = (index: number) => {
        setUploads((prev) => prev.filter((_, i) => i !== index))
    }

    const handleStartEditName = (index: number, currentName: string) => {
        setEditingFileName(`${index}`)
        setEditingName(currentName)
    }

    const handleSaveEditName = (index: number) => {
        if (editingName.trim()) {
            setUploads((prev) =>
                prev.map((upload, i) =>
                    i === index ? { ...upload, customName: editingName.trim() } : upload
                )
            )
        }
        setEditingFileName(null)
        setEditingName('')
    }

    const handleCancelEditName = () => {
        setEditingFileName(null)
        setEditingName('')
    }

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const droppedFiles = Array.from(e.dataTransfer.files)
        const newUploads: UploadProgress[] = droppedFiles.map(file => ({
            file,
            progress: 0,
            status: 'pending',
            customName: file.name
        }))

        setUploads((prev) => [...prev, ...newUploads])
    }, [])

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    return (
        <div className={styles.dashboard}>
            <DashboardHeader />
            <div className={styles.dashboardContent}>
                <Sidebar
                    activeSection=""
                    onSectionChange={(section) => {
                        if (section === 'my-files') {
                            navigate('/files')
                        }
                    }}
                    onNewClick={handleNewClick}
                />
                <main className={styles.mainContent}>
                    <div className={styles.contentHeader}>
                        <h1 className={styles.contentTitle}>Upload Files</h1>
                    </div>

                    <div
                        ref={dropZoneRef}
                        className={`${styles.uploadZone} ${isDragging ? styles.uploadZoneDragging : ''}`}
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className={styles.uploadButtonContainer}>
                            <button
                                className={styles.uploadButton}
                                onClick={handleNewClick}
                                type="button"
                            >
                                <IoAddOutline size={48} />
                            </button>
                            <p className={styles.uploadPlaceholder}>
                                Click to upload or drag and drop files here
                            </p>
                        </div>
                    </div>

                    {uploads.length > 0 && (
                        <div className={styles.uploadList}>
                            <div className={styles.uploadListHeader}>
                                <h2 className={styles.uploadListTitle}>Files to Upload</h2>
                                {uploads.some(u => u.status === 'pending') && (
                                    <button
                                        className={styles.uploadAllButton}
                                        onClick={handleUploadAll}
                                        disabled={!uploads.some(u => u.status === 'pending')}
                                    >
                                        <IoCloudUploadOutline size={20} />
                                        Upload All
                                    </button>
                                )}
                            </div>
                            <div className={styles.uploadGrid}>
                                {uploads.map((upload, index) => {
                                    const IconComponent = getFileIcon(upload.file.name, upload.file.type)
                                    const displayName = upload.customName || upload.file.name
                                    const isEditing = editingFileName === `${index}`
                                    
                                    return (
                                        <div
                                            key={`${upload.file.name}-${index}`}
                                            className={`${styles.uploadCard} ${
                                                upload.status === 'success' ? styles.uploadCardSuccess : ''
                                            }`}
                                        >
                                            <div className={styles.uploadCardHeader}>
                                                <div className={styles.uploadCardIcon}>
                                                    <IconComponent size={32} />
                                                </div>
                                                <button
                                                    className={styles.uploadCardRemove}
                                                    onClick={() => handleRemoveFile(index)}
                                                    title="Remove"
                                                >
                                                    <IoCloseOutline size={18} />
                                                </button>
                                            </div>
                                            {isEditing ? (
                                                <div className={styles.uploadCardEdit}>
                                                    <input
                                                        type="text"
                                                        value={editingName}
                                                        onChange={(e) => setEditingName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleSaveEditName(index)
                                                            } else if (e.key === 'Escape') {
                                                                handleCancelEditName()
                                                            }
                                                        }}
                                                        className={styles.uploadCardEditInput}
                                                        autoFocus
                                                    />
                                                    <div className={styles.uploadCardEditActions}>
                                                        <button
                                                            onClick={() => handleSaveEditName(index)}
                                                            className={styles.uploadCardEditButton}
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEditName}
                                                            className={styles.uploadCardEditButton}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={styles.uploadCardContent}>
                                                    <div className={styles.uploadCardNameRow}>
                                                        <span className={styles.uploadCardName} title={displayName}>
                                                            {displayName}
                                                        </span>
                                                        {upload.status === 'pending' && (
                                                            <button
                                                                className={styles.uploadCardEditButton}
                                                                onClick={() => handleStartEditName(index, displayName)}
                                                                title="Edit name"
                                                            >
                                                                <IoCreateOutline size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <span className={styles.uploadCardSize}>
                                                        {formatFileSize(upload.file.size)}
                                                    </span>
                                                </div>
                                            )}
                                            {upload.status === 'uploading' && (
                                                <div className={styles.progressBarContainer}>
                                                    <div
                                                        className={styles.progressBar}
                                                        style={{ width: `${upload.progress}%` }}
                                                    />
                                                </div>
                                            )}
                                            {upload.status === 'success' && (
                                                <div className={styles.uploadCardSuccessBadge}>
                                                    Uploaded
                                                </div>
                                            )}
                                            {upload.status === 'error' && (
                                                <div className={styles.uploadCardError}>
                                                    {upload.error || 'Upload failed'}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                </main>
            </div>
        </div>
    )
}

export default Home
