import winston from 'winston'

const createLogger = (service) => {
    return winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
        ),
        defaultMeta: { service },
        transports: [
            // Service-specific log file
            new winston.transports.File({ 
                filename: `logs/${service}.log`,
                level: 'info'
            }),
            // Error log (all services)
            new winston.transports.File({ 
                filename: 'logs/error.log', 
                level: 'error' 
            }),
            // Console in development
            ...(process.env.NODE_ENV !== 'production' ? [
                new winston.transports.Console({
                format: winston.format.simple()
                })
            ] : [])
        ]
    })
}

export const appLogger = createLogger('app');
export const authLogger = createLogger('auth');
export const userLogger = createLogger('users');
export const groupLogger = createLogger('groups');
export const itemLogger = createLogger('items');
export const invitationLogger = createLogger('invitations');