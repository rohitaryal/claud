import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './FormCard.module.css'

interface FormCardProps {
    title: string
    subtitle?: string
    children: ReactNode
}

const FormCard = function ({ title, subtitle, children }: FormCardProps) {
    const navigate = useNavigate()
    const location = useLocation()

    const getTabClass = (path: string) => {
        return location.pathname === path ? styles.tabActive : styles.tabInactive
    }

    return (
        <div className={styles.formCard}>
            <div className={styles.tabsContainer}>
                <button
                    type="button"
                    className={styles.tab + ' ' + getTabClass('/login')}
                    onClick={() => navigate('/login')}
                >
                    SIGN IN
                </button>
                <button
                    type="button"
                    className={styles.tab + ' ' + getTabClass('/signup')}
                    onClick={() => navigate('/signup')}
                >
                    SIGN UP
                </button>
                <button
                    type="button"
                    className={styles.tab + ' ' + getTabClass('/forgot-password')}
                    onClick={() => navigate('/forgot-password')}
                >
                    RESET
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
    )
}

export default FormCard
