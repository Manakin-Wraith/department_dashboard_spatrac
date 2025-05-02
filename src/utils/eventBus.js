const listeners = {};

export const bus = {
  on(event, handler) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);
  },
  off(event, handler) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(h => h !== handler);
  },
  emit(event, payload) {
    (listeners[event] || []).forEach(h => h(payload));
  },
};
