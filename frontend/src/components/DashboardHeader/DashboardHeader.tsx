import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoSearchOutline, IoPersonCircleOutline, IoLogOutOutline, IoSettingsOutline, IoDocumentTextOutline, IoFolderOutline } from 'react-icons/io5'
import { apiGetCurrentUser, apiLogout, apiSearchFiles } from '../../utils/api'
import type { AuthUser } from '../../utils/api'
import styles from './DashboardHeader.module.css'

interface SearchResult {
    file_id: string
    original_name: string
    file_size: number
    mime_type: string
    created_at: string
}

const DashboardHeader = function () {
    const navigate = useNavigate()
    const [user, setUser] = useState<AuthUser | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [showSearchResults, setShowSearchResults] = useState(false)
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const searchContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Load user info
        const loadUser = async () => {
            const response = await apiGetCurrentUser()
            if (response.success && response.user) {
                setUser(response.user)
            }
        }
        loadUser()
    }, [])

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowSearchResults(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSearch = useCallback(async (query: string) => {
        if (query.trim().length === 0) {
            setSearchResults([])
            setShowSearchResults(false)
            return
        }

        try {
            const response = await apiSearchFiles(query, 5)
            if (response.success && response.files) {
                setSearchResults(response.files)
                setShowSearchResults(true)
            }
        } catch (error) {
            console.error('Search error:', error)
        }
    }, [])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchQuery(value)

        // Debounce search
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        if (value.trim().length > 0) {
            searchTimeoutRef.current = setTimeout(() => {
                handleSearch(value)
            }, 300)
        } else {
            setSearchResults([])
            setShowSearchResults(false)
        }
    }

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (searchQuery.trim().length > 0) {
                navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
                setShowSearchResults(false)
            }
        }
    }

    const handleResultClick = (fileId: string) => {
        navigate(`/files`)
        setShowSearchResults(false)
        setSearchQuery('')
    }

    const handleLogout = async () => {
        await apiLogout()
        setUser(null)
        navigate('/')
    }

    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <img 
                    src="/cloud-original.png" 
                    className={styles.logo} 
                    onClick={() => navigate('/home')}
                    alt="Claud Logo"
                />
            </div>

            <div className={styles.headerCenter}>
                <div className={styles.searchContainer} ref={searchContainerRef}>
                    <IoSearchOutline className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search files and folders..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onKeyDown={handleSearchKeyDown}
                        onFocus={() => searchQuery.trim().length > 0 && setShowSearchResults(true)}
                        className={styles.searchInput}
                    />
                    {showSearchResults && searchResults.length > 0 && (
                        <div className={styles.searchResults}>
                            {searchResults.map((result) => (
                                <div
                                    key={result.file_id}
                                    className={styles.searchResultItem}
                                    onClick={() => handleResultClick(result.file_id)}
                                >
                                    {result.mime_type?.startsWith('application/vnd.google-apps.folder') || result.original_name.endsWith('/') ? (
                                        <IoFolderOutline className={styles.searchResultIcon} />
                                    ) : (
                                        <IoDocumentTextOutline className={styles.searchResultIcon} />
                                    )}
                                    <span className={styles.searchResultName}>{result.original_name}</span>
                                </div>
                            ))}
                            {searchQuery.trim().length > 0 && (
                                <div
                                    className={styles.searchResultViewAll}
                                    onClick={() => {
                                        navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
                                        setShowSearchResults(false)
                                    }}
                                >
                                    View all results for "{searchQuery}"
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.headerRight}>
                <div className={styles.profileContainer}>
                    <button
                        className={styles.profileButton}
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        <IoPersonCircleOutline size={28} />
                        {user && <span className={styles.username}>{user.username}</span>}
                    </button>
                    
                    {showProfileMenu && (
                        <div className={styles.profileMenu}>
                            <div className={styles.profileInfo}>
                                {user && (
                                    <>
                                        <div className={styles.profileName}>{user.username}</div>
                                        <div className={styles.profileEmail}>{user.email}</div>
                                    </>
                                )}
                            </div>
                            <div className={styles.profileMenuDivider}></div>
                            <button className={styles.profileMenuItem}>
                                <IoSettingsOutline size={18} />
                                Settings
                            </button>
                            <button className={styles.profileMenuItem} onClick={handleLogout}>
                                <IoLogOutOutline size={18} />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

export default DashboardHeader

