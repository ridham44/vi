const winston = require('winston');
const path = require('path');
//* Using this package to daily create new log files.
require('winston-daily-rotate-file');

const { combine, timestamp, align, printf } = winston.format;

const errorFilter = winston.format((info, opts) => {
    return info.level === 'error' ? info : false;
});

const infoFilter = winston.format((info, opts) => {
    return info.level === 'info' ? info : false;
});
const errorLogger = new winston.transports.DailyRotateFile({
    level: 'error',
    filename: 'app-error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    dirname: path.join(process.cwd(), 'logs', '%DATE%', 'access-logs'),
    zippedArchive: true,
    maxFiles: '60d',
    format: combine(
        errorFilter(),
        timestamp({ format: 'DD-MMM-YYYY HH:mm:ss' }),
        align(),
        printf((info) => `${info.level}: ${[info.timestamp]}: ${info.message}\n`)
    ),
});

const infoLogger = new winston.transports.DailyRotateFile({
    level: 'info',
    filename: 'app-info-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    // dirname: './access-logs',
    dirname: path.join(process.cwd(), 'logs', '%DATE%', 'access-logs'),
    zippedArchive: true,
    maxFiles: '60d',
    format: combine(
        infoFilter(),
        timestamp({ format: 'DD-MMM-YYYY HH:mm:ss' }),
        align(),
        printf((info) => `${info.level}: ${[info.timestamp]}: ${info.message}\n`)
    ),
});
exports.logger = winston.createLogger({
    transports: [errorLogger, infoLogger],
});
