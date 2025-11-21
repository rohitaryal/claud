import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FaGoogle } from 'react-icons/fa'
import { FaGithub } from 'react-icons/fa'
import { IoEye, IoEyeOff } from 'react-icons/io5'
import Input from '../../components/Input/Input'
import AuthLayout from '../../components/AuthLayout/AuthLayout'
import { apiRegister } from '../../utils/api'
import { showUnderDevelopmentDialog } from '../../utils/dialog'
import styles from './Signup.module.css'

interface SignupErrors {
    firstName?: string
    lastName?: string
    username?: string
    email?: string
    password?: string
    confirmPassword?: string
}

const Signup = function () {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [errors, setErrors] = useState<SignupErrors>({})
    const [loading, setLoading] = useState(false)
    const [termsAccepted, setTermsAccepted] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }))
        // Clear error for this field
        setErrors((prev) => ({
            ...prev,
            [name]: undefined
        }))
    }

    const handleGoogleLogin = () => {
        showUnderDevelopmentDialog('Google signup')
    }

    const handleGithubLogin = () => {
        showUnderDevelopmentDialog('GitHub signup')
    }

    const validateForm = () => {
        const newErrors: SignupErrors = {}

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required'
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required'
        }

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required'
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters'
        } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
            newErrors.username = 'Username can only contain letters, numbers, underscores and hyphens'
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email'
        }

        if (!formData.password) {
            newErrors.password = 'Password is required'
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters'
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password'
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }

        setErrors(newErrors)
        
        if (!termsAccepted) {
            // Show alert if terms not accepted
            alert('You must agree to the Terms & Conditions to create an account')
            return false
        }

        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!validateForm()) return

        setLoading(true)
        try {
            const response = await apiRegister(formData.username, formData.email, formData.password)

            if (response.success) {
                navigate('/home')
            } else {
                setErrors({ email: response.message })
            }
        } catch (error) {
            console.error(error)
            setErrors({ email: 'Signup failed. Please try again.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout
            title="Create an account"
            subtitle="Already have an account? Log in"
        >
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputWrapper}>
                    <Input
                        label="First name"
                        type="text"
                        name="firstName"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={handleChange}
                        error={errors.firstName}
                        variant="dark"
                    />
                    <Input
                        label="Last name"
                        type="text"
                        name="lastName"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={handleChange}
                        error={errors.lastName}
                        variant="dark"
                    />
                </div>
                <Input
                    label="Username"
                    type="text"
                    name="username"
                    placeholder="choose_username"
                    value={formData.username}
                    onChange={handleChange}
                    error={errors.username}
                    variant="dark"
                />
                <Input
                    label="Email"
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    variant="dark"
                />
                <div className={styles.passwordWrapper}>
                    <Input
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
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

                <div className={styles.checkboxWrapper}>
                    <input
                        type="checkbox"
                        id="terms"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className={styles.checkbox}
                    />
                    <label htmlFor="terms" className={styles.checkboxLabel}>
                        I agree to the{' '}
                        <Link to="/terms" className={styles.link}>
                            Terms & Conditions
                        </Link>
                    </label>
                </div>

                <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Creating account...' : 'Create account'}
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

export default Signup
