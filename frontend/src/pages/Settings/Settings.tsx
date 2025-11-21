import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
    IoArrowBack, 
    IoColorPaletteOutline, 
    IoMoonOutline, 
    IoLockClosedOutline, 
    IoPersonOutline, 
    IoTrashOutline,
    IoSearchOutline,
    IoCheckmarkCircle
} from 'react-icons/io5'
import DashboardHeader from '../../components/DashboardHeader/DashboardHeader'
import Input from '../../components/Input/Input'
import { useTheme, colorSchemes, type ThemeMode, type ColorScheme } from '../../contexts/ThemeContext'
import { 
    apiGetCurrentUser, 
    apiChangePassword, 
    apiUpdateUsername, 
    apiDeleteAccount 
} from '../../utils/api'
import type { AuthUser } from '../../utils/api'
import styles from './Settings.module.css'

const Settings = function () {
    const navigate = useNavigate()
    const { theme, colorScheme, setTheme, setColorScheme } = useTheme()
    const [user, setUser] = useState<AuthUser | null>(null)
    const [activeSection, setActiveSection] = useState<string | null>(null)

    // Password change
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({})
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [passwordSuccess, setPasswordSuccess] = useState(false)

    // Name change
    const [newUsername, setNewUsername] = useState('')
    const [nameErrors, setNameErrors] = useState<{ username?: string }>({})
    const [nameLoading, setNameLoading] = useState(false)
    const [nameSuccess, setNameSuccess] = useState(false)

    // Delete account
    const [deleteConfirm, setDeleteConfirm] = useState('')
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    useEffect(() => {
        const loadUser = async () => {
            const response = await apiGetCurrentUser()
            if (response.success && response.user) {
                setUser(response.user)
                setNewUsername(response.user.username)
            }
        }
        loadUser()
    }, [])

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setPasswordErrors({})
        setPasswordSuccess(false)

        // Validation
        if (!currentPassword) {
            setPasswordErrors({ currentPassword: 'Current password is required' })
            return
        }
        if (!newPassword) {
            setPasswordErrors({ newPassword: 'New password is required' })
            return
        }
        if (newPassword.length < 8) {
            setPasswordErrors({ newPassword: 'Password must be at least 8 characters' })
            return
        }
        if (newPassword !== confirmPassword) {
            setPasswordErrors({ confirmPassword: 'Passwords do not match' })
            return
        }

        setPasswordLoading(true)
        try {
            const response = await apiChangePassword(currentPassword, newPassword)
            if (response.success) {
                setPasswordSuccess(true)
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
                setTimeout(() => setPasswordSuccess(false), 3000)
            } else {
                setPasswordErrors({ currentPassword: response.message || 'Failed to change password' })
            }
        } catch (error) {
            setPasswordErrors({ currentPassword: 'An error occurred. Please try again.' })
        } finally {
            setPasswordLoading(false)
        }
    }

    const handleNameChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setNameErrors({})
        setNameSuccess(false)

        if (!newUsername.trim()) {
            setNameErrors({ username: 'Username is required' })
            return
        }
        if (newUsername.trim() === user?.username) {
            setNameErrors({ username: 'Please enter a different username' })
            return
        }

        setNameLoading(true)
        try {
            const response = await apiUpdateUsername(newUsername.trim())
            if (response.success && response.user) {
                setUser(response.user)
                setNameSuccess(true)
                setTimeout(() => setNameSuccess(false), 3000)
            } else {
                setNameErrors({ username: response.message || 'Failed to update username' })
            }
        } catch (error) {
            setNameErrors({ username: 'An error occurred. Please try again.' })
        } finally {
            setNameLoading(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (deleteConfirm !== 'DELETE') {
            return
        }

        setDeleteLoading(true)
        try {
            const response = await apiDeleteAccount()
            if (response.success) {
                navigate('/')
                window.location.reload()
            } else {
                alert(response.message || 'Failed to delete account')
            }
        } catch (error) {
            alert('An error occurred. Please try again.')
        } finally {
            setDeleteLoading(false)
        }
    }

    const handleClearSearchHistory = () => {
        localStorage.removeItem('searchHistory')
        alert('Search history cleared')
    }

    return (
        <div className={styles.settingsPage}>
            <DashboardHeader />
            <div className={styles.container}>
                <div className={styles.header}>
                    <button className={styles.backButton} onClick={() => navigate('/home')}>
                        <IoArrowBack size={20} />
                        <span>Back</span>
                    </button>
                    <h1 className={styles.title}>Settings</h1>
                </div>

                <div className={styles.content}>
                    {/* Appearance Section */}
                    <div className={styles.section}>
                        <div 
                            className={styles.sectionHeader}
                            onClick={() => setActiveSection(activeSection === 'appearance' ? null : 'appearance')}
                        >
                            <div className={styles.sectionTitle}>
                                <IoColorPaletteOutline size={24} />
                                <span>Appearance</span>
                            </div>
                            <span className={styles.sectionToggle}>
                                {activeSection === 'appearance' ? '−' : '+'}
                            </span>
                        </div>
                        {activeSection === 'appearance' && (
                            <div className={styles.sectionContent}>
                                {/* Theme Selection */}
                                <div className={styles.settingGroup}>
                                    <label className={styles.settingLabel}>
                                        <IoMoonOutline size={20} />
                                        <span>Theme</span>
                                    </label>
                                    <div className={styles.themeOptions}>
                                        {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
                                            <button
                                                key={mode}
                                                className={`${styles.themeOption} ${theme === mode ? styles.active : ''}`}
                                                onClick={() => setTheme(mode)}
                                            >
                                                <span className={styles.themeOptionName}>
                                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                                </span>
                                                {theme === mode && <IoCheckmarkCircle size={20} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Color Scheme Selection */}
                                <div className={styles.settingGroup}>
                                    <label className={styles.settingLabel}>
                                        <IoColorPaletteOutline size={20} />
                                        <span>Color Scheme</span>
                                    </label>
                                    <div className={styles.colorSchemeGrid}>
                                        {Object.entries(colorSchemes).map(([key, scheme]) => (
                                            <button
                                                key={key}
                                                className={`${styles.colorSchemeOption} ${colorScheme === key ? styles.active : ''}`}
                                                onClick={() => setColorScheme(key as ColorScheme)}
                                                style={{
                                                    background: `linear-gradient(135deg, ${scheme.primary}, ${scheme.secondary})`
                                                }}
                                                title={scheme.name}
                                            >
                                                {colorScheme === key && <IoCheckmarkCircle size={20} />}
                                            </button>
                                        ))}
                                    </div>
                                    <p className={styles.colorSchemeName}>
                                        {colorSchemes[colorScheme].name}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Account Section */}
                    <div className={styles.section}>
                        <div 
                            className={styles.sectionHeader}
                            onClick={() => setActiveSection(activeSection === 'account' ? null : 'account')}
                        >
                            <div className={styles.sectionTitle}>
                                <IoPersonOutline size={24} />
                                <span>Account</span>
                            </div>
                            <span className={styles.sectionToggle}>
                                {activeSection === 'account' ? '−' : '+'}
                            </span>
                        </div>
                        {activeSection === 'account' && (
                            <div className={styles.sectionContent}>
                                {/* Name Change */}
                                <div className={styles.settingGroup}>
                                    <label className={styles.settingLabel}>Change Username</label>
                                    <form onSubmit={handleNameChange} className={styles.form}>
                                        <Input
                                            label="New Username"
                                            type="text"
                                            placeholder="Enter new username"
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                            error={nameErrors.username}
                                            variant={theme === 'dark' ? 'dark' : undefined}
                                        />
                                        <button 
                                            type="submit" 
                                            className={styles.submitButton}
                                            disabled={nameLoading}
                                        >
                                            {nameLoading ? 'Updating...' : 'Update Username'}
                                        </button>
                                        {nameSuccess && (
                                            <p className={styles.successMessage}>Username updated successfully!</p>
                                        )}
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Security Section */}
                    <div className={styles.section}>
                        <div 
                            className={styles.sectionHeader}
                            onClick={() => setActiveSection(activeSection === 'security' ? null : 'security')}
                        >
                            <div className={styles.sectionTitle}>
                                <IoLockClosedOutline size={24} />
                                <span>Security</span>
                            </div>
                            <span className={styles.sectionToggle}>
                                {activeSection === 'security' ? '−' : '+'}
                            </span>
                        </div>
                        {activeSection === 'security' && (
                            <div className={styles.sectionContent}>
                                {/* Password Change */}
                                <div className={styles.settingGroup}>
                                    <label className={styles.settingLabel}>Change Password</label>
                                    <form onSubmit={handlePasswordChange} className={styles.form}>
                                        <Input
                                            label="Current Password"
                                            type="password"
                                            placeholder="Enter current password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            error={passwordErrors.currentPassword}
                                            variant={theme === 'dark' ? 'dark' : undefined}
                                        />
                                        <Input
                                            label="New Password"
                                            type="password"
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            error={passwordErrors.newPassword}
                                            variant={theme === 'dark' ? 'dark' : undefined}
                                        />
                                        <Input
                                            label="Confirm New Password"
                                            type="password"
                                            placeholder="Confirm new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            error={passwordErrors.confirmPassword}
                                            variant={theme === 'dark' ? 'dark' : undefined}
                                        />
                                        <button 
                                            type="submit" 
                                            className={styles.submitButton}
                                            disabled={passwordLoading}
                                        >
                                            {passwordLoading ? 'Changing...' : 'Change Password'}
                                        </button>
                                        {passwordSuccess && (
                                            <p className={styles.successMessage}>Password changed successfully!</p>
                                        )}
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Search Section */}
                    <div className={styles.section}>
                        <div 
                            className={styles.sectionHeader}
                            onClick={() => setActiveSection(activeSection === 'search' ? null : 'search')}
                        >
                            <div className={styles.sectionTitle}>
                                <IoSearchOutline size={24} />
                                <span>Search</span>
                            </div>
                            <span className={styles.sectionToggle}>
                                {activeSection === 'search' ? '−' : '+'}
                            </span>
                        </div>
                        {activeSection === 'search' && (
                            <div className={styles.sectionContent}>
                                <div className={styles.settingGroup}>
                                    <label className={styles.settingLabel}>Search History</label>
                                    <p className={styles.settingDescription}>
                                        Clear your search history to remove all saved search queries.
                                    </p>
                                    <button 
                                        className={styles.dangerButton}
                                        onClick={handleClearSearchHistory}
                                    >
                                        <IoTrashOutline size={18} />
                                        Clear Search History
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Danger Zone */}
                    <div className={styles.section}>
                        <div 
                            className={styles.sectionHeader}
                            onClick={() => setActiveSection(activeSection === 'danger' ? null : 'danger')}
                        >
                            <div className={styles.sectionTitle}>
                                <IoTrashOutline size={24} />
                                <span>Danger Zone</span>
                            </div>
                            <span className={styles.sectionToggle}>
                                {activeSection === 'danger' ? '−' : '+'}
                            </span>
                        </div>
                        {activeSection === 'danger' && (
                            <div className={styles.sectionContent}>
                                <div className={styles.settingGroup}>
                                    <label className={styles.settingLabel}>Delete Account</label>
                                    <p className={styles.settingDescription}>
                                        Permanently delete your account and all associated files. This action cannot be undone.
                                    </p>
                                    {!showDeleteConfirm ? (
                                        <button 
                                            className={styles.dangerButton}
                                            onClick={() => setShowDeleteConfirm(true)}
                                        >
                                            <IoTrashOutline size={18} />
                                            Delete Account
                                        </button>
                                    ) : (
                                        <div className={styles.deleteConfirm}>
                                            <p className={styles.deleteWarning}>
                                                Type <strong>DELETE</strong> to confirm account deletion
                                            </p>
                                            <Input
                                                type="text"
                                                placeholder="Type DELETE to confirm"
                                                value={deleteConfirm}
                                                onChange={(e) => setDeleteConfirm(e.target.value)}
                                                variant={theme === 'dark' ? 'dark' : undefined}
                                            />
                                            <div className={styles.deleteActions}>
                                                <button 
                                                    className={styles.cancelButton}
                                                    onClick={() => {
                                                        setShowDeleteConfirm(false)
                                                        setDeleteConfirm('')
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    className={styles.dangerButton}
                                                    onClick={handleDeleteAccount}
                                                    disabled={deleteConfirm !== 'DELETE' || deleteLoading}
                                                >
                                                    {deleteLoading ? 'Deleting...' : 'Delete Account'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Settings

