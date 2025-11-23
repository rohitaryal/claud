import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardHeader from '../../components/DashboardHeader/DashboardHeader'
import Sidebar from '../../components/Sidebar/Sidebar'
import styles from './ImageGeneration.module.css'
import { IoSparklesOutline, IoDownloadOutline, IoImageOutline, IoChatbubbleOutline, IoPaperPlaneOutline } from 'react-icons/io5'
import { apiGetCurrentUser, apiGenerateImage, type ImageGenerationSettings } from '../../utils/api'
import { logger } from '../../utils/logger'

interface GeneratedImage {
    imageId: string
    url: string
    mediaId: string
}

interface GenerationResult {
    images: GeneratedImage[]
    prompt: string
    settings: ImageGenerationSettings
}

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    type: 'text' | 'image'
    images?: GeneratedImage[]
    timestamp: Date
}

type Mode = 'image' | 'text'

const ImageGeneration = function () {
    const navigate = useNavigate()
    const [mode, setMode] = useState<Mode>('image')
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [streamingText, setStreamingText] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    
    // Image generation settings
    const [seed, setSeed] = useState(0)
    const [numberOfImages, setNumberOfImages] = useState(1)
    const [aspectRatio, setAspectRatio] = useState('IMAGE_ASPECT_RATIO_SQUARE')
    const [generationModel, setGenerationModel] = useState('IMAGEN_3_5')

    useEffect(() => {
        // Check authentication
        const checkAuth = async () => {
            const response = await apiGetCurrentUser()
            if (!response.success || !response.user) {
                navigate('/login')
                return
            }
        }
        checkAuth()
    }, [navigate])

    useEffect(() => {
        // Auto-scroll to bottom when new messages arrive
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, streamingText])

    useEffect(() => {
        // Focus input on mount
        inputRef.current?.focus()
    }, [])

    const getGoogleCookie = (): string => {
        return localStorage.getItem('google_imagefx_cookie') || ''
    }

    const getGeminiApiKey = (): string => {
        return localStorage.getItem('gemini_api_key') || ''
    }

    const handleGenerateImage = async (prompt: string) => {
        const googleCookie = getGoogleCookie()
        if (!googleCookie.trim()) {
            logger.error('Please configure your Google cookie in Settings')
            return
        }

        setIsGenerating(true)

        try {
            const response = await apiGenerateImage({
                prompt: prompt.trim(),
                seed,
                numberOfImages,
                aspectRatio,
                generationModel,
                googleCookie: googleCookie.trim()
            })

            if (response.success && response.images) {
                logger.success('Images generated successfully')
                
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `Generated ${response.images.length} image(s) based on your prompt.`,
                    type: 'image',
                    images: response.images,
                    timestamp: new Date()
                }])
            } else {
                logger.error('Failed to generate images', response.message)
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `Error: ${response.message || 'Failed to generate images'}`,
                    type: 'text',
                    timestamp: new Date()
                }])
            }
        } catch (error) {
            logger.error('Error generating images', error)
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'An error occurred while generating images. Please try again.',
                type: 'text',
                timestamp: new Date()
            }])
        } finally {
            setIsGenerating(false)
        }
    }

    const handleGenerateText = async (prompt: string) => {
        const apiKey = getGeminiApiKey()
        if (!apiKey.trim()) {
            logger.error('Please configure your Gemini API key in Settings')
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Please configure your Gemini API key in Settings to use text generation.',
                type: 'text',
                timestamp: new Date()
            }])
            return
        }

        setIsGenerating(true)
        setStreamingText('')

        try {
            // Use Gemini API with streaming
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:streamGenerateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }]
                    })
                }
            )

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error?.message || `HTTP ${response.status}: Failed to generate text`)
            }

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let fullText = ''
            let buffer = ''

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || ''

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const jsonStr = line.slice(6).trim()
                                if (jsonStr === '[DONE]') continue
                                
                                const data = JSON.parse(jsonStr)
                                if (data.candidates?.[0]?.content?.parts) {
                                    for (const part of data.candidates[0].content.parts) {
                                        if (part.text) {
                                            fullText += part.text
                                            setStreamingText(fullText)
                                        }
                                    }
                                }
                            } catch (e) {
                                // Skip invalid JSON
                            }
                        }
                    }
                }
            }

            // Add final message
            if (fullText) {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: fullText,
                    type: 'text',
                    timestamp: new Date()
                }])
            }
            setStreamingText('')
        } catch (error) {
            logger.error('Error generating text', error)
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: `Error: ${error instanceof Error ? error.message : 'Failed to generate text'}`,
                type: 'text',
                timestamp: new Date()
            }])
            setStreamingText('')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isGenerating) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            type: mode === 'image' ? 'image' : 'text',
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        const prompt = input.trim()
        setInput('')

        if (mode === 'image') {
            await handleGenerateImage(prompt)
        } else {
            await handleGenerateText(prompt)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    const handleDownload = async (imageUrl: string, fileName: string) => {
        try {
            const response = await fetch(imageUrl, {
                credentials: 'include'
            })
            
            if (!response.ok) {
                throw new Error('Failed to download image')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = fileName
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            
            logger.success('Image downloaded successfully')
        } catch (error) {
            logger.error('Failed to download image', error)
        }
    }

    return (
        <div className={styles.dashboard}>
            <DashboardHeader />
            <div className={styles.dashboardContent}>
                <Sidebar
                    activeSection="image-generation"
                    onSectionChange={(section) => {
                        if (section === 'my-files') {
                            navigate('/files')
                        } else if (section === 'home') {
                            navigate('/home')
                        }
                    }}
                    onNewClick={() => navigate('/home')}
                />
                <main className={styles.mainContent}>
                    <div className={styles.contentHeader}>
                        <div className={styles.headerTitle}>
                            <h1 className={styles.contentTitle}>
                                <IoSparklesOutline size={28} />
                                Claud Agent
                            </h1>
                            <span className={styles.betaBadge}>BETA</span>
                        </div>
                        <p className={styles.contentDescription}>
                            Generate images or chat with AI-powered assistance
                        </p>
                    </div>

                    {/* Mode Switcher */}
                    <div className={styles.modeSwitcher}>
                        <button
                            className={`${styles.modeButton} ${mode === 'image' ? styles.modeButtonActive : ''}`}
                            onClick={() => setMode('image')}
                            type="button"
                        >
                            <IoImageOutline size={20} />
                            Image Generation
                        </button>
                        <button
                            className={`${styles.modeButton} ${mode === 'text' ? styles.modeButtonActive : ''}`}
                            onClick={() => setMode('text')}
                            type="button"
                        >
                            <IoChatbubbleOutline size={20} />
                            Text Generation
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className={styles.messagesContainer}>
                        {messages.length === 0 && !isGenerating && (
                            <div className={styles.emptyState}>
                                <IoSparklesOutline size={64} className={styles.emptyIcon} />
                                <h3 className={styles.emptyTitle}>
                                    {mode === 'image' ? 'Start generating images' : 'Start a conversation'}
                                </h3>
                                <p className={styles.emptyDescription}>
                                    {mode === 'image' 
                                        ? 'Describe the image you want to generate and I\'ll create it for you.'
                                        : 'Ask me anything and I\'ll help you with text generation.'}
                                </p>
                            </div>
                        )}

                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`${styles.message} ${styles[`message${message.role === 'user' ? 'User' : 'Assistant'}`]}`}
                            >
                                <div className={styles.messageContent}>
                                    {message.type === 'image' && message.images ? (
                                        <div className={styles.imageGrid}>
                                            {message.images.map((image, idx) => (
                                                <div key={image.imageId} className={styles.imageCard}>
                                                    <img
                                                        src={image.url}
                                                        alt={`Generated ${idx + 1}`}
                                                        className={styles.generatedImage}
                                                    />
                                                    <div className={styles.imageOverlay}>
                                                        <button
                                                            className={styles.imageAction}
                                                            onClick={() => handleDownload(image.url, `generated-${image.imageId}.png`)}
                                                            title="Download"
                                                            type="button"
                                                        >
                                                            <IoDownloadOutline size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className={styles.messageText}>{message.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {streamingText && (
                            <div className={`${styles.message} ${styles.messageAssistant}`}>
                                <div className={styles.messageContent}>
                                    <p className={styles.messageText}>{streamingText}</p>
                                </div>
                            </div>
                        )}

                        {isGenerating && !streamingText && (
                            <div className={`${styles.message} ${styles.messageAssistant}`}>
                                <div className={styles.messageContent}>
                                    <div className={styles.typingIndicator}>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form className={styles.inputContainer} onSubmit={handleSubmit}>
                        <div className={styles.inputWrapper}>
                            <textarea
                                ref={inputRef}
                                className={styles.input}
                                placeholder={mode === 'image' ? 'Describe the image you want to generate...' : 'Type your message...'}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                rows={1}
                                disabled={isGenerating}
                            />
                            <button
                                className={styles.sendButton}
                                type="submit"
                                disabled={!input.trim() || isGenerating}
                            >
                                <IoPaperPlaneOutline size={20} />
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    )
}

export default ImageGeneration
