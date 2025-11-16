import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Input from '../../components/Input/Input'
import FormCard from '../../components/FormCard/FormCard'
import Navigation from '../../components/Navigation/Navigation'
import Footer from '../../components/Footer/Footer'
import { apiRegister } from '../../utils/api'
import styles from './Signup.module.css'

interface SignupErrors {
    username?: string
    email?: string
    password?: string
    confirmPassword?: string
}

const Signup = function () {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [errors, setErrors] = useState<SignupErrors>({})
    const [loading, setLoading] = useState(false)

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

    const validateForm = () => {
        const newErrors: SignupErrors = {}

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
        <>
            <Navigation />
            <div className={styles.signupContainer}>
                <FormCard
                    title="Create Account"
                    subtitle="Join Claud and start storing files securely"
                >
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <Input
                            label="Username"
                            type="text"
                            placeholder="choose_username"
                            value={formData.username}
                            onChange={handleChange}
                            error={errors.username}
                        />
                        <Input
                            label="Email"
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="At least 8 characters"
                            value={formData.password}
                            onChange={handleChange}
                            error={errors.password}
                        />
                        <Input
                            label="Confirm Password"
                            type="password"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            error={errors.confirmPassword}
                        />

                        <button type="submit" className={styles.submitButton} disabled={loading}>
                            {loading ? 'Creating account...' : 'Sign Up'}
                        </button>
                    </form>

                    <div className={styles.links}>
                        <span className={styles.text}>Already have an account?</span>
                        <Link to="/login" className={styles.link}>
                            Log in
                        </Link>
                    </div>
                </FormCard>
            </div>
            <Footer />
        </>
    )
}

export default Signup
