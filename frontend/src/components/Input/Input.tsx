import styles from './Input.module.css'

interface InputProps {
    label: string
    type: string
    placeholder: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    error?: string
    name?: string
    variant?: 'light' | 'dark'
}

const Input = function ({ label, type, placeholder, value, onChange, error, name, variant = 'light' }: InputProps) {
    const variantClass = variant === 'dark' ? styles.dark : ''
    return (
        <div className={styles.inputGroup}>
            <label className={`${styles.label} ${variantClass}`}>{label}</label>
            <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={`${styles.input} ${variantClass} ${error ? styles.inputError : ''}`}
            />
            {error && <span className={`${styles.errorText} ${variantClass}`}>{error}</span>}
        </div>
    )
}

export default Input
