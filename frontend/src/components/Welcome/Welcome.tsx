import Button from '../Button/Button'
import styles from './Welcome.module.css'

const Welcome = function () {
    return (
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
                <Button text="Log In" colored={false} />
                <Button text="Sign Up" colored={true} />
            </div>

            <img src="/people.jpg" className={styles.people} />
        </div>
    )
}

export default Welcome
