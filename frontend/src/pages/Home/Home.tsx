import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardHeader from '../../components/DashboardHeader/DashboardHeader'
import Sidebar from '../../components/Sidebar/Sidebar'
import styles from './Home.module.css'
import { IoCloudUploadOutline, IoTrashOutline, IoDownloadOutline, IoFolderOutline, IoGridOutline, IoListOutline, IoDocumentTextOutline } from 'react-icons/io5'
import { apiGetCurrentUser } from '../../utils/api'
import { logger } from '../../utils/logger'

interface UploadedFile {
    id: string
    name: string
    size: number
    type: string
    uploadedAt: Date
    originalName: string
    isFolder?: boolean
}

const Home = function () {
    const navigate = useNavigate()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [files, setFiles] = useState<UploadedFile[]>([])
    const [uploading, setUploading] = useState(false)
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

        // Storage usage is loaded in Sidebar component
    }, [navigate])

    const handleNewClick = () => {
        // Show options: Upload File, New Folder
        fileInputRef.current?.click()
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.currentTarget.files
        if (!selectedFiles) return

        setUploading(true)
        try {
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i]
                const formData = new FormData()
                formData.append('file', file)

                // TODO: API call to backend
                // const response = await fetch(`${API_BASE}/api/files/upload`, {
                //     method: 'POST',
                //     credentials: 'include',
                //     body: formData
                // })
                // const data = await response.json()

                // Mock upload
                const newFile: UploadedFile = {
                    id: `file-${Date.now()}-${i}`,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    uploadedAt: new Date(),
                    originalName: file.name
                }

                setFiles((prev) => [newFile, ...prev])
                logger.success('File uploaded', file.name)
            }
        } catch (error) {
            logger.error('Upload failed', error)
            alert('Failed to upload file. Please try again.')
        } finally {
            setUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleDeleteFile = (id: string) => {
        if (confirm('Are you sure you want to delete this file?')) {
            setFiles((prev) => prev.filter((f) => f.id !== id))
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

    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleDateString('en-US', {
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

                    {filteredFiles.length === 0 ? (
                        <div className={styles.emptyState}>
                            <IoFolderOutline size={64} color="#ccc" />
                            <p>No files yet</p>
                            <button className={styles.uploadButton} onClick={handleNewClick}>
                                <IoCloudUploadOutline size={20} />
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
                                                <div key={file.id} className={styles.fileItem}>
                                                    <IoFolderOutline size={24} color="var(--blue)" />
                                                    <span className={styles.fileName}>{file.originalName}</span>
                                                    <span className={styles.fileDate}>{formatDate(file.uploadedAt)}</span>
                                                    <div className={styles.fileActions}>
                                                        <button className={styles.actionButton} title="Delete" onClick={() => handleDeleteFile(file.id)}>
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
                                                <div key={fileItem.id} className={styles.fileItem}>
                                                    <div className={styles.fileIcon}>
                                                        <IoDocumentTextOutline size={24} />
                                                    </div>
                                                    <span className={styles.fileName}>{fileItem.originalName}</span>
                                                    <span className={styles.fileSize}>{formatFileSize(fileItem.size)}</span>
                                                    <span className={styles.fileDate}>{formatDate(fileItem.uploadedAt)}</span>
                                                    <div className={styles.fileActions}>
                                                        <button className={styles.actionButton} title="Download" onClick={() => logger.info('Download', fileItem.originalName)}>
                                                            <IoDownloadOutline size={18} />
                                                        </button>
                                                        <button className={styles.actionButton} title="Delete" onClick={() => handleDeleteFile(fileItem.id)}>
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
                                        <div key={file.id} className={styles.fileCard}>
                                            {file.isFolder ? (
                                                <IoFolderOutline size={48} color="var(--blue)" />
                                            ) : (
                                                <div className={styles.fileIcon}>
                                                    <IoDocumentTextOutline size={48} color="var(--blue)" />
                                                </div>
                                            )}
                                            <span className={styles.fileCardName}>{file.originalName}</span>
                                            <div className={styles.fileCardActions}>
                                                <button className={styles.actionButton} title="Delete" onClick={() => handleDeleteFile(file.id)}>
                                                    <IoTrashOutline size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        disabled={uploading}
                        style={{ display: 'none' }}
                    />
                </main>
            </div>
        </div>
    )
}

export default Home
