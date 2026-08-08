"use strict";
/* Minimal structured logger. Swap for pino/winston later without touching call sites. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
function emit(level, message, meta) {
    const entry = {
        level,
        time: new Date().toISOString(),
        message,
        ...(meta ? { meta } : {}),
    };
    const line = JSON.stringify(entry);
    if (level === 'error') {
        // eslint-disable-next-line no-console
        console.error(line);
    }
    else {
        // eslint-disable-next-line no-console
        console.log(line);
    }
}
exports.logger = {
    info: (message, meta) => emit('info', message, meta),
    warn: (message, meta) => emit('warn', message, meta),
    error: (message, meta) => emit('error', message, meta),
    debug: (message, meta) => {
        if (process.env.NODE_ENV !== 'production')
            emit('debug', message, meta);
    },
};
