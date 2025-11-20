import { FaLinkedinIn, FaFacebookF } from 'react-icons/fa'
import Button from '../Button/Button'
import styles from './Footer.module.css'

const Footer = function () {

    return (
        <footer className={styles.footer}>
            <div className={styles.footerMain}>
                <div className={styles.footerContent}>
                    <div className={styles.logoSection}>
                        <div className={styles.logoContainer}>
                            <div className={styles.logoSquare}></div>
                            <span className={styles.logoText}>CLAUD</span>
                        </div>
                        <Button
                            text="Book a Demo"
                            variant="outline"
                            onClick={() => {}}
                            className={styles.demoButton}
                        />
                    </div>

                    <div className={styles.columnsContainer}>
                        <div className={styles.column}>
                            <h3 className={styles.columnTitle}>Solutions</h3>
                            <ul className={styles.columnList}>
                                <li><a href="#">File Storage</a></li>
                                <li><a href="#">File Sharing</a></li>
                                <li><a href="#">Secure Sync</a></li>
                                <li><a href="#">Cloud Backup</a></li>
                                <li><a href="#">File Management</a></li>
                                <li><a href="#">Team Collaboration</a></li>
                                <li><a href="#">Version Control</a></li>
                                <li><a href="#">Access Control</a></li>
                                <li><a href="#">API Integration</a></li>
                                <li><a href="#">Enterprise Solutions</a></li>
                            </ul>
                        </div>

                        <div className={styles.column}>
                            <h3 className={styles.columnTitle}>Resources</h3>
                            <ul className={styles.columnList}>
                                <li><a href="#">About Us</a></li>
                                <li><a href="#">Leadership Team</a></li>
                                <li><a href="#">Board of Directors</a></li>
                            </ul>
                        </div>

                        <div className={styles.column}>
                            <h3 className={styles.columnTitle}>Contact</h3>
                            <ul className={styles.columnList}>
                                <li><a href="mailto:info@claud.com">Email info@claud.com</a></li>
                                <li><a href="tel:+19725506000">Phone (972) 550-6000</a></li>
                                <li className={styles.socialLinks}>
                                    <a href="#" className={styles.socialIcon} aria-label="LinkedIn">
                                        <FaLinkedinIn />
                                    </a>
                                    <a href="#" className={styles.socialIcon} aria-label="Facebook">
                                        <FaFacebookF />
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className={styles.largeLogo}>
                    <span>Claud</span>
                </div>
            </div>

            <div className={styles.footerEnd}>
                <span className={styles.copyright}>
                    © 2025 Claud. All Rights Reserved.
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
