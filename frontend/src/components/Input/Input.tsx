import styles from './Input.module.css'

interface InputProps {
    label: string
    type: string
    placeholder: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    error?: string
    name?: string
}

const Input = function ({ label, type, placeholder, value, onChange, error, name }: InputProps) {
    return (
        <div className={styles.inputGroup}>
            <label className={styles.label}>{label}</label>
            <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={styles.input + (error ? ' ' + styles.inputError : '')}
            />
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    )
}

export default Input
