import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { colorSchemes, type ColorScheme } from './colorSchemes'

export type ThemeMode = 'system' | 'light' | 'dark'
export type { ColorScheme }

interface ThemeContextType {
  theme: ThemeMode
  colorScheme: ColorScheme
  effectiveTheme: 'light' | 'dark'
  setTheme: (theme: ThemeMode) => void
  setColorScheme: (scheme: ColorScheme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

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
    localStorage.setItem('colorScheme', colorScheme)
  }, [colorScheme])

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

