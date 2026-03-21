/**
 * EventBus - 全局事件总线
 * 模块间解耦通信
 */
const EventBus = (() => {
    const listeners = new Map();

    return {
        on(event, callback) {
            if (!listeners.has(event)) {
                listeners.set(event, new Set());
            }
            listeners.get(event).add(callback);
            return () => this.off(event, callback);
        },

        off(event, callback) {
            const set = listeners.get(event);
            if (set) {
                set.delete(callback);
                if (set.size === 0) listeners.delete(event);
            }
        },

        emit(event, data) {
            const set = listeners.get(event);
            if (set) {
                set.forEach(cb => {
                    try {
                        cb(data);
                    } catch (err) {
                        Logger.error('EventBus', `Error in handler for "${event}": ${err.message}`);
                    }
                });
            }
        },

        once(event, callback) {
            const wrapper = (data) => {
                this.off(event, wrapper);
                callback(data);
            };
            this.on(event, wrapper);
        },

        clear() {
            listeners.clear();
        }
    };
})();
