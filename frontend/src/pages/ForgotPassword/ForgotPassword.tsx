import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Input from '../../components/Input/Input'
import AuthLayout from '../../components/AuthLayout/AuthLayout'
import { apiForgotPassword } from '../../utils/api'
import styles from './ForgotPassword.module.css'

const ForgotPassword = function () {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [errors, setErrors] = useState<{ email?: string }>({})
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const validateForm = () => {
        const newErrors: typeof errors = {}

        if (!email.trim()) {
            newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!validateForm()) return

        setLoading(true)
        try {
            const response = await apiForgotPassword(email)

            if (response.success) {
                setSubmitted(true)
            } else {
                setErrors({ email: response.message || 'Failed to send reset email' })
            }
        } catch (error) {
            console.error(error)
            setErrors({ email: 'Failed to send reset email. Please try again.' })
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <AuthLayout
                title="Check Your Email"
                subtitle="Password reset link sent"
            >
                <div className={styles.successMessage}>
                    <p>
                        We've sent a password reset link to <strong>{email}</strong>
                    </p>
                    <p>
                        Check your email and follow the link to reset your password. If you don't see
                        the email, check your spam folder.
                    </p>
                </div>

                <button
                    onClick={() => navigate('/login')}
                    className={styles.submitButton}
                >
                    Back to Login
                </button>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout
            title="Reset Password"
            subtitle="Enter your email to receive a password reset link"
        >
            <form onSubmit={handleSubmit} className={styles.form}>
                <Input
                    label="Email Address"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    variant="dark"
                />

                <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
            </form>

            <div className={styles.links}>
                <Link to="/login" className={styles.link}>
                    Back to Login
                </Link>
                <span className={styles.divider}>•</span>
                <Link to="/signup" className={styles.link}>
                    Create Account
                </Link>
            </div>
        </AuthLayout>
    )
}

export default ForgotPassword
