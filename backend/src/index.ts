import { Hono } from 'hono'
import { logger as honoLogger } from 'hono/logger'
import { cors } from 'hono/cors'
import { initDatabase } from './utils/db'
import { initUploadDir } from './services/file'
import { logger } from './utils/logger'
import authRouter from './routes/auth'
import fileRouter from './routes/files'
import shareRouter from './routes/share'
import imageRouter from './routes/image'

const app = new Hono()

app.use(honoLogger())
app.use('*', cors({
  origin: (origin) => {
    // For credentials to work, we must return the specific origin, not '*'
    // Allow all origins for development - return the origin if provided
    if (origin) {
      return origin
    }
    // For same-origin requests (no origin header), allow
    // In production, specify exact allowed origins
    return 'http://localhost:5173'
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposeHeaders: ['Content-Type', 'Set-Cookie'],
}))

// Initialize database
initDatabase().catch((error) => {
  logger.error('Failed to initialize database', error)
  process.exit(1)
})

// Initialize upload directory
initUploadDir()
logger.success('Upload directory initialized')

// Health check endpoint
app.get('/api/health', (c) => {
  logger.info('Health check requested')
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// Auth routes
app.route('/api/auth', authRouter)

// File routes
app.route('/api/files', fileRouter)

// Share routes
app.route('/api', shareRouter)

// Image generation routes
app.route('/api/image', imageRouter)

// Root endpoint
app.get('/', (c) => {
  return c.text('Claud API Server')
})

const port = parseInt(process.env.PORT || '3000')
logger.success(`Server is running on port ${port}`)
logger.info('API endpoints registered', {
  auth: '/api/auth',
  files: '/api/files',
  shares: '/api/share',
  image: '/api/image'
})

export default {
  port,
  fetch: app.fetch,
}
