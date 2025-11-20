import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaGoogle } from 'react-icons/fa'
import { FaGithub } from 'react-icons/fa'
import { IoEye, IoEyeOff } from 'react-icons/io5'
import Input from '../../components/Input/Input'
import AuthLayout from '../../components/AuthLayout/AuthLayout'
import { apiLogin } from '../../utils/api'
import { showUnderDevelopmentDialog } from '../../utils/dialog'
import styles from './Login.module.css'

const Login = function () {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
    const [loading, setLoading] = useState(false)

    const validateForm = () => {
        const newErrors: typeof errors = {}

        if (!email.trim()) {
            newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email'
        }

        if (!password) {
            newErrors.password = 'Password is required'
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!validateForm()) return

        setLoading(true)
        try {
            const response = await apiLogin(email, password)

            if (response.success) {
                // Force a full page reload to ensure all components re-check auth state
                window.location.href = '/home'
            } else {
                setErrors({ email: response.message || 'Login failed' })
                setLoading(false)
            }
        } catch (error) {
            console.error(error)
            setErrors({ email: 'Login failed. Please try again.' })
            setLoading(false)
        }
    }

    const handleGoogleLogin = () => {
        showUnderDevelopmentDialog('Google login')
    }

    const handleGithubLogin = () => {
        showUnderDevelopmentDialog('GitHub login')
    }

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Already have an account? Log in"
        >
            <form onSubmit={handleSubmit} className={styles.form}>
                <Input
                    label="Email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    variant="dark"
                />
                <div className={styles.passwordWrapper}>
                    <Input
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={errors.password}
                        variant="dark"
                    />
                    <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <IoEyeOff /> : <IoEye />}
                    </button>
                </div>

                <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Logging in...' : 'Log In'}
                </button>
            </form>

            <div className={styles.separator}>
                <span>Or register with</span>
            </div>

            <div className={styles.socialButtons}>
                <button
                    type="button"
                    className={styles.socialButton}
                    onClick={handleGoogleLogin}
                >
                    <FaGoogle className={styles.socialIcon} />
                    <span>Google</span>
                </button>
                <button
                    type="button"
                    className={styles.socialButton}
                    onClick={handleGithubLogin}
                >
                    <FaGithub className={styles.socialIcon} />
                    <span>GitHub</span>
                </button>
            </div>
        </AuthLayout>
    )
}

export default Login
