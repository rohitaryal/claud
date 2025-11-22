# Image Generation UI Design Documentation

## Overview
The Image Generation feature follows Material Design 3 principles with a clean, modern interface that seamlessly integrates with the existing Claud application design.

## UI Components

### 1. Sidebar Integration

**Location**: Left sidebar navigation
**New Element**: "Image Generation" tab

```
┌─────────────────────────┐
│  [+] New               │
├─────────────────────────┤
│  📁 My Files           │
│  ✨ Image Generation BETA│  ← New tab with animated badge
│  👥 Shared With Me     │
│  🕐 Recent             │
│  ⭐ Starred            │
│  🗑️ Trash              │
│  🌐 Public Pool        │
├─────────────────────────┤
│  Storage: 45%          │
│  ████▒▒▒▒▒▒ 2.3 GB     │
└─────────────────────────┘
```

**Features**:
- Sparkles icon (✨) for Image Generation
- Animated "BETA" badge with shimmer effect (blue gradient)
- Active state highlighting
- Smooth hover animations

### 2. Main Content Area

#### Header Section
```
┌───────────────────────────────────────────────────────┐
│  ✨ Image Generation                            BETA   │
│  Generate stunning images using AI-powered ImageFX    │
└───────────────────────────────────────────────────────┘
```

**Features**:
- Large sparkles icon
- Prominent title with animated BETA badge
- Descriptive subtitle

#### Cookie Input Section (First-time users)
```
┌───────────────────────────────────────────────────────┐
│  🔑 Google ImageFX Cookie Required                    │
│                                                        │
│  To use this feature, you need to provide your        │
│  Google cookie from ImageFX.                          │
│                                                        │
│  [Enter your Google cookie...]                        │
│                                                        │
│  Your cookie is stored locally and never shared       │
│  with anyone.                                          │
└───────────────────────────────────────────────────────┘
```

**Styling**:
- Card with blue left border
- Elevated shadow (elevation-2)
- Password-type input for security
- Helpful hint text in italic

#### Generation Interface
```
┌───────────────────────────────────────────────────────┐
│  Describe your image                    [⚙️ Settings] │
├───────────────────────────────────────────────────────┤
│  Settings Panel (Collapsible)                         │
│  ┌─────────────────────┬─────────────────────┐       │
│  │ Seed: [0____]       │ Number of Images:    │       │
│  │                     │ [▼ 1]                │       │
│  ├─────────────────────┼─────────────────────┤       │
│  │ Aspect Ratio:       │ Model:               │       │
│  │ [▼ Square (1:1)]    │ [▼ Imagen 3.5]       │       │
│  └─────────────────────┴─────────────────────┘       │
├───────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐ │
│  │ A beautiful sunset over mountains with a lake   │ │
│  │ in the foreground...                            │ │
│  │                                                 │ │
│  └─────────────────────────────────────────────────┘ │
│                                                        │
│         [✨ Generate Images] (Blue gradient)          │
└───────────────────────────────────────────────────────┘
```

**Features**:
- Collapsible settings panel with smooth slide-down animation
- Multi-line textarea with placeholder
- Enter key to generate (Shift+Enter for new line)
- Prominent gradient button
- Loading state with spinner animation
- Disabled state when not ready

#### Generated Images Display
```
┌───────────────────────────────────────────────────────┐
│  Generated Images                                      │
├───────────────────────────────────────────────────────┤
│  Prompt: "A beautiful sunset over mountains..."        │
│  [Imagen 3.5] [SQUARE]                                 │
│                                                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │         │  │         │  │         │  │         │ │
│  │  Image  │  │  Image  │  │  Image  │  │  Image  │ │
│  │    1    │  │    2    │  │    3    │  │    4    │ │
│  │         │  │         │  │         │  │         │ │
│  │  [⬇️]   │  │  [⬇️]   │  │  [⬇️]   │  │  [⬇️]   │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘ │
└───────────────────────────────────────────────────────┘
```

