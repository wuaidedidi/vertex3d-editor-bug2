/**
 * Toast - 消息通知组件
 * 替代原生alert，提供友好的用户反馈
 */
const Toast = (() => {
    const container = document.getElementById('toast-container');
    const recentMessages = new Set();
    const DEDUP_INTERVAL = 2000;

    const ICONS = {
        info: '<svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="9" y1="8" x2="9" y2="13" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="5.5" r="1" fill="currentColor"/></svg>',
        success: '<svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 9l2.5 2.5 4.5-5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
        warning: '<svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 2L1 16h16L9 2z" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="9" y1="7" x2="9" y2="11" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="13.5" r="0.8" fill="currentColor"/></svg>',
        error: '<svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="6" y1="6" x2="12" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="6" x2="6" y2="12" stroke="currentColor" stroke-width="1.5"/></svg>'
    };

    function show(message, type = 'info', duration = 3000) {
        if (!container) return;
        if (recentMessages.has(message)) return;

        recentMessages.add(message);
        setTimeout(() => recentMessages.delete(message), DEDUP_INTERVAL);

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${ICONS[type] || ICONS.info}</span>
            <span class="toast-message">${_escapeHtml(message)}</span>
            <span class="toast-close" role="button" aria-label="关闭">&times;</span>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => _remove(toast));

        container.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => _remove(toast), duration);
        }

        Logger.debug('Toast', `${type}: ${message}`);
        return toast;
    }

    function _remove(toast) {
        if (!toast || !toast.parentNode) return;
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 250);
    }

    function _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return {
        info: (msg, dur) => show(msg, 'info', dur),
        success: (msg, dur) => show(msg, 'success', dur),
        warning: (msg, dur) => show(msg, 'warning', dur),
        error: (msg, dur) => show(msg, 'error', dur)
    };
})();
