function hasNativeBridge() {
  return typeof window !== 'undefined' && typeof window.PendantNativeBridge !== 'undefined';
}

export function callNativeJson(methodName, payload = {}) {
  if (!hasNativeBridge()) return null;
  const bridge = window.PendantNativeBridge;
  const method = bridge?.[methodName];
  if (typeof method !== 'function') return null;

  try {
    const raw = method.call(bridge, JSON.stringify(payload));
    if (typeof raw !== 'string' || raw.trim().length === 0) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function shareTextNative(text) {
  if (!hasNativeBridge()) return false;
  const bridge = window.PendantNativeBridge;
  if (typeof bridge?.shareText !== 'function') return false;
  try {
    bridge.shareText(String(text ?? ''));
    return true;
  } catch {
    return false;
  }
}

if (typeof window !== 'undefined') {
  window.__PENDANT_NATIVE__ = {
    available: hasNativeBridge(),
    bridge: hasNativeBridge() ? window.PendantNativeBridge : null
  };
}