**Features**:
- Grid layout (responsive, adjusts to screen size)
- Image cards with elevation
- Hover overlay with download button
- Settings tags showing model and aspect ratio
- Original prompt displayed above each generation batch
- Smooth animations on hover

#### Empty State
```
┌───────────────────────────────────────────────────────┐
│                                                        │
│                      ✨ (large)                        │
│                                                        │
│           No images generated yet                      │
│                                                        │
│  Enter a prompt and click "Generate Images" to        │
│  create stunning AI-powered artwork                   │
│                                                        │
└───────────────────────────────────────────────────────┘
```

**Features**:
- Centered layout
- Large sparkles icon (faded)
- Encouraging message

## Color Scheme

### Primary Colors
- **Blue**: `#1233c1` (Primary brand color)
- **Blue Gradient**: `linear-gradient(135deg, #1233c1, #1cd9f1)`
- **Blue Light**: `#e1effd` (Hover states, backgrounds)

### Status Colors
- **Success**: Green tones (image upload success)
- **Error**: Red tones (validation errors)
- **Warning**: Orange tones (if needed)

### Neutrals
- **Background**: `#ffffff` (Light mode) / `#121212` (Dark mode)
- **Card Background**: `#ffffff` (Light) / `#1e1e1e` (Dark)
- **Text Primary**: `#1d1f22` (Light) / `rgba(255,255,255,0.87)` (Dark)
- **Text Secondary**: `#666` (Light) / `rgba(255,255,255,0.6)` (Dark)
- **Border**: `#e5e5e5` (Light) / `rgba(255,255,255,0.12)` (Dark)

## Animations

### Beta Badge Shimmer
```
@keyframes shimmer {
    0%, 100% {
        box-shadow: 0 0 10px rgba(18, 51, 193, 0.3);
    }
    50% {
        box-shadow: 0 0 20px rgba(18, 51, 193, 0.6),
                    0 0 30px rgba(28, 217, 241, 0.4);
    }
}
Duration: 2s infinite
```

### Settings Panel Slide
```
@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
Duration: 0.3s ease
```

### Button Hover
- Transform: `translateY(-2px)`
- Shadow elevation increase
- Smooth transition: `0.2s cubic-bezier(0.4, 0, 0.2, 1)`

### Image Card Hover
- Transform: `translateY(-4px)`
- Shadow elevation increase
- Overlay fade in: `opacity: 0 → 1`

## Spacing & Typography

### Font Family
- Primary: "Poppins", sans-serif
- Weights: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

### Border Radius
- Small: `8px` (buttons, tags)
- Medium: `12px` (cards, inputs)
- Large: `16px` (main content cards)
- Extra Large: `24px` (modals)

### Elevation Shadows
- Level 1: `0 1px 2px rgba(0, 0, 0, 0.05)`
- Level 2: `0 2px 4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)`
- Level 3: `0 4px 8px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)`
- Level 4: `0 8px 16px rgba(0, 0, 0, 0.10), 0 4px 8px rgba(0, 0, 0, 0.08)`

## Responsive Design

### Breakpoint: 768px

**Mobile View Changes**:
- Sidebar: Hidden by default (drawer)
- Main content: Full width, reduced padding
- Settings: Single column layout
- Image grid: Single column
- Result header: Stacked layout

## Interactions

### Keyboard Shortcuts
- **Enter**: Generate images (in prompt textarea)
- **Shift+Enter**: New line in prompt
- **Escape**: Close settings panel (if implemented)

### Mouse Interactions
- **Hover**: Smooth transitions on all interactive elements
- **Click**: Immediate visual feedback
- **Download**: Direct file download without page navigation

## Accessibility

- Semantic HTML elements
- Proper ARIA labels where needed
- Keyboard navigation support
- Focus indicators
- High contrast ratios (WCAG AA compliant)
- Screen reader friendly

## Performance

- CSS animations use GPU-accelerated properties (transform, opacity)
- Images lazy-loaded where applicable
- Optimized bundle size
- Smooth 60fps animations
