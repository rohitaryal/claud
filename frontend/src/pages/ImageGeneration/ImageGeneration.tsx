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
            // System prompt for Claud Agent
            const systemPrompt = `You are a Claud-Agent. Claud is a distributed file system like Google Drive. You provide help to user related to Claud nothing else. These are the all available features dont answer anything else.

# Claud — End‑User & Maintainer Manual (In‑Depth)

This manual explains every publicly documented feature in the Claud project, where it lives in the code, how to change behavior, how to edit cookies and API behavior, and operational/maintenance guidance. Read it like a customer helpbook — short actionable sections first, then deep-dive guidance for maintainers.

Version: 1.0 — based on repository state (docs/, backend/, frontend/)  

Last scanned: 2025-11-23

---

Table of contents

- Quick start (run locally)

- Project layout (where to find things)

- Feature reference (what exists and how it behaves)

- How to change features (practical edits & file pointers)

- Cookies: view, validate, change behavior

- APIs: endpoints, versioning, and how to edit them

- Image generation feature (Google ImageFX cookie details)

- Frontend adjustments (env, routing, UX)

- Backend adjustments (middleware, upload storage, encryption)

- Environment variables & Docker

- Security checklist (must-do before production)

- Maintenance & monitoring

- Troubleshooting common issues

- Contributing & commit guidelines

- Appendix: useful file paths

---

Quick start (developer-friendly)

- With Docker Compose:

  1. git clone https://github.com/rohitaryal/claud.git

  2. cd claud

  3. docker-compose up -d

- After startup:

  - Frontend: http://localhost:5173

  - Backend API: http://localhost:3000

  - PostgreSQL: localhost:5432

If you prefer running services locally, see backend/README.md and the docs/ folder for instructions.

---

Project layout (where to find the code)

- backend/

  - src/

    - config/ (database config, env wiring)

    - middlewares/auth.ts (auth middleware — session checking)

    - utils/

      - db.ts (database helpers)

      - cookie.ts (cookie helpers & validators)

    - index.ts (app entry, router registrations — 'auth', 'files', 'image', etc.)

    - routes/ (authRouter, fileRouter, shareRouter, imageRouter) — where endpoints are implemented

- frontend/

  - src/ (React app, Vite)

  - components/Navigation/Navigation.tsx (top navigation)

  - pages/ (AboutUs, Login, Dashboard, etc.)

- docs/

  - product.md (complete feature and design documentation)

  - FILE_API.md (file upload / download API docs)

  - IMAGE_GENERATION.md (image gen docs)

- Docker files & README.docker.md (environment variables and Docker quick start)

- LICENSE (MIT)

---

Feature reference — what Claud offers (as documented)

1. Secure File Storage

   - Upload/download files of any type

   - Per-user isolated storage

   - Soft delete with recovery

2. User Management

   - Registration, login, logout

   - Session-based auth

   - Password hashing (docs state bcrypt/argon2)

3. File Organization

   - Folders, nested structure, metadata (size/type/timestamps)

4. File Sharing

   - Share with users, public links, tokens, expiration, permission levels

5. Image Generation (ImageFX)

   - Generate images via Google ImageFX (requires a Google cookie)

   - Cookie validation endpoint & generate endpoint

6. Modern architecture

   - Hono.js backend (fast lightweight framework)

   - PostgreSQL database

   - React frontend

   - Dockerized deployment

Source of truth for the above features: docs/product.md, FILE_API.md, IMAGE_GENERATION.md, and backend code.

---

How to change features — practical edits & file pointers

General rule: identify the component, change API/logic in backend, update frontend calls, update docs.

- Change authentication behavior

  - File to edit: backend/src/middlewares/auth.ts and backend/src/routes/authRouter (or similar)

  - Common edits:

    - Session expiration duration: change session creation as implemented in auth logic.

    - Cookie flags (HttpOnly, Secure, SameSite): see backend/src/utils/cookie.ts — update Set-Cookie handling.

    - Password algorithm: if replacing bcrypt with argon2, update hashing calls in registration/login code and add argon2 as a dependency.

- Change file storage location and behavior

  - Initialization: backend/src/index.ts calls initUploadDir() — change upload directory path or storage logic there.

  - File storage implementation: find file upload handler in fileRouter (backend/src/routes/files or similar).

  - To add encryption-at-rest:

    - Option A (encrypt on disk): integrate libs like node's crypto or sodium to encrypt files before write and decrypt on download.

    - Option B (cloud): upload to S3/GCS and use KMS for server-side encryption.

  - Soft-delete retention:

    - Adjust retention period in file delete handler and scheduled cleanup (db cleanup job or CRON). Look for soft-delete logic in database queries (docs mention soft delete).

- Change sharing rules & permissions

  - Files: backend file share routes in shareRouter (routes under /api and /api/files/:id/share)

  - Permission levels are enforced in file access validation — update permission logic to add roles.

- Change file metadata / indexing

  - Update DB schema (migrations) and backend create/update endpoints (PUT /files/:id).

  - If you add search, implement indexing (e.g., Postgres full-text or an external search service).

---

Cookies: view, validate, change behavior

What exists

- Cookie utility file: backend/src/utils/cookie.ts (utilities for creating and validating cookies).

- Image generation requires a Google cookie passed by client (see docs/IMAGE_GENERATION.md).

How to modify cookie settings (common tasks)

1. Where cookies are set:

   - In auth login/refresh handlers — find the code that sets the session cookie and update the Set-Cookie options.

2. Recommended cookie attributes for production:

   - HttpOnly; Secure; SameSite=Strict or Lax depending on cross-site requirements; SameSite=None + Secure when cross-site (but only if HTTPS).

   - Add a signed or encrypted cookie value (HMAC) or store only a session ID and keep actual session data server-side.

3. To change cookie lifetime:

   - Edit the maxAge/expires value where cookie.ts builds the Set-Cookie header.

4. To add cookie signing:

   - Use an HMAC secret (process.env.COOKIE_SECRET). Do not commit secrets.

Validating the Google cookie (ImageFX)

- The backend provides POST /api/image/validate-cookie — it accepts googleCookie and verifies it against ImageFX endpoints (see docs/IMAGE_GENERATION.md).

- Keep this private. Never log cookie values. Validate server-side only and return a boolean.

Security note (opinionated): never accept a raw third‑party cookie blindly. Validate it and store only a token or limited metadata in your DB. Never persist full cookies in plaintext.

---

APIs: endpoints, versioning, how to edit them

Key endpoints (documented)

- Auth:

  - POST /auth/register

  - POST /auth/login

  - POST /auth/logout

  - GET /auth/me

- Files:

  - POST /files/upload

  - GET /files

  - GET /files/:id

  - GET /files/:id/download

  - PUT /files/:id

  - DELETE /files/:id (soft delete)

- Sharing:

  - POST /files/:id/share

  - POST /files/:id/share/public

  - GET /share/:token

  - DELETE /share/:id

- Image generation:

  - POST /api/image/generate

  - POST /api/image/validate-cookie

How to add/change endpoints

1. Backend route files: open the corresponding router in backend/src/routes (authRouter, fileRouter, etc.). Update handlers, add middleware as needed.

2. Register routes: backend/src/index.ts registers routers; ensure new route prefixes are mounted.

3. API versioning: no explicit versioning shown. If you introduce breaking changes, create v1/v2 prefixes (e.g., /api/v1/files) and keep previous routes until clients migrate.

4. OpenAPI / docs: FILE_API.md exists — update it when endpoints change.

Testing API changes

- Unit tests (if present) and integration tests should be added. Use Postman or curl to exercise endpoints.

- Run the app and try the health endpoint first: GET /api/health returns status.

---

Image generation feature (Google ImageFX) — details & cautions

What it does

- Generates images from prompts via ImageFX. Requires the client to supply a valid Google cookie.

- Endpoints:

  - POST /api/image/generate — params: prompt, seed, numberOfImages, aspectRatio, generationModel, googleCookie

  - POST /api/image/validate-cookie — validate a cookie

Where to edit

- Backend route: imageRouter (mounted at /api/image in backend/src/index.ts).

- Cookie validation logic: likely in backend/src/utils/cookie.ts or in the image route itself.

Important security and operational notes (opinionated, but important)

- Never log googleCookie. Treat it as a secret (like a password).

- Consider adding quota and rate-limiting per user to prevent abuse (image generation costs).

- Implement async job queue for long-running generates; do not block request threads.

- Keep a clearly documented error mapping for third-party failures.

---

Frontend adjustments (what to change and where)

- API URL:

  - Change VITE_API_URL in frontend environment file (.env or .env.local). README.docker.md says default VITE_API_URL: http://backend:3000

- Navigation and links:

  - frontend/src/components/Navigation/Navigation.tsx — add/remove links, change UX for login flow.

- Login flow:

  - Update fetch calls to auth endpoints to match any backend changes.

- Handling cookies:

  - The frontend must not read HttpOnly cookies. For session cookies that are HttpOnly, rely on server side for authentication state (GET /auth/me).

- Image generation UI:

  - The frontend must collect googleCookie from the user (if that's the chosen UX) and POST it to the validate/generate endpoints. Avoid storing it in localStorage. If the user must paste a cookie, treat this workflow as advanced and warn about security.

UX opinion: requiring users to paste third‑party cookies is brittle and fragile — better to implement OAuth or a server-side integration with ImageFX token management if possible.

---

Backend adjustments (middleware, upload storage, encryption)

- Entry point: backend/src/index.ts registers routers and initializes DB and upload dir.

  - initDatabase() — check db.ts for migrations/initialization logic.

  - initUploadDir() — controls where files are written.

- Middlewares:

  - CORS config (allow headers: 'Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'; exposeHeaders: ['Content-Type', 'Set-Cookie']). Adjust if clients need different header access.

  - auth middleware: backend/src/middlewares/auth.ts — this is where session validation and user attachment to request happen.

- DB & migrations:

  - backend/src/config/db.ts and backend/src/utils/db.ts — modify to change connection or schema handling.

  - Always write database migrations for schema changes.

- File lifecycle:

  - Upload → metadata in DB → storage on disk/bucket.

  - Soft-delete: metadata flag set; periodic cleanup job permanently removes or archives files.

  - Implement scheduled tasks (cron or worker) to perform cleanup and backups.

Encryption at rest — recommended approach

- You can encrypt file bytes before writing:

  - Use a symmetric key from a secure vault (HashiCorp Vault, AWS KMS).

  - Encrypt per-file or per-user key (rotate keys carefully).

- Alternative: store files in cloud object storage with server-side encryption.

---

Environment variables & Docker (must-know)

Important env vars (from README.docker.md):

- Backend:

  - PORT (default 3000)

  - DB_HOST (postgres)

  - DB_NAME (claud)

  - DB_USER (claud)

  - DB_PASSWORD

  - DB_PORT (5432)

- Frontend:

  - VITE_API_URL (http://backend:3000)

- PostgreSQL container:

  - POSTGRES_USER

  - POSTGRES_PASSWORD

  - POSTGRES_DB

Tip: Use .env files for local development and Docker secrets or environment injection for production. Never commit .env with secrets.

---

Security checklist (do this before production)

- Use HTTPS everywhere; set cookies Secure and HttpOnly.

- Enforce CSRF protection if any non-GET state changing actions can be triggered cross-site (or rely on SameSite cookie policy).

- Validate and sanitize all user inputs (file names, folder paths).

- Use parameterized queries (docs claim this is done).

- Rotate secrets (DB passwords, cookie secrets) and store them in a vault.

- Implement rate limiting and abuse protection (especially for image generation).

- Keep dependency updates and vulnerability scans automated.

---

Monitoring & maintenance

- Backups: automated DB backups; store off‑site.

- Session cleanup: remove expired sessions from the DB on a schedule.

- Soft-deleted file cleanup: configure retention and schedule deletion.

- Logs: centralize logs (structured JSON), do not log secrets.

- Alerts: disk space, DB connection failures, high error rates, high image generation cost.

---

Troubleshooting — common issues & fixes

- Health check fails:

  - Check backend logs, ensure DB is reachable (DB_HOST, DB_USER, DB_PASSWORD).

- File upload fails:

  - Ensure upload directory exists and user permission for process to write (initUploadDir).

- Authentication fails:

  - Check cookie flags; for local env with HTTP, Secure cookies won't be sent; set Secure only for HTTPS.

- Image generation fails:

  - Validate Google cookie via POST /api/image/validate-cookie. If Google changes APIs or blocks requests, this feature will fail.

---

Contributing & commit guidelines

- Branch naming: create branch with your name (docs suggest).

- Commit message prefixes:

  - feat: for feature additions

  - fix: for bug fixes

  - docs: for documentation changes

- Follow code ownership and PR review processes.

---

Appendix: useful file paths (quick reference)

- docs/product.md — product overview & features

- docs/FILE_API.md — file upload/download API docs

- docs/IMAGE_GENERATION.md — image gen docs & cookie requirements

- backend/src/index.ts — app entry, router registration, initDatabase, initUploadDir

- backend/src/middlewares/auth.ts — authentication middleware

- backend/src/utils/cookie.ts — cookie helpers, cookie validation

- backend/src/utils/db.ts and backend/src/config/db.ts — DB config & helpers

- frontend/src/components/Navigation/Navigation.tsx — top navigation bar

- frontend/.env / README.docker.md — VITE_API_URL and Docker env vars

---

Final notes (direct, pragmatic)

- The repository's docs are thorough; they outline the desired features and architecture. But "documentation ≠ implementation." Before shipping, verify that all documented guarantees (encryption at rest, token expiry, per-user buckets) are actually implemented in backend code and database constraints.

- If you want to change how cookies or APIs behave, make the edits in backend/src/* (middleware, utils, routers), then update the frontend calls and docs. Test locally with Docker Compose to mirror production setup.

- For the ImageFX cookie flow: this is unusual and brittle. If you want a reliable product, plan a backend-first integration where the server holds credentials and mediates requests rather than asking users to paste third‑party cookies.`

            // Use Gemini API without streaming
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        system_instruction: {
                            parts: {
                                text: systemPrompt
                            }
                        },
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
