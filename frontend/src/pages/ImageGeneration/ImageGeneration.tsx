import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardHeader from '../../components/DashboardHeader/DashboardHeader'
import Sidebar from '../../components/Sidebar/Sidebar'
import styles from './ImageGeneration.module.css'
import { IoSparklesOutline, IoDownloadOutline, IoSettingsOutline, IoCloseOutline } from 'react-icons/io5'
import { apiGetCurrentUser, apiGenerateImage, type AuthUser, type ImageGenerationSettings } from '../../utils/api'
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

const ImageGeneration = function () {
    const navigate = useNavigate()
    const [, setUser] = useState<AuthUser | null>(null)
    const [prompt, setPrompt] = useState('')
    const [googleCookie, setGoogleCookie] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedImages, setGeneratedImages] = useState<GenerationResult[]>([])
    const [showSettings, setShowSettings] = useState(false)
    
    // Settings
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
            setUser(response.user)
        }
        checkAuth()

        // Load saved Google cookie from localStorage
        const savedCookie = localStorage.getItem('google_imagefx_cookie')
        if (savedCookie) {
            setGoogleCookie(savedCookie)
        }
    }, [navigate])

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            logger.error('Please enter a prompt')
            return
        }

        if (!googleCookie.trim()) {
            logger.error('Please enter your Google cookie for ImageFX')
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
                
                // Add to generated images list
                setGeneratedImages(prev => [{
                    images: response.images!,
                    prompt: response.prompt!,
                    settings: response.settings!
                }, ...prev])

                // Clear prompt for next generation
                setPrompt('')
                
                // Save cookie to localStorage for future use
                localStorage.setItem('google_imagefx_cookie', googleCookie.trim())
            } else {
                logger.error('Failed to generate images', response.message)
            }
        } catch (error) {
            logger.error('Error generating images', error)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleDownload = async (imageUrl: string, fileName: string) => {
        try {
            // Since the images are saved in our system, we can download them directly
            logger.info('Downloading image', fileName)
            
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

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleGenerate()
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
                                Image Generation
                            </h1>
                            <span className={styles.betaBadge}>BETA</span>
                        </div>
                        <p className={styles.contentDescription}>
                            Generate stunning images using AI-powered ImageFX
                        </p>
                    </div>

                    {/* Cookie Input Section */}
                    {!googleCookie && (
                        <div className={styles.cookieSection}>
                            <div className={styles.cookieCard}>
                                <h3 className={styles.cookieTitle}>🔑 Google ImageFX Cookie Required</h3>
                                <p className={styles.cookieDescription}>
                                    To use this feature, you need to provide your Google cookie from ImageFX.
                                </p>
                                <input
                                    type="password"
                                    className={styles.cookieInput}
                                    placeholder="Enter your Google cookie..."
                                    value={googleCookie}
                                    onChange={(e) => setGoogleCookie(e.target.value)}
                                />
                                <p className={styles.cookieHint}>
                                    Your cookie is stored locally and never shared with anyone.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Generation Interface */}
                    <div className={styles.generationSection}>
                        <div className={styles.promptCard}>
                            <div className={styles.promptHeader}>
                                <span className={styles.promptLabel}>Describe your image</span>
                                <button
                                    className={styles.settingsButton}
                                    onClick={() => setShowSettings(!showSettings)}
                                    type="button"
                                >
                                    <IoSettingsOutline size={20} />
                                    Settings
                                </button>
                            </div>
                            
                            {showSettings && (
                                <div className={styles.settingsPanel}>
                                    <div className={styles.settingRow}>
                                        <label className={styles.settingLabel}>
                                            Seed
                                            <input
                                                type="number"
                                                className={styles.settingInput}
                                                value={seed}
                                                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                                                min="0"
                                            />
                                        </label>
                                        <label className={styles.settingLabel}>
                                            Number of Images
                                            <select
                                                className={styles.settingSelect}
                                                value={numberOfImages}
                                                onChange={(e) => setNumberOfImages(parseInt(e.target.value))}
                                            >
                                                <option value="1">1</option>
                                                <option value="2">2</option>
                                                <option value="3">3</option>
                                                <option value="4">4</option>
                                            </select>
                                        </label>
                                    </div>
                                    <div className={styles.settingRow}>
                                        <label className={styles.settingLabel}>
                                            Aspect Ratio
                                            <select
                                                className={styles.settingSelect}
                                                value={aspectRatio}
                                                onChange={(e) => setAspectRatio(e.target.value)}
                                            >
                                                <option value="IMAGE_ASPECT_RATIO_SQUARE">Square (1:1)</option>
                                                <option value="IMAGE_ASPECT_RATIO_PORTRAIT">Portrait (9:16)</option>
                                                <option value="IMAGE_ASPECT_RATIO_LANDSCAPE">Landscape (16:9)</option>
                                            </select>
                                        </label>
                                        <label className={styles.settingLabel}>
                                            Model
                                            <select
                                                className={styles.settingSelect}
                                                value={generationModel}
                                                onChange={(e) => setGenerationModel(e.target.value)}
                                            >
                                                <option value="IMAGEN_3">Imagen 3</option>
                                                <option value="IMAGEN_3_5">Imagen 3.5</option>
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            )}

                            <textarea
                                className={styles.promptInput}
                                placeholder="A beautiful sunset over mountains with a lake in the foreground..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyPress={handleKeyPress}
                                rows={3}
                            />
                            
                            <button
                                className={styles.generateButton}
                                onClick={handleGenerate}
                                disabled={isGenerating || !prompt.trim() || !googleCookie.trim()}
                                type="button"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className={styles.spinner} />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <IoSparklesOutline size={20} />
                                        Generate Images
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Generated Images */}
                    {generatedImages.length > 0 && (
                        <div className={styles.resultsSection}>
                            <h2 className={styles.resultsTitle}>Generated Images</h2>
                            {generatedImages.map((result, resultIndex) => (
                                <div key={resultIndex} className={styles.resultGroup}>
                                    <div className={styles.resultHeader}>
                                        <div className={styles.resultPrompt}>
                                            <span className={styles.resultPromptLabel}>Prompt:</span>
                                            <span className={styles.resultPromptText}>{result.prompt}</span>
                                        </div>
                                        <div className={styles.resultSettings}>
                                            <span className={styles.resultSettingTag}>
                                                {result.settings.generationModel === 'IMAGEN_3_5' ? 'Imagen 3.5' : 'Imagen 3'}
                                            </span>
                                            <span className={styles.resultSettingTag}>
                                                {result.settings.aspectRatio.replace('IMAGE_ASPECT_RATIO_', '')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.imageGrid}>
                                        {result.images.map((image, imageIndex) => (
                                            <div key={image.imageId} className={styles.imageCard}>
                                                <img
                                                    src={image.url}
                                                    alt={`Generated ${imageIndex + 1}`}
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
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {generatedImages.length === 0 && !isGenerating && (
                        <div className={styles.emptyState}>
                            <IoSparklesOutline size={64} className={styles.emptyIcon} />
                            <h3 className={styles.emptyTitle}>No images generated yet</h3>
                            <p className={styles.emptyDescription}>
                                Enter a prompt and click "Generate Images" to create stunning AI-powered artwork
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default ImageGeneration
