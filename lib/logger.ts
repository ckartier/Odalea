/**
 * Conditional logger utility
 * Only logs in development mode to avoid sensitive data leaks in production
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface LoggerOptions {
  prefix?: string;
  enabled?: boolean;
}

class Logger {
  private prefix: string;
  private enabled: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || '';
    this.enabled = options.enabled ?? __DEV__;
  }

  private formatMessage(message: string): string {
    return this.prefix ? `[${this.prefix}] ${message}` : message;
  }

  log(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(this.formatMessage(message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.info(this.formatMessage(message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.warn(this.formatMessage(message), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    // Errors are always logged for debugging critical issues
    console.error(this.formatMessage(message), ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.debug(this.formatMessage(message), ...args);
    }
  }
}

// Pre-configured loggers for different modules
export const storageLogger = new Logger({ prefix: 'Storage' });
export const authLogger = new Logger({ prefix: 'Auth' });
export const mapLogger = new Logger({ prefix: 'Map' });
export const messagingLogger = new Logger({ prefix: 'Messaging' });
export const firebaseLogger = new Logger({ prefix: 'Firebase' });

// Default logger
export const logger = new Logger();

// Helper to check if we should log
export const shouldLog = (): boolean => __DEV__;

export default Logger;
