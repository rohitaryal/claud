import { IoArrowForwardOutline } from 'react-icons/io5'
import styles from './Button.module.css'

interface ButtonProps {
    text: string
    colored: boolean
    onClick?: () => void
    href?: string
}

const Button = function ({ text, colored, onClick, href }: ButtonProps) {
    const handleClick = () => {
        if (href) {
            window.location.href = href
        }
        onClick?.()
    }

    return (
        <button
            className={styles.button + ' ' + (colored ? styles.blueButton : styles.whiteButton)}
            onClick={handleClick}
        >
            <span className={styles.text}>{text}</span>
            <IoArrowForwardOutline
                className={styles.arrow}
                color={colored ? 'var(--blue-dark)' : 'white'}
                size={40}
            />
        </button>
    )
}

export default Button
