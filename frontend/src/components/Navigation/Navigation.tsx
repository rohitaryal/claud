import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginButton from '../Button/Button'
import { apiGetCurrentUser } from '../../utils/api'
import styles from './Navigation.module.css'

const Navigation = function () {
    const navigate = useNavigate()
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        const checkAuth = async () => {
            const response = await apiGetCurrentUser()
            setIsAuthenticated(response.success && !!response.user)
        }
        checkAuth()
    }, [])

    // Don't show navigation if user is authenticated (they'll see dashboard header instead)
    if (isAuthenticated) {
        return null
    }

    return (
        <nav className={styles.navContainer}>
            {/*Asset is in /public*/}
            <img src="/cloud-original.png" className={styles.logo} onClick={() => navigate('/')} />
            <div className={styles.navLinksContainer}>
                <a href="#">Join Claud</a>
                <a href="#">Documentation</a>
                <a href="#">About Us</a>
                <a href="#">Terms & Conditions</a>
            </div>
            <LoginButton
                text="Login to Claud"
                colored={true}
                onClick={() => navigate('/login')}
            />
        </nav>
    )
}

export default Navigation
