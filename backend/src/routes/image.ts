import { Hono } from 'hono'
import { ImageFX, Prompt } from '@rohitaryal/imagefx-api'
import { getFromSession } from '../utils/db'
import { logger } from '../utils/logger'
import { saveFile } from '../services/file'
import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs'
import * as path from 'path'

const imageRouter = new Hono()

interface ImageGenerationRequest {
  prompt: string
  seed?: number
  numberOfImages?: number
  aspectRatio?: string
  generationModel?: string
  googleCookie?: string
}

/**
 * POST /image/generate
 * Generate images using ImageFX API
 */
imageRouter.post('/generate', async (c) => {
  try {
    const sessionCookie = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1]
    
    if (!sessionCookie) {
      return c.json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, 401)
    }

    // Validate session
    const decodedCookie = Buffer.from(sessionCookie, 'base64').toString('utf-8')
    const [sessionId] = decodedCookie.split(':')
    const sessionData = await getFromSession(sessionId)

    if (!sessionData) {
      return c.json({
        success: false,
        message: 'Invalid session',
        code: 'INVALID_SESSION'
      }, 401)
    }

    const body = await c.req.json() as ImageGenerationRequest
    const {
      prompt,
      seed = 0,
      numberOfImages = 1,
      aspectRatio = 'IMAGE_ASPECT_RATIO_SQUARE',
      generationModel = 'IMAGEN_3_5',
      googleCookie
    } = body

    if (!prompt || prompt.trim() === '') {
      return c.json({
        success: false,
        message: 'Prompt is required',
        code: 'PROMPT_REQUIRED'
      }, 400)
    }

    if (!googleCookie) {
      return c.json({
        success: false,
        message: 'Google cookie is required for image generation',
        code: 'GOOGLE_COOKIE_REQUIRED'
      }, 400)
    }

    // Validate numberOfImages
    if (numberOfImages < 1 || numberOfImages > 4) {
      return c.json({
        success: false,
        message: 'Number of images must be between 1 and 4',
        code: 'INVALID_NUMBER_OF_IMAGES'
      }, 400)
    }

    logger.info('Generating images', {
      prompt,
      seed,
      numberOfImages,
      aspectRatio,
      generationModel
    })

    try {
      // Initialize ImageFX with Google cookie
      const fx = new ImageFX(googleCookie)

      // Create prompt configuration
      const promptConfig = new Prompt({
        seed,
        numberOfImages,
        prompt: prompt.trim(),
        aspectRatio,
        generationModel
      })

      // Generate images
      const generatedImages = await fx.generateImage(promptConfig)

      // Process and save images
      const savedImages: Array<{
        imageId: string
        url: string
        mediaId: string
      }> = []

      for (const image of generatedImages) {
        // Create a temporary directory if it doesn't exist
        const tempDir = path.join(process.cwd(), '.temp-images')
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true })
        }

        // Save image temporarily
        const tempPath = image.save(tempDir)
        
        // Read the file as buffer
        const imageBuffer = fs.readFileSync(tempPath)
        
        // Create a File-like object for saveFile
        const imageId = uuidv4()
        const fileName = `generated-${Date.now()}-${imageId.slice(0, 8)}.png`
        
        // Save to our file storage system
        await saveFile(
          sessionData.user_uuid,
          imageBuffer,
          fileName,
          'image/png'
        )

        // Clean up temp file
        fs.unlinkSync(tempPath)

        savedImages.push({
          imageId,
          url: `/api/files/${imageId}`,
          mediaId: image.mediaId || ''
        })
      }

      // Clean up temp directory if empty
      const tempDir = path.join(process.cwd(), '.temp-images')
      if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
        fs.rmdirSync(tempDir)
      }

      logger.success('Images generated successfully', {
        count: savedImages.length,
        prompt
      })

      return c.json({
        success: true,
        message: 'Images generated successfully',
        images: savedImages,
        prompt,
        settings: {
          seed,
          numberOfImages,
          aspectRatio,
          generationModel
        }
      })
    } catch (error) {
      logger.error('ImageFX generation error', error)
      
      // Handle specific ImageFX errors
      if (error instanceof Error) {
        if (error.message.includes('cookie') || error.message.includes('auth')) {
          return c.json({
            success: false,
            message: 'Invalid or expired Google cookie. Please provide a valid cookie.',
            code: 'INVALID_GOOGLE_COOKIE'
          }, 401)
        }
      }

      return c.json({
        success: false,
        message: 'Failed to generate images. Please try again.',
        code: 'IMAGE_GENERATION_FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500)
    }
  } catch (error) {
    logger.error('Image generation endpoint error', error)
    return c.json({
      success: false,
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    }, 500)
  }
})

/**
 * GET /image/validate-cookie
 * Validate Google cookie for ImageFX
 */
imageRouter.post('/validate-cookie', async (c) => {
  try {
    const body = await c.req.json() as { googleCookie: string }
    const { googleCookie } = body

    if (!googleCookie) {
      return c.json({
        success: false,
        message: 'Google cookie is required',
        code: 'GOOGLE_COOKIE_REQUIRED'
      }, 400)
    }

    try {
      // Try to initialize ImageFX to validate cookie
      const fx = new ImageFX(googleCookie)
      // If we can create the instance without error, cookie is likely valid
      
      return c.json({
        success: true,
        message: 'Cookie is valid',
        valid: true
      })
    } catch (error) {
      logger.error('Cookie validation failed', error)
      return c.json({
        success: false,
        message: 'Invalid Google cookie',
        code: 'INVALID_GOOGLE_COOKIE',
        valid: false
      }, 401)
    }
  } catch (error) {
    logger.error('Cookie validation endpoint error', error)
    return c.json({
      success: false,
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    }, 500)
  }
})

export default imageRouter
