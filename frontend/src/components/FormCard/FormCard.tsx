import styles from './FormCard.module.css'

interface FormCardProps {
    title: string
    subtitle?: string
    children: React.ReactNode
}

const FormCard = function ({ title, subtitle, children }: FormCardProps) {
    return (
        <div className={styles.formCard}>
            <div className={styles.header}>
                <h1 className={styles.title}>{title}</h1>
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            <form className={styles.form}>{children}</form>
        </div>
    )
}

export default FormCard
