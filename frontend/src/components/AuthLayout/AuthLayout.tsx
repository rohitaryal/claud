import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { IoArrowForward } from 'react-icons/io5'
import styles from './AuthLayout.module.css'

interface AuthLayoutProps {
    children: React.ReactNode
    title: string
    subtitle?: string
}

const images = [
    {
        url: '/night.jpg',
        tagline: 'Save Your Secrets With Confidence'
    },
    {
        url: '/library.jpg',
        tagline: 'One Platform to Store, Sync and Share'
    },
    {
        url: '/gallery.jpg',
        tagline: 'Secure Cloud Storage for Everyone'
    }
]

const AuthLayout = function ({ children, title, subtitle }: AuthLayoutProps) {
    const navigate = useNavigate()
    const location = useLocation()
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length)
        }, 5000) // Change image every 5 seconds

        return () => clearInterval(interval)
    }, [])

    const handleIndicatorClick = (index: number) => {
        setCurrentImageIndex(index)
    }

    const getTabClass = (path: string) => {
        return location.pathname === path ? styles.tabActive : styles.tabInactive
    }

    return (
        <div className={styles.authContainer}>
            <div className={styles.leftSection}>
                <div className={styles.leftHeader}>
                    <img 
                        src="/cloud-original.png" 
                        alt="Claud Logo" 
                        className={styles.logoImage}
                        onClick={() => navigate('/')}
                    />
                    <button
                        className={styles.backButton}
                        onClick={() => navigate('/')}
                    >
                        Back to website <IoArrowForward />
                    </button>
                </div>
                <div className={styles.imageCarousel}>
                    <div
                        className={styles.imageWrapper}
                        style={{
                            transform: `translateX(-${currentImageIndex * 100}%)`
                        }}
                    >
                        {images.map((image, index) => (
                            <div key={index} className={styles.imageSlide}>
                                <img src={image.url} alt={`Slide ${index + 1}`} />
                                <div className={styles.imageOverlay} />
                            </div>
                        ))}
                    </div>
                    <div className={styles.tagline}>
                        {images[currentImageIndex].tagline}
                    </div>
                    <div className={styles.indicators}>
                        {images.map((_, index) => (
                            <button
                                key={index}
                                className={`${styles.indicator} ${
                                    index === currentImageIndex ? styles.indicatorActive : ''
                                }`}
                                onClick={() => handleIndicatorClick(index)}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.rightSection}>
                <div className={styles.formCard}>
                    <div className={styles.tabsContainer}>
                        <button
                            type="button"
                            className={`${styles.tab} ${getTabClass('/login')}`}
                            onClick={() => navigate('/login')}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            className={`${styles.tab} ${getTabClass('/signup')}`}
                            onClick={() => navigate('/signup')}
                        >
                            Sign Up
                        </button>
                        <button
                            type="button"
                            className={`${styles.tab} ${getTabClass('/forgot-password')}`}
                            onClick={() => navigate('/forgot-password')}
                        >
                            Forgot
                        </button>
                    </div>
                    <div className={styles.content}>
                        <div className={styles.header}>
                            <h1 className={styles.title}>{title}</h1>
                            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AuthLayout

