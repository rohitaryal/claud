import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
const app = new Hono()
app.use(logger())
app.use(cors())
app.get('/', c => {
    return c.text('Hello Hono!')
})
app.get('/api/health', c => {
    return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
})
const port = parseInt(process.env.PORT || '3000')
console.log(`Server is running on port ${port}`)
export default {
    port,
    fetch: app.fetch,
}
