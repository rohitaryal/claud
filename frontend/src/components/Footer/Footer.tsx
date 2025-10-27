import styles from './Footer.module.css'

const Footer = function () {
    return (
        <footer className={styles.footer}>
            <span className={styles.largeText}>Claud</span>
            <div className={styles.footerEnd}>
                <span className={styles.copyright}>
                    Copyright (c) 2025 Claud. All Rights Reserved.
                </span>
                <span className={styles.links}>
                    <a href="#">Privacy Policy</a>
                    <a href="#">Cookie Policy</a>
                </span>
            </div>
        </footer>
    )
}

export default Footer
