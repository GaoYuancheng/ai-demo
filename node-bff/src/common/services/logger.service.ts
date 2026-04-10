import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';

@Injectable()
export class LoggerService implements NestLoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    this.printMessage(message, 'LOG', context);
  }

  error(message: any, trace?: string, context?: string) {
    this.printMessage(message, 'ERROR', context);
    if (trace) {
      this.printMessage(trace, 'ERROR', context);
    }
  }

  warn(message: any, context?: string) {
    this.printMessage(message, 'WARN', context);
  }

  debug(message: any, context?: string) {
    this.printMessage(message, 'DEBUG', context);
  }

  verbose(message: any, context?: string) {
    this.printMessage(message, 'VERBOSE', context);
  }

  info(message: any, context?: string) {
    this.printMessage(message, 'INFO', context);
  }

  private printMessage(message: any, level: string, context?: string) {
    const timestamp = new Date().toISOString();
    const ctx = context || this.context || 'Application';
    console.log(`[${timestamp}] [${level}] [${ctx}] ${this.formatMessage(message)}`);
  }

  private formatMessage(message: any): string {
    if (typeof message === 'object') {
      return JSON.stringify(message, null, 2);
    }
    return String(message);
  }
}
