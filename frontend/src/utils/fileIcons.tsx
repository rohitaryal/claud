import { 
    IoDocumentTextOutline, 
    IoImageOutline, 
    IoVideocamOutline, 
    IoMusicalNotesOutline,
    IoArchiveOutline,
    IoCodeSlashOutline,
    IoFolderOutline,
    IoDocumentOutline,
    IoLogoPdf,
    IoLogoWord,
    IoLogoExcel
} from 'react-icons/io5'
import { IconType } from 'react-icons'

export function getFileIcon(filename: string, mimeType?: string): IconType {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    
    // Check if it's a folder
    if (mimeType?.includes('folder') || filename.endsWith('/')) {
        return IoFolderOutline
    }

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'].includes(ext) || mimeType?.startsWith('image/')) {
        return IoImageOutline
    }

    // Videos
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext) || mimeType?.startsWith('video/')) {
        return IoVideocamOutline
    }

    // Audio
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(ext) || mimeType?.startsWith('audio/')) {
        return IoMusicalNotesOutline
    }

    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext) || mimeType?.includes('archive') || mimeType?.includes('compressed')) {
        return IoArchiveOutline
    }

    // PDF
    if (ext === 'pdf' || mimeType === 'application/pdf') {
        return IoLogoPdf
    }

    // Word documents
    if (['doc', 'docx'].includes(ext) || mimeType?.includes('word')) {
        return IoLogoWord
    }

    // Excel
    if (['xls', 'xlsx', 'csv'].includes(ext) || mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) {
        return IoLogoExcel
    }

    // Code files
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs', 'swift', 'kt'].includes(ext)) {
        return IoCodeSlashOutline
    }

    // Text files
    if (['txt', 'md', 'rtf'].includes(ext) || mimeType?.startsWith('text/')) {
        return IoDocumentOutline
    }

    // Default
    return IoDocumentTextOutline
}

