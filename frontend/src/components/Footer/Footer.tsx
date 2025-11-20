import { FaLinkedinIn, FaFacebookF } from 'react-icons/fa'
import { IoCalendarOutline } from 'react-icons/io5'
import { MdEmail, MdPhone } from 'react-icons/md'
import styles from './Footer.module.css'

const Footer = function () {

    return (
        <footer className={styles.footer}>
            <div className={styles.footerMain}>
                <div className={styles.footerContent}>
                    <div className={styles.logoSection}>
                        <div className={styles.logoContainer}>
                            <img src="/cloud-original.png" alt="Claud Logo" className={styles.logoImage} />
                            <span className={styles.logoText}>CLAUD</span>
                        </div>
                        <button className={styles.demoButton}>
                            <div className={styles.buttonIconSection}>
                                <IoCalendarOutline className={styles.buttonIcon} />
                            </div>
                            <div className={styles.buttonTextSection}>
                                <span>Book a Demo</span>
                            </div>
                        </button>
                    </div>

                    <div className={styles.columnsContainer}>
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
                                <li className={styles.contactItem}>
                                    <div className={styles.contactKey}>
                                        <MdEmail className={styles.contactIcon} />
                                        <span>Email</span>
                                    </div>
                                    <div className={styles.contactValue}>
                                        <a href="mailto:info@claud.com">info@claud.com</a>
                                    </div>
                                </li>
                                <li className={styles.contactItem}>
                                    <div className={styles.contactKey}>
                                        <MdPhone className={styles.contactIcon} />
                                        <span>Phone</span>
                                    </div>
                                    <div className={styles.contactValue}>
                                        <a href="tel:+19725506000">(972) 550-6000</a>
                                    </div>
                                </li>
                                <li className={styles.socialLinks}>
                                    <a href="https://linkedin.com/company/claud" className={styles.socialIcon} aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                                        <FaLinkedinIn />
                                    </a>
                                    <a href="https://facebook.com/claud" className={styles.socialIcon} aria-label="Facebook" target="_blank" rel="noopener noreferrer">
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
