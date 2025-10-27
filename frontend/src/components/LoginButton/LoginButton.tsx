import { IoArrowForwardOutline } from 'react-icons/io5'
import styles from './LoginButton.module.css'

const LoginButton = function () {
    return (
        <button className={styles.loginButton}>
            <span className={styles.loginText}>Login to Claud</span>
            <IoArrowForwardOutline className={styles.arrow} size={40} />
        </button>
    )
}

export default LoginButton
