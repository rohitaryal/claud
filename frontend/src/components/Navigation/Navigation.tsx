import { useNavigate } from 'react-router-dom'
import LoginButton from '../Button/Button'
import styles from './Navigation.module.css'

const Navigation = function () {
    const navigate = useNavigate()

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
