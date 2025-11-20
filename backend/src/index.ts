import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { initDatabase } from './utils/db'
import { initUploadDir } from './services/file'
import authRouter from './routes/auth'
import fileRouter from './routes/files'
import shareRouter from './routes/share'

const app = new Hono()

app.use(logger())
app.use(cors())

// Initialize database
initDatabase().catch((error) => {
  console.error('Failed to initialize database:', error)
  process.exit(1)
})

// Initialize upload directory
initUploadDir()

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// Auth routes
app.route('/api/auth', authRouter)

// File routes
app.route('/api/files', fileRouter)

// Share routes
app.route('/api', shareRouter)

// Root endpoint
app.get('/', (c) => {
  return c.text('Claud API Server')
})

const port = parseInt(process.env.PORT || '3000')
console.log(`Server is running on port ${port}`)

export default {
  port,
  fetch: app.fetch,
}
