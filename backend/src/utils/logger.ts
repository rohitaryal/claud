/**
 * Styled console logger utility
 */

type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'debug'

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
  }
}

export function log(level: LogLevel, message: string, ...args: any[]) {
  const style = styles[level]
  const timestamp = new Date().toISOString()
  
  console.log(
    `%c${style.icon} [${timestamp}] ${message.toUpperCase()}`,
    `background-color: ${style.background}; color: ${style.color}; padding: 4px 8px; border-radius: 4px; font-weight: bold;`,
    ...args
  )
}

export const logger = {
  info: (message: string, ...args: any[]) => log('info', message, ...args),
  success: (message: string, ...args: any[]) => log('success', message, ...args),
  warn: (message: string, ...args: any[]) => log('warn', message, ...args),
  error: (message: string, ...args: any[]) => log('error', message, ...args),
  debug: (message: string, ...args: any[]) => log('debug', message, ...args),
}

