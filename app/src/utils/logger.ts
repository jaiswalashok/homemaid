/**
 * Centralized logging utility for HomeHelp app
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  tag: string;
  message: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private log(level: LogLevel, tag: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      tag,
      message,
      data,
    };

    // Add to memory logs
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with formatting
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${tag}]`;
    
    switch (level) {
      case 'debug':
        console.debug(prefix, message, data || '');
        break;
      case 'info':
        console.info(prefix, message, data || '');
        break;
      case 'warn':
        console.warn(prefix, message, data || '');
        break;
      case 'error':
        console.error(prefix, message, data || '');
        break;
    }
  }

  debug(tag: string, message: string, data?: any) {
    this.log('debug', tag, message, data);
  }

  info(tag: string, message: string, data?: any) {
    this.log('info', tag, message, data);
  }

  warn(tag: string, message: string, data?: any) {
    this.log('warn', tag, message, data);
  }

  error(tag: string, message: string, data?: any) {
    this.log('error', tag, message, data);
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    this.info('Logger', 'Logs cleared');
  }

  // Export logs as string for sharing
  exportLogs(): string {
    return this.logs
      .map(entry => `${entry.timestamp} [${entry.level.toUpperCase()}] [${entry.tag}] ${entry.message} ${entry.data ? JSON.stringify(entry.data) : ''}`)
      .join('\n');
  }
}

// Create singleton instance
const logger = new Logger();

// Convenience functions for different modules
export const logFirebase = {
  debug: (message: string, data?: any) => logger.debug('Firebase', message, data),
  info: (message: string, data?: any) => logger.info('Firebase', message, data),
  warn: (message: string, data?: any) => logger.warn('Firebase', message, data),
  error: (message: string, data?: any) => logger.error('Firebase', message, data),
};

export const logAuth = {
  debug: (message: string, data?: any) => logger.debug('Auth', message, data),
  info: (message: string, data?: any) => logger.info('Auth', message, data),
  warn: (message: string, data?: any) => logger.warn('Auth', message, data),
  error: (message: string, data?: any) => logger.error('Auth', message, data),
};

export const logAPI = {
  debug: (message: string, data?: any) => logger.debug('API', message, data),
  info: (message: string, data?: any) => logger.info('API', message, data),
  warn: (message: string, data?: any) => logger.warn('API', message, data),
  error: (message: string, data?: any) => logger.error('API', message, data),
};

export const logTasks = {
  debug: (message: string, data?: any) => logger.debug('Tasks', message, data),
  info: (message: string, data?: any) => logger.info('Tasks', message, data),
  warn: (message: string, data?: any) => logger.warn('Tasks', message, data),
  error: (message: string, data?: any) => logger.error('Tasks', message, data),
};

export const logApp = {
  debug: (message: string, data?: any) => logger.debug('App', message, data),
  info: (message: string, data?: any) => logger.info('App', message, data),
  warn: (message: string, data?: any) => logger.warn('App', message, data),
  error: (message: string, data?: any) => logger.error('App', message, data),
};

export const logScreen = (screenName: string) => ({
  debug: (message: string, data?: any) => logger.debug(screenName, message, data),
  info: (message: string, data?: any) => logger.info(screenName, message, data),
  warn: (message: string, data?: any) => logger.warn(screenName, message, data),
  error: (message: string, data?: any) => logger.error(screenName, message, data),
});

export default logger;
