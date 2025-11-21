/**
 * Styled console logger utility for frontend
 */

type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'debug' | 'api'

interface LogStyle {
  background: string
  color: string
  icon: string
}

const styles: Record<LogLevel, LogStyle> = {
  info: {
    background: '#2196F3',
    color: '#ffffff',
    icon: 'ℹ️'
  },
  success: {
    background: '#4CAF50',
    color: '#ffffff',
    icon: '✅'
  },
  warn: {
    background: '#FF9800',
    color: '#ffffff',
    icon: '⚠️'
  },
  error: {
    background: '#F44336',
    color: '#ffffff',
    icon: '❌'
  },
  debug: {
    background: '#9E9E9E',
    color: '#ffffff',
    icon: '🔍'
  },
  api: {
    background: '#9C27B0',
    color: '#ffffff',
    icon: '🌐'
  }
}

export function log(level: LogLevel, message: string, ...args: unknown[]) {
  const style = styles[level]
  const timestamp = new Date().toLocaleTimeString()
  
  console.log(
    `%c${style.icon} [${timestamp}] ${message}`,
    `background-color: ${style.background}; color: ${style.color}; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;`,
    ...args
  )
}

export const logger = {
  info: (message: string, ...args: unknown[]) => log('info', message, ...args),
  success: (message: string, ...args: unknown[]) => log('success', message, ...args),
  warn: (message: string, ...args: unknown[]) => log('warn', message, ...args),
  error: (message: string, ...args: unknown[]) => log('error', message, ...args),
  debug: (message: string, ...args: unknown[]) => log('debug', message, ...args),
  api: (message: string, ...args: unknown[]) => log('api', message, ...args),
}

