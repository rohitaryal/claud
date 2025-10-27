import { IoArrowForwardOutline } from 'react-icons/io5'
import styles from './Button.module.css'

interface ButtonProps {
    text: string
    colored: boolean
}

const Button = function ({ text, colored }: ButtonProps) {
    return (
        <button
            className={styles.button + ' ' + (colored ? styles.blueButton : styles.whiteButton)}
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
