# Image Generation Feature

This document describes the Image Generation feature added to the Claud application, which allows users to generate AI-powered images using Google's ImageFX API.

## Overview

The Image Generation feature integrates the `@rohitaryal/imagefx-api` package to provide users with the ability to generate high-quality images using Google's Imagen 3 and Imagen 3.5 models.

## Features

- **AI-Powered Image Generation**: Generate images using state-of-the-art AI models
- **Multiple Customization Options**:
  - Seed control for reproducible results
  - Number of images (1-4 per generation)
  - Aspect ratios: Square (1:1), Portrait (9:16), Landscape (16:9)
  - Model selection: Imagen 3 or Imagen 3.5
- **Integrated Storage**: Generated images are automatically saved to the user's file storage
- **Download Functionality**: Easy download of generated images
- **Material Design 3 UI**: Beautiful, modern interface following Material Design 3 principles
- **Beta Badge**: Animated shining beta badge in the sidebar

## Technical Implementation

### Backend

#### Dependencies
- `@rohitaryal/imagefx-api`: Core library for image generation

#### Endpoints

1. **POST /api/image/generate**
   - Generates images based on user prompt and settings
   - Requires authentication via session cookie
   - Requires valid Google ImageFX cookie
   - Parameters:
     - `prompt` (required): Text description of the desired image
     - `seed` (optional): Seed for reproducibility (default: 0)
     - `numberOfImages` (optional): Number of images to generate (1-4, default: 1)
     - `aspectRatio` (optional): Aspect ratio (default: IMAGE_ASPECT_RATIO_SQUARE)
     - `generationModel` (optional): Model to use (default: IMAGEN_3_5)
     - `googleCookie` (required): Valid Google cookie for ImageFX access

2. **POST /api/image/validate-cookie**
   - Validates a Google cookie for ImageFX
   - Parameters:
     - `googleCookie` (required): Google cookie to validate

#### File Storage
Generated images are:
1. Temporarily saved to `.temp-images` directory
2. Converted to File objects
3. Saved to user's storage via the existing `saveFile` function
4. Cleaned up from temporary storage
5. Made available via standard file endpoints

### Frontend

#### New Components

1. **ImageGeneration Page** (`/frontend/src/pages/ImageGeneration/`)
   - Main interface for image generation
   - Features:
     - Cookie input section (with local storage)
     - Prompt textarea with keyboard shortcuts (Enter to generate)
     - Collapsible settings panel
     - Generated images grid with download buttons
     - Empty state for first-time users
     - Loading states and error handling

2. **Sidebar Updates**
   - Added "Image Generation" tab with sparkles icon
   - Animated "BETA" badge with shimmer effect
   - Route integration

#### Styling
All styling follows Material Design 3 principles:
- Smooth transitions and animations
- Consistent border radius values
- Elevation shadows
- Color palette matching the existing theme
- Responsive design for mobile devices

#### API Integration
New API functions in `utils/api.ts`:
- `apiGenerateImage()`: Sends image generation requests
- `apiValidateGoogleCookie()`: Validates Google cookies

## Usage

### For Users

1. **Navigate to Image Generation**
   - Click on "Image Generation" in the left sidebar (with BETA badge)

2. **Enter Google Cookie** (first time only)
   - Provide your Google ImageFX cookie
   - Cookie is stored locally for convenience

3. **Enter Prompt**
   - Type a description of the image you want to generate
   - Press Enter or click "Generate Images"

4. **Customize Settings** (optional)
   - Click "Settings" to expand customization options
   - Adjust seed, number of images, aspect ratio, and model

5. **View and Download**
   - Generated images appear below in a grid
   - Hover over images to see download button
   - Click download to save to your device

### For Developers

#### Getting a Google Cookie

To use this feature, users need a valid Google cookie from ImageFX:

1. Visit [ImageFX](https://aitestkitchen.withgoogle.com/tools/image-fx)
2. Sign in with your Google account
3. Open browser Developer Tools (F12)
4. Go to Application/Storage → Cookies
5. Copy the cookie value
6. Paste in the Image Generation page

#### Testing Locally

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

#### Configuration

Environment variables (optional):
- `VITE_API_URL`: API base URL (default: http://localhost:3000)

## Security Considerations

1. **Cookie Storage**: Google cookies are stored in localStorage (client-side only)
2. **Authentication**: All endpoints require valid session authentication
3. **Validation**: Input validation for all parameters
4. **Error Handling**: Graceful error handling for invalid cookies or failed generations
5. **File Size**: Generated images are subject to the same file size limits as regular uploads

## Future Enhancements

Potential improvements for future versions:
- Batch generation history
- Image editing capabilities
- Style presets
- Prompt suggestions
- Share generated images
- Gallery view for all generated images

## Dependencies

### Backend
- `@rohitaryal/imagefx-api`: ^latest

### Frontend
- Existing React dependencies
- `react-icons` for UI icons

## Browser Compatibility

The feature works on all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Troubleshooting

### Common Issues

1. **"Google cookie is required" error**
   - Ensure you've entered a valid Google cookie
   - Cookie may have expired; get a new one

2. **"Failed to generate images" error**
   - Check internet connection
   - Verify Google cookie is still valid
   - Try again with a different prompt

3. **Images not displaying**
   - Check browser console for errors
   - Verify backend is running
   - Check file storage permissions

## License

This feature is part of the Claud project and follows the same license.
