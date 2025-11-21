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

// Monet color schemes - Android Material You inspired
export const colorSchemes: Record<ColorScheme, { primary: string; secondary: string; accent: string; name: string }> = {
  blue: {
    primary: '#1233c1',
    secondary: '#1cd9f1',
    accent: '#0b102b',
    name: 'Ocean Blue'
  },
  purple: {
    primary: '#7c3aed',
    secondary: '#a78bfa',
    accent: '#4c1d95',
    name: 'Royal Purple'
  },
  green: {
    primary: '#059669',
    secondary: '#34d399',
    accent: '#064e3b',
    name: 'Emerald Green'
  },
  red: {
    primary: '#dc2626',
    secondary: '#f87171',
    accent: '#991b1b',
    name: 'Crimson Red'
  },
  orange: {
    primary: '#ea580c',
    secondary: '#fb923c',
    accent: '#9a3412',
    name: 'Sunset Orange'
  },
  pink: {
    primary: '#db2777',
    secondary: '#f472b6',
    accent: '#9f1239',
    name: 'Rose Pink'
  },
  teal: {
    primary: '#0d9488',
    secondary: '#5eead4',
    accent: '#134e4a',
    name: 'Aqua Teal'
  },
  indigo: {
    primary: '#4f46e5',
    secondary: '#818cf8',
    accent: '#312e81',
    name: 'Deep Indigo'
  },
  amber: {
    primary: '#d97706',
    secondary: '#fbbf24',
    accent: '#78350f',
    name: 'Golden Amber'
  },
  cyan: {
    primary: '#0891b2',
    secondary: '#67e8f9',
    accent: '#164e63',
    name: 'Sky Cyan'
  }
}
