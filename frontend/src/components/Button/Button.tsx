import { IoArrowForwardOutline } from 'react-icons/io5'
import styles from './Button.module.css'

interface ButtonProps {
    text: string
    colored?: boolean
    onClick?: () => void
    href?: string
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    variant?: 'primary' | 'secondary' | 'outline' | 'gradient'
    size?: 'small' | 'medium' | 'large'
    fullWidth?: boolean
    className?: string
}

const Button = function ({ 
    text, 
    colored = false, 
    onClick, 
    href,
    type = 'button',
    disabled = false,
    variant,
    size = 'medium',
    fullWidth = false,
    className = ''
}: ButtonProps) {
    const handleClick = () => {
        if (disabled) return
        if (href) {
            window.location.href = href
        }
        onClick?.()
    }

    // Determine variant based on colored prop or explicit variant
    const buttonVariant = variant || (colored ? 'gradient' : 'outline')
    
    // Build class names
    const buttonClasses = [
        styles.button,
        styles[buttonVariant],
        styles[size],
        fullWidth ? styles.fullWidth : '',
        disabled ? styles.disabled : '',
        className
    ].filter(Boolean).join(' ')

    return (
        <button
            type={type}
            className={buttonClasses}
            onClick={handleClick}
            disabled={disabled}
        >
            <span className={styles.text}>{text}</span>
            {buttonVariant === 'gradient' || buttonVariant === 'primary' ? (
                <IoArrowForwardOutline
                    className={styles.arrow}
                    color="white"
                    size={size === 'small' ? 24 : size === 'large' ? 40 : 32}
                />
            ) : null}
        </button>
    )
}

export default Button
