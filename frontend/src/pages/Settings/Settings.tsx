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
    IoCheckmarkCircle,
    IoCameraOutline
} from 'react-icons/io5'
import DashboardHeader from '../../components/DashboardHeader/DashboardHeader'
import Input from '../../components/Input/Input'
import { useTheme, type ThemeMode, type ColorScheme } from '../../contexts/ThemeContext'
import { colorSchemes } from '../../contexts/colorSchemes'
import { 
    apiGetCurrentUser, 
    apiChangePassword, 
    apiUpdateUsername, 
    apiDeleteAccount,
    apiUploadProfilePicture,
    apiUpdateEmail,
    apiUpdateStorageLimit
} from '../../utils/api'
import type { AuthUser } from '../../utils/api'
import styles from './Settings.module.css'

type SettingsCategory = 'appearance' | 'account' | 'security' | 'search' | 'danger'

const Settings = function () {
    const navigate = useNavigate()
    const { theme, colorScheme, setTheme, setColorScheme } = useTheme()
    const [user, setUser] = useState<AuthUser | null>(null)
    const [activeCategory, setActiveCategory] = useState<SettingsCategory>('appearance')

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

    // Email change
    const [newEmail, setNewEmail] = useState('')
    const [emailErrors, setEmailErrors] = useState<{ email?: string }>({})
    const [emailLoading, setEmailLoading] = useState(false)
    const [emailSuccess, setEmailSuccess] = useState(false)

    // Storage limit
    const [storageLimitGB, setStorageLimitGB] = useState(4)
    const [storageLimitLoading, setStorageLimitLoading] = useState(false)
    const [storageLimitSuccess, setStorageLimitSuccess] = useState(false)
    const [storageLimitError, setStorageLimitError] = useState<string | null>(null)

    // Delete account
    const [deleteConfirm, setDeleteConfirm] = useState('')
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    // Profile picture
    const [profilePictureLoading, setProfilePictureLoading] = useState(false)
    const [profilePictureError, setProfilePictureError] = useState<string | null>(null)
    const [profilePictureSuccess, setProfilePictureSuccess] = useState(false)

    useEffect(() => {
        const loadUser = async () => {
            const response = await apiGetCurrentUser()
            if (response.success && response.user) {
                setUser(response.user)
                setNewUsername(response.user.username)
                setNewEmail(response.user.email)
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
        } catch {
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
        } catch {
            setNameErrors({ username: 'An error occurred. Please try again.' })
        } finally {
            setNameLoading(false)
        }
    }

    const handleEmailChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setEmailErrors({})
        setEmailSuccess(false)

        if (!newEmail.trim()) {
            setEmailErrors({ email: 'Email is required' })
            return
        }
        if (!/\S+@\S+\.\S+/.test(newEmail.trim())) {
            setEmailErrors({ email: 'Please enter a valid email' })
            return
        }
        if (newEmail.trim() === user?.email) {
            setEmailErrors({ email: 'Please enter a different email' })
            return
        }

        setEmailLoading(true)
        try {
            const response = await apiUpdateEmail(newEmail.trim())
            if (response.success && response.user) {
                setUser(response.user)
                setEmailSuccess(true)
                setTimeout(() => setEmailSuccess(false), 3000)
            } else {
                setEmailErrors({ email: response.message || 'Failed to update email' })
            }
        } catch {
            setEmailErrors({ email: 'An error occurred. Please try again.' })
        } finally {
            setEmailLoading(false)
        }
    }

    const handleStorageLimitChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setStorageLimitError(null)
        setStorageLimitSuccess(false)

        if (storageLimitGB < 4 || storageLimitGB > 20) {
            setStorageLimitError('Storage limit must be between 4GB and 20GB')
            return
        }

        setStorageLimitLoading(true)
        try {
            const response = await apiUpdateStorageLimit(storageLimitGB)
            if (response.success) {
                setStorageLimitSuccess(true)
                setTimeout(() => setStorageLimitSuccess(false), 3000)
            } else {
                setStorageLimitError(response.message || 'Failed to update storage limit')
            }
        } catch {
            setStorageLimitError('An error occurred. Please try again.')
        } finally {
            setStorageLimitLoading(false)
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
        } catch {
            alert('An error occurred. Please try again.')
        } finally {
            setDeleteLoading(false)
        }
    }

    const handleClearSearchHistory = () => {
        localStorage.removeItem('searchHistory')
        alert('Search history cleared')
    }

    const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setProfilePictureError('File must be an image')
            return
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setProfilePictureError('Image must be less than 5MB')
            return
        }

        setProfilePictureError(null)
        setProfilePictureLoading(true)
        setProfilePictureSuccess(false)

        try {
            const response = await apiUploadProfilePicture(file)
            if (response.success && response.user) {
                setUser(response.user)
                setProfilePictureSuccess(true)
                setTimeout(() => setProfilePictureSuccess(false), 3000)
            } else {
                setProfilePictureError(response.message || 'Failed to upload profile picture')
            }
        } catch {
            setProfilePictureError('An error occurred. Please try again.')
        } finally {
            setProfilePictureLoading(false)
            // Reset input
            if (e.target) {
                e.target.value = ''
            }
        }
    }

    const handleProfilePictureClick = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = (e) => {
            const event = e as unknown as React.ChangeEvent<HTMLInputElement>
            handleProfilePictureChange(event)
        }
        input.click()
    }

    const categories = [
        { id: 'appearance' as SettingsCategory, label: 'Appearance', icon: IoColorPaletteOutline },
        { id: 'account' as SettingsCategory, label: 'Account', icon: IoPersonOutline },
        { id: 'security' as SettingsCategory, label: 'Security', icon: IoLockClosedOutline },
        { id: 'search' as SettingsCategory, label: 'Search', icon: IoSearchOutline },
        { id: 'danger' as SettingsCategory, label: 'Danger Zone', icon: IoTrashOutline },
    ]

    return (
        <div className={styles.settingsPage}>
            <DashboardHeader />
            <div className={styles.container}>
                <div className={styles.header}>
                    <button className={styles.backButton} onClick={() => navigate('/home')}>
                        <IoArrowBack size={20} />
                    </button>
                    <h1 className={styles.title}>Settings</h1>
                </div>

                <div className={styles.content}>
                    {/* Left Sidebar */}
                    <div className={styles.sidebar}>
                        <nav className={styles.categoryNav}>
                            {categories.map((category) => {
                                const Icon = category.icon
                                return (
                                    <button
                                        key={category.id}
                                        className={`${styles.categoryItem} ${activeCategory === category.id ? styles.active : ''}`}
                                        onClick={() => setActiveCategory(category.id)}
                                    >
                                        <Icon size={20} />
                                        <span>{category.label}</span>
                                    </button>
                                )
                            })}
                        </nav>
                    </div>

                    {/* Right Content */}
                    <div className={styles.mainContent}>
                        {/* Appearance */}
                        {activeCategory === 'appearance' && (
                            <div className={styles.categoryContent}>
                                <h2 className={styles.categoryTitle}>Appearance</h2>
                                
                                {/* Theme Selection */}
                                <div className={styles.settingGroup}>
                                    <label className={styles.settingLabel}>
                                        <IoMoonOutline size={20} />
                                        <span>Theme</span>
                                    </label>
                                    <p className={styles.settingDescription}>
                                        Choose your preferred theme mode
                                    </p>
                                    <div className={styles.themeOptions}>
                                        {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
                                            <button
                                                key={mode}
                                                className={`${styles.themeOption} ${theme === mode ? styles.active : ''}`}
                                                onClick={() => {
                                                    setTheme(mode)
                                                    localStorage.setItem('theme', mode)
                                                }}
                                            >
                                                <span className={styles.themeOptionName}>
                                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                                </span>
                                                {theme === mode && <IoCheckmarkCircle size={18} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Color Scheme Selection */}
                                <div className={styles.settingGroup}>
                                    <label className={styles.settingLabel}>
                                        <IoColorPaletteOutline size={20} />
                                        <span>Color Scheme - Material You</span>
                                    </label>
                                    <p className={styles.settingDescription}>
                                        Choose a dynamic color palette inspired by Material Design 3
                                    </p>
                                    <div className={styles.colorSchemeGrid}>
                                        {Object.entries(colorSchemes).map(([key, scheme]) => (
                                            <div 
                                                key={key} 
                                                className={`${styles.colorSchemeCard} ${colorScheme === key ? styles.activeCard : ''}`}
                                            >
                                                <button
                                                    className={`${styles.colorSchemeOption} ${colorScheme === key ? styles.active : ''}`}
                                                    onClick={() => {
                                                        setColorScheme(key as ColorScheme)
                                                        localStorage.setItem('colorScheme', key)
                                                    }}
                                                    title={scheme.description}
                                                >
                                                    <div className={styles.colorPreview}>
                                                        <div 
                                                            className={styles.colorSwatch} 
                                                            style={{ backgroundColor: scheme.primary }}
                                                            title="Primary"
                                                        />
                                                        <div 
                                                            className={styles.colorSwatch} 
                                                            style={{ backgroundColor: scheme.secondary }}
                                                            title="Secondary"
                                                        />
                                                        <div 
                                                            className={styles.colorSwatch} 
                                                            style={{ backgroundColor: scheme.accent }}
                                                            title="Accent"
                                                        />
                                                    </div>
                                                    {colorScheme === key && (
                                                        <div className={styles.selectedBadge}>
                                                            <IoCheckmarkCircle size={18} />
                                                        </div>
                                                    )}
                                                </button>
                                                <div className={styles.colorSchemeInfo}>
                                                    <span className={styles.colorSchemeName}>
                                                        {scheme.name}
                                                    </span>
                                                    <span className={styles.colorSchemeDescription}>
                                                        {scheme.description}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Account */}
                        {activeCategory === 'account' && (
                            <div className={styles.categoryContent}>
                                <h2 className={styles.categoryTitle}>Account</h2>
                                
                                <div className={styles.settingGroup}>
                                    <label className={styles.settingLabel}>Profile Picture</label>
                                    <p className={styles.settingDescription}>
                                        Upload a profile picture to personalize your account
                                    </p>
                                    <div className={styles.profilePictureSection}>
                                        <div className={styles.profilePictureContainer}>
                                            {user?.profile_picture_url ? (
                                                <img 
                                                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${user.profile_picture_url}`}
                                                    alt="Profile"
                                                    className={styles.profilePicture}
                                                />
                                            ) : (
                                                <div className={styles.profilePicturePlaceholder}>
                                                    <IoPersonOutline size={48} />
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                className={styles.profilePictureButton}
                                                onClick={handleProfilePictureClick}
                                                disabled={profilePictureLoading}
                                            >
                                                <IoCameraOutline size={20} />
                                                {profilePictureLoading ? 'Uploading...' : user?.profile_picture_url ? 'Change Picture' : 'Upload Picture'}
                                            </button>
                                        </div>
                                        {profilePictureError && (
                                            <p className={styles.errorMessage}>{profilePictureError}</p>
                                        )}
                                        {profilePictureSuccess && (
                                            <p className={styles.successMessage}>Profile picture updated successfully!</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className={styles.settingGroup}>
                                    <label className={styles.settingLabel}>Change Username</label>
                                    <p className={styles.settingDescription}>
                                        Update your display name
                                    </p>
                                    <form onSubmit={handleNameChange} className={styles.form}>
                                        <Input
                                            label="New Username"
                                            type="text"
                                            placeholder="Enter new username"
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                            error={nameErrors.username}
                                            variant={undefined}
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

                                <div className={styles.settingGroup}>
                                    <label className={styles.settingLabel}>Change Email</label>
                                    <p className={styles.settingDescription}>
                                        Update your email address
                                    </p>
                                    <form onSubmit={handleEmailChange} className={styles.form}>
                                        <Input
                                            label="New Email"
                                            type="email"
                                            placeholder="Enter new email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            error={emailErrors.email}
                                            variant={undefined}
                                        />
                                        <button 
                                            type="submit" 
                                            className={styles.submitButton}
                                            disabled={emailLoading}
                                        >
                                            {emailLoading ? 'Updating...' : 'Update Email'}
                                        </button>
                                        {emailSuccess && (
                                            <p className={styles.successMessage}>Email updated successfully!</p>
                                        )}
                                    </form>
                                </div>

                                <div className={styles.settingGroup}>
                                    <label className={styles.settingLabel}>Storage Limit</label>
                                    <p className={styles.settingDescription}>
                                        Set your storage limit (4GB - 20GB)
                                    </p>
                                    <form onSubmit={handleStorageLimitChange} className={styles.form}>
                                        <div className={styles.storageLimitInput}>
                                            <input
                                                type="range"
                                                min="4"
                                                max="20"
                                                value={storageLimitGB}
                                                onChange={(e) => setStorageLimitGB(parseInt(e.target.value))}
                                                className={styles.rangeInput}
                                            />
                                            <div className={styles.storageLimitValue}>
                                                <span>{storageLimitGB} GB</span>
                                            </div>
                                        </div>
                                        <button 
                                            type="submit" 
                                            className={styles.submitButton}
                                            disabled={storageLimitLoading}
                                        >
                                            {storageLimitLoading ? 'Updating...' : 'Update Storage Limit'}
                                        </button>
                                        {storageLimitError && (
                                            <p className={styles.errorMessage}>{storageLimitError}</p>
                                        )}
                                        {storageLimitSuccess && (
                                            <p className={styles.successMessage}>Storage limit updated successfully!</p>
                                        )}
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Security */}
                        {activeCategory === 'security' && (
                            <div className={styles.categoryContent}>
                                <h2 className={styles.categoryTitle}>Security</h2>
                                
                                <div className={styles.settingGroup}>
                                    <label className={styles.settingLabel}>Change Password</label>
                                    <p className={styles.settingDescription}>
                                        Update your password to keep your account secure
                                    </p>
                                    <form onSubmit={handlePasswordChange} className={styles.form}>
                                        <Input
                                            label="Current Password"
                                            type="password"
                                            placeholder="Enter current password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            error={passwordErrors.currentPassword}
                                            variant={undefined}
                                        />
                                        <Input
                                            label="New Password"
                                            type="password"
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            error={passwordErrors.newPassword}
                                            variant={undefined}
                                        />
                                        <Input
                                            label="Confirm New Password"
                                            type="password"
                                            placeholder="Confirm new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            error={passwordErrors.confirmPassword}
                                            variant={undefined}
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

                        {/* Search */}
                        {activeCategory === 'search' && (
                            <div className={styles.categoryContent}>
                                <h2 className={styles.categoryTitle}>Search</h2>
                                
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

                        {/* Danger Zone */}
                        {activeCategory === 'danger' && (
                            <div className={styles.categoryContent}>
                                <h2 className={styles.categoryTitle}>Danger Zone</h2>
                                
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
                                                label="Confirm deletion"
                                                type="text"
                                                placeholder="Type DELETE to confirm"
                                                value={deleteConfirm}
                                                onChange={(e) => setDeleteConfirm(e.target.value)}
                                                variant={undefined}
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
