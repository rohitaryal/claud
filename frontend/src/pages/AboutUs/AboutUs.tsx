import { useNavigate } from 'react-router-dom'
import { IoCloudOutline, IoRefreshOutline, IoLockClosedOutline, IoGlobeOutline } from 'react-icons/io5'
import Navigation from '../../components/Navigation/Navigation'
import Footer from '../../components/Footer/Footer'
import styles from './AboutUs.module.css'

const AboutUs = function () {
    const navigate = useNavigate()

    const developers = [
        { name: 'Rohit Sharma' },
        { name: 'Prajwal Jha' },
        { name: 'Aniket Sah' },
        { name: 'Pradeep Kumar Kohar' },
        { name: 'Awadesh Gupta Kaulapuri' },
        { name: 'Nagendra Thakur' }
    ]

    return (
        <>
            <Navigation />
            <div className={styles.aboutContainer}>
                <div className={styles.heroSection}>
                    <h1 className={styles.heroTitle}>About Claud</h1>
                    <p className={styles.heroSubtitle}>
                        An open-source distributed file management system
                    </p>
                </div>

                <div className={styles.contentSection}>
                    <div className={styles.descriptionCard}>
                        <h2 className={styles.sectionTitle}>What is Claud?</h2>
                        <p className={styles.description}>
                            Claud (<em>/klɔːd/</em>) is a modern, cloud-based file storage system 
                            designed as an alternative to traditional file management solutions. 
                            Built with cutting-edge technology, Claud offers a seamless experience 
                            for storing, syncing, and sharing files with confidence.
                        </p>
                        <p className={styles.description}>
                            As an <strong>open-source distributed file management</strong> platform, 
                            Claud empowers users with complete control over their data while 
                            providing enterprise-grade features and security.
                        </p>
                    </div>

                    <div className={styles.teamSection}>
                        <h2 className={styles.sectionTitle}>Our Team</h2>
                        <p className={styles.teamIntro}>
                            Claud is built with passion by a dedicated team of developers 
                            committed to creating the best file management experience.
                        </p>
                        <div className={styles.developersGrid}>
                            {developers.map((dev, index) => (
                                <div key={index} className={styles.developerCard}>
                                    <div className={styles.developerAvatar}>
                                        {dev.name.charAt(0)}
                                    </div>
                                    <h3 className={styles.developerName}>{dev.name}</h3>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.featuresSection}>
                        <h2 className={styles.sectionTitle}>Key Features</h2>
                        <div className={styles.featuresGrid}>
                            <div className={styles.featureCard}>
                                <div className={styles.featureIcon}>
                                    <IoCloudOutline size={48} />
                                </div>
                                <h3 className={styles.featureTitle}>Cloud Storage</h3>
                                <p className={styles.featureDescription}>
                                    Store your files securely in the cloud with instant access from anywhere
                                </p>
                            </div>
                            <div className={styles.featureCard}>
                                <div className={styles.featureIcon}>
                                    <IoRefreshOutline size={48} />
                                </div>
                                <h3 className={styles.featureTitle}>Real-time Sync</h3>
                                <p className={styles.featureDescription}>
                                    Automatic synchronization across all your devices in real-time
                                </p>
                            </div>
                            <div className={styles.featureCard}>
                                <div className={styles.featureIcon}>
                                    <IoLockClosedOutline size={48} />
                                </div>
                                <h3 className={styles.featureTitle}>Secure & Private</h3>
                                <p className={styles.featureDescription}>
                                    Your data is encrypted and protected with industry-standard security
                                </p>
                            </div>
                            <div className={styles.featureCard}>
                                <div className={styles.featureIcon}>
                                    <IoGlobeOutline size={48} />
                                </div>
                                <h3 className={styles.featureTitle}>Open Source</h3>
                                <p className={styles.featureDescription}>
                                    Built on open-source principles, transparent and community-driven
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.ctaSection}>
                        <h2 className={styles.ctaTitle}>Ready to Get Started?</h2>
                        <p className={styles.ctaText}>
                            Join thousands of users who trust Claud for their file management needs
                        </p>
                        <div className={styles.ctaButtons}>
                            <button 
                                className={styles.ctaButtonPrimary}
                                onClick={() => navigate('/signup')}
                            >
                                Sign Up Free
                            </button>
                            <button 
                                className={styles.ctaButtonSecondary}
                                onClick={() => navigate('/login')}
                            >
                                Log In
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}

export default AboutUs

