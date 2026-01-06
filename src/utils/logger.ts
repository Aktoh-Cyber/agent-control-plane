/**
 * Centralized Logging System
 * Production-ready structured logging with Winston
 *
 * @module logger
 * @description Provides structured logging for the entire application
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.info('Message', { context: 'data' });
 *   logger.error('Error occurred', { error, userId: '123' });
 */

import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Log levels for the application
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

/**
 * Log context interface for structured logging
 */
export interface LogContext {
  [key: string]: unknown;
  userId?: string;
  agentId?: string;
  swarmId?: string;
  taskId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  duration?: number;
  error?: Error | unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableJson: boolean;
  logDirectory: string;
  maxFiles: number;
  maxSize: string;
}

/**
 * Environment-specific log level determination
 */
const getLogLevel = (): LogLevel => {
  const env = process.env.NODE_ENV || 'development';
  const configLevel = process.env.LOG_LEVEL as LogLevel;

  if (configLevel && Object.values(LogLevel).includes(configLevel)) {
    return configLevel;
  }

  switch (env) {
    case 'production':
      return LogLevel.INFO;
    case 'test':
      return LogLevel.ERROR;
    case 'development':
    default:
      return LogLevel.DEBUG;
  }
};

/**
 * Get log directory path
 */
const getLogDirectory = (): string => {
  return process.env.LOG_DIR || path.join(process.cwd(), 'logs');
};

/**
 * Default logger configuration
 */
const defaultConfig: LoggerConfig = {
  level: getLogLevel(),
  enableConsole: true,
  enableFile: process.env.NODE_ENV === 'production',
  enableJson: process.env.LOG_FORMAT === 'json',
  logDirectory: getLogDirectory(),
  maxFiles: 14, // 2 weeks
  maxSize: '20m',
};

/**
 * Custom format for development console output
 */
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      // Remove Symbol properties added by Winston
      const cleanMeta = Object.fromEntries(
        Object.entries(meta).filter(([key]) => !key.startsWith('Symbol'))
      );
      if (Object.keys(cleanMeta).length > 0) {
        metaStr = `\n${JSON.stringify(cleanMeta, null, 2)}`;
      }
    }
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

/**
 * JSON format for production logs
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create transports based on configuration
 */
const createTransports = (config: LoggerConfig): winston.transport[] => {
  const transports: winston.transport[] = [];

  // Console transport
  if (config.enableConsole) {
    transports.push(
      new winston.transports.Console({
        format: config.enableJson ? jsonFormat : devFormat,
      })
    );
  }

  // File transport for production
  if (config.enableFile) {
    // Combined logs
    transports.push(
      new winston.transports.File({
        filename: path.join(config.logDirectory, 'combined.log'),
        format: jsonFormat,
        maxsize: parseSize(config.maxSize),
        maxFiles: config.maxFiles,
        tailable: true,
      })
    );

    // Error logs
    transports.push(
      new winston.transports.File({
        filename: path.join(config.logDirectory, 'error.log'),
        level: 'error',
        format: jsonFormat,
        maxsize: parseSize(config.maxSize),
        maxFiles: config.maxFiles,
        tailable: true,
      })
    );

    // HTTP logs
    transports.push(
      new winston.transports.File({
        filename: path.join(config.logDirectory, 'http.log'),
        level: 'http',
        format: jsonFormat,
        maxsize: parseSize(config.maxSize),
        maxFiles: config.maxFiles,
        tailable: true,
      })
    );
  }

  return transports;
};

/**
 * Parse size string to bytes
 */
const parseSize = (size: string): number => {
  const match = size.match(/^(\d+)([kmg]?)$/i);
  if (!match) return 20 * 1024 * 1024; // Default 20MB

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'g':
      return value * 1024 * 1024 * 1024;
    case 'm':
      return value * 1024 * 1024;
    case 'k':
      return value * 1024;
    default:
      return value;
  }
};

/**
 * Create the Winston logger instance
 */
const createLogger = (config: LoggerConfig = defaultConfig): winston.Logger => {
  return winston.createLogger({
    level: config.level,
    levels: winston.config.npm.levels,
    transports: createTransports(config),
    exitOnError: false,
    silent: process.env.SILENT_LOGS === 'true',
  });
};

/**
 * Main logger instance
 */
export const logger = createLogger();

/**
 * Enhanced logger class with additional helper methods
 */
export class Logger {
  private logger: winston.Logger;
  private defaultContext: LogContext;

  constructor(defaultContext: LogContext = {}) {
    this.logger = logger;
    this.defaultContext = defaultContext;
  }

  /**
   * Merge default context with provided context
   */
  private mergeContext(context?: LogContext): LogContext {
    return { ...this.defaultContext, ...context };
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext): void {
    this.logger.error(message, this.mergeContext(context));
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, this.mergeContext(context));
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.logger.info(message, this.mergeContext(context));
  }

  /**
   * Log HTTP request/response
   */
  http(message: string, context?: LogContext): void {
    this.logger.http(message, this.mergeContext(context));
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, this.mergeContext(context));
  }

  /**
   * Log verbose message
   */
  verbose(message: string, context?: LogContext): void {
    this.logger.verbose(message, this.mergeContext(context));
  }

  /**
   * Create child logger with additional default context
   */
  child(context: LogContext): Logger {
    return new Logger(this.mergeContext(context));
  }

  /**
   * Log with custom level
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    this.logger.log(level, message, this.mergeContext(context));
  }

  /**
   * Time a function execution
   */
  async time<T>(label: string, fn: () => Promise<T>, context?: LogContext): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.info(`${label} completed`, {
        ...context,
        duration,
        status: 'success',
      });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`${label} failed`, {
        ...context,
        duration,
        error,
        status: 'error',
      });
      throw error;
    }
  }

  /**
   * Get the underlying Winston logger
   */
  getLogger(): winston.Logger {
    return this.logger;
  }
}

/**
 * Create a child logger with default context
 */
export const createChildLogger = (context: LogContext): Logger => {
  return new Logger(context);
};

/**
 * Helper to create component-specific loggers
 */
export const createComponentLogger = (component: string): Logger => {
  return new Logger({ component });
};

/**
 * Helper to create agent-specific loggers
 */
export const createAgentLogger = (agentId: string, swarmId?: string): Logger => {
  return new Logger({ agentId, swarmId, component: 'agent' });
};

/**
 * Helper to create swarm-specific loggers
 */
export const createSwarmLogger = (swarmId: string): Logger => {
  return new Logger({ swarmId, component: 'swarm' });
};

/**
 * Helper to create task-specific loggers
 */
export const createTaskLogger = (taskId: string): Logger => {
  return new Logger({ taskId, component: 'task' });
};

/**
 * Helper to create session-specific loggers
 */
export const createSessionLogger = (sessionId: string): Logger => {
  return new Logger({ sessionId, component: 'session' });
};

/**
 * Reconfigure logger at runtime
 */
export const reconfigureLogger = (config: Partial<LoggerConfig>): void => {
  const newConfig = { ...defaultConfig, ...config };
  logger.clear();
  createTransports(newConfig).forEach((transport) => {
    logger.add(transport);
  });
  logger.level = newConfig.level;
};

/**
 * Gracefully close all transports
 */
export const closeLogger = async (): Promise<void> => {
  return new Promise((resolve) => {
    logger.on('finish', resolve);
    logger.end();
  });
};

/**
 * Export default logger instance for convenience
 */
export default logger;
