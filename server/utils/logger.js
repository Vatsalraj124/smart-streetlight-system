import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create a write stream for access logs
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

const logger = {
  // Development logger
  dev: morgan('dev'),
  
  // Production logger
  combined: morgan('combined', { stream: accessLogStream }),
  
  // Custom format
  custom: (tokens, req, res) => {
    return [
      tokens.date(req, res, 'iso'),
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens['response-time'](req, res), 'ms',
      tokens['remote-addr'](req, res)
    ].join(' ');
  }
};

export default logger;