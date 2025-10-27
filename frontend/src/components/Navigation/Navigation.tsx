import LoginButton from '../Button/Button'
import styles from './Navigation.module.css'

const Navigation = function () {
    return (
        <nav className={styles.navContainer}>
            {/*Asset is in /public*/}
            <img src="/cloud-original.png" className={styles.logo} />
            <div className={styles.navLinksContainer}>
                <a href="#">Join Claud</a>
                <a href="#">Documentation</a>
                <a href="#">About Us</a>
                <a href="#">Terms & Conditions</a>
            </div>
            <LoginButton text="Login to Claud" colored={true} />
        </nav>
    )
}

export default Navigation
