export type ColorScheme = 
  | 'blue' 
  | 'purple' 
  | 'green' 
  | 'red' 
  | 'orange' 
  | 'pink' 
  | 'teal' 
  | 'indigo' 
  | 'amber' 
  | 'cyan'

// Material You Dynamic Color 2.0 palette system
// Each scheme includes:
// - primary: Main brand color
// - secondary: Supporting accent color
// - tertiary: Complementary accent
// - neutral: Background tones
// - accent: High-contrast accent
export const colorSchemes: Record<ColorScheme, { 
  primary: string
  secondary: string
  tertiary: string
  neutral: string
  accent: string
  name: string
  description: string
}> = {
  blue: {
    primary: '#1233c1',      // Muted warm slate base
    secondary: '#67B7DC',    // Soft sky blue
    tertiary: '#5BA5A6',     // Soft olive secondary
    neutral: '#F5F5DC',      // Pale cream neutral
    accent: '#FF6B6B',       // Vibrant coral accent
    name: 'Ocean Blue',
    description: 'Muted warm-slate base with vibrant coral accent'
  },
  purple: {
    primary: '#7c3aed',      // Deep purple
    secondary: '#c084fc',    // Lavender
    tertiary: '#8b5cf6',     // Medium purple
    neutral: '#f3f4f6',      // Light gray
    accent: '#fbbf24',       // Vibrant amber
    name: 'Royal Purple',
    description: 'Rich purple tones with golden amber highlights'
  },
  green: {
    primary: '#059669',      // Emerald
    secondary: '#6ee7b7',    // Mint green
    tertiary: '#10b981',     // Green
    neutral: '#f0fdf4',      // Very light green
    accent: '#f59e0b',       // Vibrant orange
    name: 'Emerald Green',
    description: 'Natural green palette with warm orange accents'
  },
  red: {
    primary: '#dc2626',      // Crimson
    secondary: '#fca5a5',    // Light red
    tertiary: '#ef4444',     // Red
    neutral: '#fef2f2',      // Very light pink
    accent: '#3b82f6',       // Vibrant blue
    name: 'Crimson Red',
    description: 'Bold crimson with cool blue contrast'
  },
  orange: {
    primary: '#ea580c',      // Sunset orange
    secondary: '#fdba74',    // Peach
    tertiary: '#f97316',     // Orange
    neutral: '#fff7ed',      // Very light orange
    accent: '#8b5cf6',       // Vibrant purple
    name: 'Sunset Orange',
    description: 'Warm sunset hues with purple accents'
  },
  pink: {
    primary: '#db2777',      // Rose pink
    secondary: '#f9a8d4',    // Light pink
    tertiary: '#ec4899',     // Pink
    neutral: '#fdf2f8',      // Very light pink
    accent: '#10b981',       // Vibrant green
    name: 'Rose Pink',
    description: 'Romantic rose tones with fresh green highlights'
  },
  teal: {
    primary: '#0d9488',      // Teal
    secondary: '#5eead4',    // Aqua
    tertiary: '#14b8a6',     // Teal
    neutral: '#f0fdfa',      // Very light teal
    accent: '#f472b6',       // Vibrant pink
    name: 'Aqua Teal',
    description: 'Cool aquatic tones with playful pink accents'
  },
  indigo: {
    primary: '#4f46e5',      // Deep indigo
    secondary: '#a5b4fc',    // Light indigo
    tertiary: '#6366f1',     // Indigo
    neutral: '#eef2ff',      // Very light indigo
    accent: '#fb923c',       // Vibrant orange
    name: 'Deep Indigo',
    description: 'Professional indigo with energetic orange highlights'
  },
  amber: {
    primary: '#d97706',      // Golden amber
    secondary: '#fcd34d',    // Light yellow
    tertiary: '#f59e0b',     // Amber
    neutral: '#fffbeb',      // Very light yellow
    accent: '#8b5cf6',       // Vibrant purple
    name: 'Golden Amber',
    description: 'Warm golden tones with regal purple accents'
  },
  cyan: {
    primary: '#0891b2',      // Sky cyan
    secondary: '#67e8f9',    // Light cyan
    tertiary: '#06b6d4',     // Cyan
    neutral: '#ecfeff',      // Very light cyan
    accent: '#f43f5e',       // Vibrant rose
    name: 'Sky Cyan',
    description: 'Bright sky tones with vibrant rose highlights'
  }
}
