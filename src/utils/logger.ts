import { createLogger, format, transports } from "winston";

const logger = createLogger({
    level: "info",
    format: format.combine(
        format.colorize(),
        format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }),
        format.errors({ stack: true }),
        format.splat(),
        format.printf(({ timestamp, level, message }) => {
            return `${timestamp} | [${level}] | ${message}`;
        })
    ),
    defaultMeta: { service: "your-service-name" },
    transports: [
        new transports.Console()
    ],
});

export default logger;