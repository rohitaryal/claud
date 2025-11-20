import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardHeader from '../../components/DashboardHeader/DashboardHeader'
import Sidebar from '../../components/Sidebar/Sidebar'
import styles from './Home.module.css'
import { IoAddOutline } from 'react-icons/io5'
import { apiGetCurrentUser, apiUploadFile } from '../../utils/api'
import { logger } from '../../utils/logger'

interface UploadProgress {
    file: File
    progress: number
    status: 'uploading' | 'success' | 'error'
    error?: string
}

const Home = function () {
    const navigate = useNavigate()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const dropZoneRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [uploads, setUploads] = useState<UploadProgress[]>([])
    const [, setUser] = useState<any>(null)

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

    const uploadFile = async (file: File) => {
        // Add to uploads list
        setUploads((prev) => [
            ...prev,
            {
                file,
                progress: 0,
                status: 'uploading'
            }
        ])

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

            if (response.success) {
                setUploads((prev) =>
                    prev.map((upload) =>
                        upload.file === file
                            ? { ...upload, progress: 100, status: 'success' }
                            : upload
                    )
                )
                logger.success('File uploaded', file.name)
                
                // Remove from list after 2 seconds
                setTimeout(() => {
                    setUploads((prev) => prev.filter((upload) => upload.file !== file))
                }, 2000)
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
            setUploads((prev) =>
                prev.map((upload) =>
                    upload.file === file
                        ? { ...upload, status: 'error', error: 'Network error' }
                        : upload
                )
            )
            logger.error('Upload error', error)
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.currentTarget.files
        if (!selectedFiles) return

        for (let i = 0; i < selectedFiles.length; i++) {
            await uploadFile(selectedFiles[i])
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
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

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const droppedFiles = Array.from(e.dataTransfer.files)
        for (const file of droppedFiles) {
            await uploadFile(file)
        }
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
                            <h2 className={styles.uploadListTitle}>Upload Status</h2>
                            {uploads.map((upload, index) => (
                                <div key={`${upload.file.name}-${index}`} className={styles.uploadItem}>
                                    <div className={styles.uploadItemHeader}>
                                        <span className={styles.uploadItemName}>{upload.file.name}</span>
                                        <span className={styles.uploadItemSize}>{formatFileSize(upload.file.size)}</span>
                                    </div>
                                    <div className={styles.progressBarContainer}>
                                        <div
                                            className={`${styles.progressBar} ${
                                                upload.status === 'success'
                                                    ? styles.progressBarSuccess
                                                    : upload.status === 'error'
                                                    ? styles.progressBarError
                                                    : ''
                                            }`}
                                            style={{ width: `${upload.progress}%` }}
                                        />
                                    </div>
                                    <div className={styles.uploadItemStatus}>
                                        {upload.status === 'uploading' && (
                                            <span>{Math.round(upload.progress)}%</span>
                                        )}
                                        {upload.status === 'success' && (
                                            <span className={styles.statusSuccess}>Upload complete</span>
                                        )}
                                        {upload.status === 'error' && (
                                            <span className={styles.statusError}>
                                                {upload.error || 'Upload failed'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
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
