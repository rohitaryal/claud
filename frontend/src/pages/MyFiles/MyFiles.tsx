import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardHeader from '../../components/DashboardHeader/DashboardHeader'
import Sidebar from '../../components/Sidebar/Sidebar'
import styles from './MyFiles.module.css'
import { IoTrashOutline, IoDownloadOutline, IoGridOutline, IoListOutline, IoDocumentTextOutline, IoFolderOutline } from 'react-icons/io5'
import { apiGetCurrentUser, apiListFiles } from '../../utils/api'
import { logger } from '../../utils/logger'

interface FileItem {
    file_id: string
    original_name: string
    file_size: number
    mime_type: string
    created_at: string
    isFolder?: boolean
}

const MyFiles = function () {
    const navigate = useNavigate()
    const [files, setFiles] = useState<FileItem[]>([])
    const [loading, setLoading] = useState(true)
    const [activeSection, setActiveSection] = useState('my-files')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
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

        // Load files
        loadFiles()
    }, [navigate])

    const loadFiles = async () => {
        setLoading(true)
        try {
            const response = await apiListFiles()
            if (response.success && response.files) {
                setFiles(response.files)
            }
        } catch (error) {
            logger.error('Failed to load files', error)
        } finally {
            setLoading(false)
        }
    }

    const handleNewClick = () => {
        navigate('/home')
    }

    const handleDeleteFile = (id: string) => {
        if (confirm('Are you sure you want to delete this file?')) {
            // TODO: Implement delete API call
            setFiles((prev) => prev.filter((f) => f.file_id !== id))
            logger.info('File deleted', id)
        }
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
    const filteredFiles = files.filter(() => {
        switch (activeSection) {
            case 'trash':
                return false // TODO: Implement trash filter
            case 'starred':
                return false // TODO: Implement starred filter
            case 'recent':
                return true // Show all for now
            case 'shared':
                return false // TODO: Implement shared filter
            default:
                return true
        }
    })

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
                                                        <button className={styles.actionButton} title="Delete" onClick={() => handleDeleteFile(file.file_id)}>
                                                            <IoTrashOutline size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                    {regularFiles.length > 0 && (
                                        <>
                                            {folders.length > 0 && <div className={styles.sectionHeader}>Files</div>}
                                            {regularFiles.map((fileItem) => (
                                                <div key={fileItem.file_id} className={styles.fileItem}>
                                                    <div className={styles.fileIcon}>
                                                        <IoDocumentTextOutline size={24} />
                                                    </div>
                                                    <span className={styles.fileName}>{fileItem.original_name}</span>
                                                    <span className={styles.fileSize}>{formatFileSize(fileItem.file_size)}</span>
                                                    <span className={styles.fileDate}>{formatDate(fileItem.created_at)}</span>
                                                    <div className={styles.fileActions}>
                                                        <button className={styles.actionButton} title="Download" onClick={() => logger.info('Download', fileItem.original_name)}>
                                                            <IoDownloadOutline size={18} />
                                                        </button>
                                                        <button className={styles.actionButton} title="Delete" onClick={() => handleDeleteFile(fileItem.file_id)}>
                                                            <IoTrashOutline size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.filesGrid}>
                                    {[...folders, ...regularFiles].map((file) => (
                                        <div key={file.file_id} className={styles.fileCard}>
                                            {file.isFolder ? (
                                                <IoFolderOutline size={48} color="var(--blue)" />
                                            ) : (
                                                <div className={styles.fileIcon}>
                                                    <IoDocumentTextOutline size={48} color="var(--blue)" />
                                                </div>
                                            )}
                                            <span className={styles.fileCardName}>{file.original_name}</span>
                                            <div className={styles.fileCardActions}>
                                                <button className={styles.actionButton} title="Delete" onClick={() => handleDeleteFile(file.file_id)}>
                                                    <IoTrashOutline size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default MyFiles

