/**
 * Logger - 统一日志系统
 * 提供分级日志输出，支持模块标识
 */
const Logger = (() => {
    const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
    let currentLevel = LOG_LEVELS.INFO;

    function _format(level, module, message) {
        const time = new Date().toISOString().substr(11, 12);
        return `[${time}] [${level}] [${module}] ${message}`;
    }

    return {
        setLevel(level) {
            if (LOG_LEVELS[level] !== undefined) {
                currentLevel = LOG_LEVELS[level];
            }
        },

        debug(module, message, ...args) {
            if (currentLevel <= LOG_LEVELS.DEBUG) {
                console.debug(_format('DEBUG', module, message), ...args);
            }
        },

        info(module, message, ...args) {
            if (currentLevel <= LOG_LEVELS.INFO) {
                console.info(_format('INFO', module, message), ...args);
            }
        },

        warn(module, message, ...args) {
            if (currentLevel <= LOG_LEVELS.WARN) {
                console.warn(_format('WARN', module, message), ...args);
            }
        },

        error(module, message, ...args) {
            if (currentLevel <= LOG_LEVELS.ERROR) {
                console.error(_format('ERROR', module, message), ...args);
            }
        }
    };
})();
