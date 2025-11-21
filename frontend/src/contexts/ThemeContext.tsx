import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'
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

interface ThemeContextType {
  theme: ThemeMode
  colorScheme: ColorScheme
  effectiveTheme: 'light' | 'dark'
  setTheme: (theme: ThemeMode) => void
  setColorScheme: (scheme: ColorScheme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Monet color schemes - Android Material You inspired
const colorSchemes: Record<ColorScheme, { primary: string; secondary: string; accent: string; name: string }> = {
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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme')
    return (saved as ThemeMode) || 'system'
  })

  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    const saved = localStorage.getItem('colorScheme')
    return (saved as ColorScheme) || 'blue'
  })

  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  })

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const savedColorScheme = localStorage.getItem('colorScheme')
    
    if (savedTheme) {
      setThemeState(savedTheme as ThemeMode)
    }
    if (savedColorScheme) {
      setColorSchemeState(savedColorScheme as ColorScheme)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('theme', theme)
    localStorage.setItem('colorScheme', colorScheme)

    // Update effective theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const updateTheme = (e: MediaQueryListEvent) => {
        setEffectiveTheme(e.matches ? 'dark' : 'light')
      }
      setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light')
      mediaQuery.addEventListener('change', updateTheme)
      return () => mediaQuery.removeEventListener('change', updateTheme)
    } else {
      setEffectiveTheme(theme)
    }
  }, [theme])

  useEffect(() => {
    // Apply color scheme CSS variables
    const scheme = colorSchemes[colorScheme]
    document.documentElement.style.setProperty('--color-primary', scheme.primary)
    document.documentElement.style.setProperty('--color-secondary', scheme.secondary)
    document.documentElement.style.setProperty('--color-accent', scheme.accent)
    
    // Update existing CSS variables that use the color
    document.documentElement.style.setProperty('--blue', scheme.primary)
    document.documentElement.style.setProperty('--blue-dark', scheme.accent)
    document.documentElement.style.setProperty('--blue-light', `${scheme.secondary}20`)
    
    // Update gradient
    document.documentElement.style.setProperty(
      '--blue-gradient',
      `linear-gradient(to right, ${scheme.primary}, ${scheme.secondary})`
    )
  }, [colorScheme])

  useEffect(() => {
    // Apply theme class to document
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(effectiveTheme)
  }, [effectiveTheme])

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
  }

  const setColorScheme = (newScheme: ColorScheme) => {
    setColorSchemeState(newScheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, effectiveTheme, setTheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export { colorSchemes }

