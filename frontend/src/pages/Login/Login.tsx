import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Input from '../../components/Input/Input'
import FormCard from '../../components/FormCard/FormCard'
import Navigation from '../../components/Navigation/Navigation'
import Footer from '../../components/Footer/Footer'
import { apiLogin } from '../../utils/api'
import styles from './Login.module.css'

const Login = function () {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
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
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters'
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
                navigate('/home')
            } else {
                setErrors({ email: response.message || 'Login failed' })
            }
        } catch (error) {
            console.error(error)
            setErrors({ email: 'Login failed. Please try again.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Navigation />
            <div className={styles.loginContainer}>
                <FormCard title="Welcome Back" subtitle="Login to your Claud account">
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <Input
                            label="Email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            error={errors.email}
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={errors.password}
                        />

                        <button type="submit" className={styles.submitButton} disabled={loading}>
                            {loading ? 'Logging in...' : 'Log In'}
                        </button>
                    </form>

                    <div className={styles.links}>
                        <Link to="/forgot-password" className={styles.link}>
                            Forgot password?
                        </Link>
                        <span className={styles.divider}>•</span>
                        <Link to="/signup" className={styles.link}>
                            Create account
                        </Link>
                    </div>
                </FormCard>
            </div>
            <Footer />
        </>
    )
}

export default Login
