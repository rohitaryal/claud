import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button/Button'
import Footer from '../../components/Footer/Footer'
import Navigation from '../../components/Navigation/Navigation'
import styles from './Welcome.module.css'

const Welcome = function () {
    const navigate = useNavigate()

    return (
        <>
            <Navigation />
            <div className={styles.welcomeContainer}>
                <div className={styles.welcomeText}>
                    <span className={styles.firstLine}>Save Your Secrets</span>
                    <span className={styles.secondLine}>With Confidence</span>
                    <span className={styles.finalLine}>
                        One platform to instantly <span>store</span>, <span>sync</span> and{' '}
                        <span>share</span> files
                    </span>
                </div>

                <div className={styles.buttonsContainer}>
                    <Button text="Log In" colored={false} onClick={() => navigate('/login')} />
                    <Button text="Sign Up" colored={true} onClick={() => navigate('/signup')} />
                </div>
                <img src="/people.jpg" className={styles.people} />
            </div>
            <Footer />
        </>
    )
}

export default Welcome
