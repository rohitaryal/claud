import { useEffect } from 'react'
import { IoClose } from 'react-icons/io5'
import styles from './Dialog.module.css'

interface DialogProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    message?: string
    children?: React.ReactNode
    large?: boolean
}

const Dialog = function ({ isOpen, onClose, title, message, children, large = false }: DialogProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }

        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={`${styles.dialog} ${large ? styles.dialogLarge : ''}`} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose} aria-label="Close">
                    <IoClose />
                </button>
                {(title || message || children) && (
                    <div className={styles.content}>
                        {title && <h2 className={styles.title}>{title}</h2>}
                        {message && <p className={styles.message}>{message}</p>}
                        {children}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dialog

