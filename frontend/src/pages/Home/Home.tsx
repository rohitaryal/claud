import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../../components/Navigation/Navigation'
import Footer from '../../components/Footer/Footer'
import styles from './Home.module.css'
import { IoCloudUploadOutline, IoTrashOutline, IoDownloadOutline, IoLogOutOutline } from 'react-icons/io5'

interface UploadedFile {
    id: string
    name: string
    size: number
    type: string
    uploadedAt: Date
    originalName: string
}

const Home = function () {
    const navigate = useNavigate()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [files, setFiles] = useState<UploadedFile[]>([])
    const [uploading, setUploading] = useState(false)
    const [userInfo] = useState({
        username: 'John Doe',
        email: 'john@example.com',
        storageUsed: 125, // MB
        storageLimit: 5120 // 5GB
    })

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.currentTarget.files
        if (!selectedFiles) return

        setUploading(true)
        try {
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i]

                // Create FormData for file upload
                const formData = new FormData()
                formData.append('file', file)

                // TODO: API call to backend
                // const response = await fetch('/api/files/upload', {
                //     method: 'POST',
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
            }
        } catch (error) {
            console.error('Upload failed:', error)
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
        }
    }

    const handleLogout = () => {
        // TODO: API call to logout
        navigate('/')
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

    const totalStoragePercent = Math.round((userInfo.storageUsed / userInfo.storageLimit) * 100)

    return (
        <>
            <Navigation />
            <div className={styles.homeContainer}>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1>Welcome, {userInfo.username}!</h1>
                        <p>Manage your files securely in the cloud</p>
                    </div>
                    <button onClick={handleLogout} className={styles.logoutButton}>
                        <IoLogOutOutline size={20} />
                        Logout
                    </button>
                </div>

                <div className={styles.mainContent}>
                    {/* User Info Section */}
                    <div className={styles.userInfoCard}>
                        <h2>Account Information</h2>
                        <div className={styles.userInfoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Username</span>
                                <span className={styles.value}>{userInfo.username}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Email</span>
                                <span className={styles.value}>{userInfo.email}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Storage Used</span>
                                <span className={styles.value}>
                                    {userInfo.storageUsed} MB / {userInfo.storageLimit} MB
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Usage</span>
                                <div className={styles.storageBar}>
                                    <div
                                        className={styles.storageProgress}
                                        style={{
                                            width: `${Math.min(totalStoragePercent, 100)}%`,
                                            background: totalStoragePercent > 90 ? '#ef4444' : 'var(--blue-gradient)'
                                        }}
                                    ></div>
                                </div>
                                <span className={styles.percentage}>{totalStoragePercent}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Upload Section */}
                    <div className={styles.uploadSection}>
                        <h2>Upload Files</h2>
                        <div
                            className={styles.uploadBox}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => {
                                e.preventDefault()
                                e.currentTarget.classList.add(styles.dragOver)
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.classList.remove(styles.dragOver)
                            }}
                            onDrop={(e) => {
                                e.preventDefault()
                                e.currentTarget.classList.remove(styles.dragOver)
                                if (e.dataTransfer.files) {
                                    fileInputRef.current!.files = e.dataTransfer.files
                                    handleFileSelect({
                                        currentTarget: fileInputRef.current!
                                    } as React.ChangeEvent<HTMLInputElement>)
                                }
                            }}
                        >
                            <IoCloudUploadOutline size={48} color="var(--blue)" />
                            <p className={styles.uploadText}>
                                Drag and drop files here or click to select
                            </p>
                            <span className={styles.uploadSubtext}>
                                Supports multiple files up to {userInfo.storageLimit} MB each
                            </span>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            disabled={uploading}
                            style={{ display: 'none' }}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className={styles.uploadButton}
                            disabled={uploading}
                        >
                            {uploading ? 'Uploading...' : 'Select Files to Upload'}
                        </button>
                    </div>

                    {/* Files Section */}
                    <div className={styles.filesSection}>
                        <h2>Your Files ({files.length})</h2>
                        {files.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>No files uploaded yet. Start by uploading your first file!</p>
                            </div>
                        ) : (
                            <div className={styles.filesTable}>
                                <div className={styles.tableHeader}>
                                    <div className={styles.colName}>File Name</div>
                                    <div className={styles.colSize}>Size</div>
                                    <div className={styles.colDate}>Uploaded</div>
                                    <div className={styles.colActions}>Actions</div>
                                </div>
                                {files.map((file) => (
                                    <div key={file.id} className={styles.tableRow}>
                                        <div className={styles.colName}>
                                            <span className={styles.fileName}>{file.originalName}</span>
                                        </div>
                                        <div className={styles.colSize}>{formatFileSize(file.size)}</div>
                                        <div className={styles.colDate}>{formatDate(file.uploadedAt)}</div>
                                        <div className={styles.colActions}>
                                            <button
                                                className={styles.actionButton}
                                                title="Download"
                                                onClick={() => {
                                                    // TODO: Implement download
                                                    alert('Download functionality coming soon')
                                                }}
                                            >
                                                <IoDownloadOutline size={18} />
                                            </button>
                                            <button
                                                className={styles.actionButton + ' ' + styles.deleteButton}
                                                title="Delete"
                                                onClick={() => handleDeleteFile(file.id)}
                                            >
                                                <IoTrashOutline size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}

export default Home
