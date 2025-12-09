/**
 * Logging Service
 *
 * Centralized logging for the application with environment-aware output.
 * In development: logs to console
 * In production: can be extended to send to error tracking service (Sentry, etc.)
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  siteId?: string;
  itemId?: string;
  [key: string]: any;
}

class LoggingService {
  private isDevelopment = __DEV__;

  /**
   * Log debug information (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error messages and exceptions
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = {
      ...context,
      errorMessage: error?.message,
      errorStack: error?.stack,
    };
    this.log(LogLevel.ERROR, message, errorContext);

    // In production, send to error tracking service
    if (!this.isDevelopment && error) {
      // TODO: Send to Sentry, Firebase Crashlytics, etc.
      // Example: Sentry.captureException(error);
    }
  }

  /**
   * Core logging function
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const contextString = context ? ` | ${JSON.stringify(context)}` : '';
    const logMessage = `[${timestamp}] [${level}] ${message}${contextString}`;

    // In development, use console with appropriate level
    if (this.isDevelopment) {
      switch (level) {
        case LogLevel.DEBUG:
          console.log(`🔍 ${logMessage}`);
          break;
        case LogLevel.INFO:
          console.log(`ℹ️ ${logMessage}`);
          break;
        case LogLevel.WARN:
          console.warn(`⚠️ ${logMessage}`);
          break;
        case LogLevel.ERROR:
          console.error(`❌ ${logMessage}`);
          break;
      }
    } else {
      // In production, only log errors and warnings
      if (level === LogLevel.ERROR || level === LogLevel.WARN) {
        console.log(logMessage); // Native logging for production
      }
    }
  }

  /**
   * Log performance metrics
   */
  performance(action: string, duration: number, context?: LogContext): void {
    this.info(`Performance: ${action} completed in ${duration}ms`, {
      ...context,
      duration,
      action,
    });
  }

  /**
   * Log user actions for analytics
   */
  userAction(action: string, context?: LogContext): void {
    this.info(`User Action: ${action}`, {
      ...context,
      action,
      type: 'user_action',
    });
  }

  /**
   * Log database operations
   */
  database(operation: string, table: string, context?: LogContext): void {
    this.debug(`Database: ${operation} on ${table}`, {
      ...context,
      operation,
      table,
      type: 'database',
    });
  }

  /**
   * Log network requests
   */
  network(method: string, url: string, statusCode?: number, context?: LogContext): void {
    const level = statusCode && statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `Network: ${method} ${url} ${statusCode ? `(${statusCode})` : ''}`;

    if (level === LogLevel.ERROR) {
      this.error(message, undefined, { ...context, method, url, statusCode, type: 'network' });
    } else {
      this.info(message, { ...context, method, url, statusCode, type: 'network' });
    }
  }
}

// Export singleton instance
export const logger = new LoggingService();

// Export for testing
export default LoggingService;
