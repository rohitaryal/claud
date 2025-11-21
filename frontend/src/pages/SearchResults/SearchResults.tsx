import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DashboardHeader from '../../components/DashboardHeader/DashboardHeader'
import Sidebar from '../../components/Sidebar/Sidebar'
import styles from './SearchResults.module.css'
import { apiSearchFiles, apiGetCurrentUser, type AuthUser } from '../../utils/api'
import { getFileIcon } from '../../utils/fileIcons'
import { logger } from '../../utils/logger'

interface FileItem {
    file_id: string
    original_name: string
    file_size: number
    mime_type: string
    created_at: string
}

const SearchResults = function () {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const query = searchParams.get('q') || ''
    const [files, setFiles] = useState<FileItem[]>([])
    const [loading, setLoading] = useState(true)
    const [, setUser] = useState<AuthUser | null>(null)

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

        // Load search results
        if (query) {
            loadSearchResults()
        }
    }, [query, navigate])

    const loadSearchResults = async () => {
        setLoading(true)
        try {
            const response = await apiSearchFiles(query, 50)
            if (response.success && response.files) {
                setFiles(response.files)
            }
        } catch (error) {
            logger.error('Failed to load search results', error)
        } finally {
            setLoading(false)
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
                    onNewClick={() => navigate('/home')}
                />
                <main className={styles.mainContent}>
                    <div className={styles.contentHeader}>
                        <h1 className={styles.contentTitle}>
                            Search Results{query && `: "${query}"`}
                        </h1>
                    </div>

                    {loading ? (
                        <div className={styles.emptyState}>
                            <p>Searching...</p>
                        </div>
                    ) : files.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No files found matching "{query}"</p>
                        </div>
                    ) : (
                        <div className={styles.filesContainer}>
                            <div className={styles.filesList}>
                                {files.map((file) => {
                                    const IconComponent = getFileIcon(file.original_name, file.mime_type)
                                    return (
                                        <div key={file.file_id} className={styles.fileItem}>
                                            <div className={styles.fileIcon}>
                                                <IconComponent size={24} />
                                            </div>
                                            <span className={styles.fileName}>{file.original_name}</span>
                                            <span className={styles.fileSize}>{formatFileSize(file.file_size)}</span>
                                            <span className={styles.fileDate}>{formatDate(file.created_at)}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default SearchResults

