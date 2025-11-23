import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardHeader from '../../components/DashboardHeader/DashboardHeader'
import Sidebar from '../../components/Sidebar/Sidebar'
import styles from './ImageGeneration.module.css'
import { IoSparklesOutline, IoDownloadOutline, IoImageOutline, IoChatbubbleOutline, IoPaperPlaneOutline } from 'react-icons/io5'
import { apiGetCurrentUser, apiGenerateImage } from '../../utils/api'
import { logger } from '../../utils/logger'

interface GeneratedImage {
    imageId: string
    url: string
    mediaId: string
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
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    
    // Image generation settings
    const [seed] = useState(0)
    const [numberOfImages] = useState(1)
    const [aspectRatio] = useState('IMAGE_ASPECT_RATIO_SQUARE')
    const [generationModel] = useState('IMAGEN_3_5')

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
        console.log('Messages state updated:', messages)
    }, [messages])

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

            if (response.success && response.images && response.images.length > 0) {
                logger.success('Images generated successfully')
                const images = response.images
                
                setMessages(prev => [...prev, {
                    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    role: 'assistant',
                    content: `Generated ${images.length} image(s) based on your prompt.`,
                    type: 'image',
                    images: images,
                    timestamp: new Date()
                }])
            } else {
                logger.error('Failed to generate images', response.message)
                setMessages(prev => [...prev, {
                    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

        try {
            // Use Gemini API without streaming
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
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
                const errorText = await response.text()
                console.error('API Error Response:', errorText)
                let errorData
                try {
                    errorData = JSON.parse(errorText)
                } catch {
                    errorData = { error: { message: errorText } }
                }
                throw new Error(errorData.error?.message || `HTTP ${response.status}: Failed to generate text`)
            }

            // Get response as text first to see what we're actually receiving
            const responseText = await response.text()
            console.log('Raw API Response (first 500 chars):', responseText.substring(0, 500))
            
            let data
            try {
                data = JSON.parse(responseText)
            } catch (parseError) {
                console.error('Failed to parse JSON response:', parseError)
                console.error('Full response text:', responseText)
                throw new Error('Invalid JSON response from API')
            }
            
            // Log the parsed response for debugging
            console.log('Parsed Gemini API Response:', data)
            
            // Extract text from the response
            let fullText = ''
            
            // Handle different response structures
            if (Array.isArray(data)) {
                // Response is an array of objects
                for (const item of data) {
                    if (item.candidates?.[0]?.content?.parts) {
                        for (const part of item.candidates[0].content.parts) {
                            if (part.text) {
                                fullText += part.text
                            }
                        }
                    }
                }
            } else if (data.candidates?.[0]?.content?.parts) {
                // Response is a single object
                for (const part of data.candidates[0].content.parts) {
                    if (part.text) {
                        fullText += part.text
                    }
                }
            } else if (data.candidates?.[0]?.content?.text) {
                // Alternative structure where text is directly in content
                fullText = data.candidates[0].content.text
            }

            console.log('Extracted text:', fullText)

            // Add final message
            if (fullText && fullText.trim()) {
                const newMessage: Message = {
                    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    role: 'assistant',
                    content: fullText.trim(),
                    type: 'text',
                    timestamp: new Date()
                }
                console.log('Adding message to state:', newMessage)
                setMessages(prev => {
                    const updated = [...prev, newMessage]
                    console.log('Updated messages array:', updated)
                    return updated
                })
            } else {
                console.error('No text extracted from response. Full response:', JSON.stringify(data, null, 2))
                throw new Error('Failed to generate text: No content received from AI service. Response structure may be unexpected.')
            }
        } catch (error) {
            logger.error('Error generating text', error)
            console.error('Error details:', error)
            const errorMessage: Message = {
                id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                role: 'assistant',
                content: `Error: ${error instanceof Error ? error.message : 'Failed to generate text'}`,
                type: 'text',
                timestamp: new Date()
            }
            setMessages(prev => {
                console.log('Adding error message:', errorMessage)
                return [...prev, errorMessage]
            })
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isGenerating) return

        const userMessage: Message = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: 'user',
            content: input.trim(),
            type: mode === 'image' ? 'image' : 'text',
            timestamp: new Date()
        }

        setMessages(prev => {
            console.log('Adding user message:', userMessage)
            return [...prev, userMessage]
        })
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

                        {isGenerating && (
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
