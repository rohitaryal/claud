import { useState, useEffect } from 'react'
import { 
    IoAddOutline, 
    IoFolderOutline, 
    IoShareSocialOutline, 
    IoTimeOutline, 
    IoStarOutline, 
    IoTrashOutline 
} from 'react-icons/io5'
import { apiGetCurrentUser, getUserStorageUsage } from '../../utils/api'
import styles from './Sidebar.module.css'

interface SidebarProps {
    activeSection: string
    onSectionChange: (section: string) => void
    onNewClick: () => void
}

const Sidebar = function ({ activeSection, onSectionChange, onNewClick }: SidebarProps) {
    const [storageUsed, setStorageUsed] = useState(0)
    const [storageLimit, setStorageLimit] = useState(5 * 1024 * 1024 * 1024) // 5GB in bytes

    useEffect(() => {
        // Load storage usage
        const loadStorage = async () => {
            try {
                const response = await getUserStorageUsage()
                if (response.success && response.storage) {
                    setStorageUsed(response.storage.used)
                    setStorageLimit(response.storage.max)
                }
            } catch (error) {
                console.error('Failed to load storage:', error)
            }
        }
        loadStorage()
    }, [])

    const storagePercent = storageLimit > 0 ? Math.round((storageUsed / storageLimit) * 100) : 0
    const storageUsedMB = (storageUsed / 1024 / 1024).toFixed(0)
    const storageLimitGB = (storageLimit / 1024 / 1024 / 1024).toFixed(0)

    const sections = [
        { id: 'my-files', label: 'My Files', icon: IoFolderOutline },
        { id: 'shared', label: 'Shared With Me', icon: IoShareSocialOutline },
        { id: 'recent', label: 'Recent', icon: IoTimeOutline },
        { id: 'starred', label: 'Starred', icon: IoStarOutline },
        { id: 'trash', label: 'Trash', icon: IoTrashOutline },
    ]

    return (
        <aside className={styles.sidebar}>
            <button className={styles.newButton} onClick={onNewClick}>
                <IoAddOutline size={20} />
                <span>New</span>
            </button>

            <nav className={styles.nav}>
                {sections.map((section) => {
                    const Icon = section.icon
                    return (
                        <button
                            key={section.id}
                            className={`${styles.navItem} ${activeSection === section.id ? styles.navItemActive : ''}`}
                            onClick={() => onSectionChange(section.id)}
                        >
                            <Icon size={20} />
                            <span>{section.label}</span>
                        </button>
                    )
                })}
            </nav>

            <div className={styles.storageSection}>
                <div className={styles.storageHeader}>
                    <span className={styles.storageLabel}>Storage</span>
                    <span className={styles.storagePercent}>{storagePercent}%</span>
                </div>
                <div className={styles.storageBar}>
                    <div
                        className={styles.storageProgress}
                        style={{
                            width: `${Math.min(storagePercent, 100)}%`,
                            background: storagePercent > 90 ? '#ef4444' : 'var(--blue-gradient)'
                        }}
                    />
                </div>
                <div className={styles.storageInfo}>
                    {storageUsedMB} MB of {storageLimitGB} GB used
                </div>
            </div>
        </aside>
    )
}

export default Sidebar

