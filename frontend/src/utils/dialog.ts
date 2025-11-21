import { createRoot, type Root } from 'react-dom/client'
import Dialog from '../components/Dialog/Dialog'
import React from 'react'

interface DialogOptions {
    title?: string
    message?: string
    children?: React.ReactNode
}

let dialogRoot: Root | null = null
let dialogContainer: HTMLDivElement | null = null

export const showDialog = (options: DialogOptions): Promise<void> => {
    return new Promise((resolve) => {
        // Clean up any existing dialog
        if (dialogRoot && dialogContainer) {
            dialogRoot.unmount()
            document.body.removeChild(dialogContainer)
        }

        dialogContainer = document.createElement('div')
        document.body.appendChild(dialogContainer)
        dialogRoot = createRoot(dialogContainer)

        const handleClose = () => {
            if (dialogRoot && dialogContainer) {
                dialogRoot.unmount()
                document.body.removeChild(dialogContainer)
                dialogRoot = null
                dialogContainer = null
            }
            resolve()
        }

        dialogRoot.render(
            React.createElement(Dialog, {
                isOpen: true,
                onClose: handleClose,
                title: options.title,
                message: options.message,
                children: options.children
            })
        )
    })
}

export const showUnderDevelopmentDialog = (feature: string = 'This feature') => {
    return showDialog({
        title: 'Under Development',
        message: `${feature} is currently under development. Please check back soon!`
    })
}

