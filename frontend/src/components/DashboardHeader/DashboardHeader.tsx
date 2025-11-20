import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoSearchOutline, IoPersonCircleOutline, IoLogOutOutline, IoSettingsOutline } from 'react-icons/io5'
import { apiGetCurrentUser, apiLogout, AuthUser } from '../../utils/api'
import styles from './DashboardHeader.module.css'

const DashboardHeader = function () {
    const navigate = useNavigate()
    const [user, setUser] = useState<AuthUser | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [showProfileMenu, setShowProfileMenu] = useState(false)

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
                <div className={styles.searchContainer}>
                    <IoSearchOutline className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search files and folders..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
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

