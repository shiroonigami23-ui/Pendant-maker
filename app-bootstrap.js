export function bindDataEvents(root = document) {
  const bindingMap = [
    ['click', 'data-onclick'],
    ['change', 'data-onchange'],
    ['input', 'data-oninput']
  ];

  for (const [eventName, attr] of bindingMap) {
    root.querySelectorAll(`[${attr}]`).forEach((el) => {
      const expr = el.getAttribute(attr);
      if (!expr) return;
      el.removeAttribute(attr);
      el.addEventListener(eventName, (event) => invokeExpression(expr, el, event));
    });
  }
}

function parseArgs(raw, el, event) {
  if (!raw || !raw.trim()) return [];
  return raw
    .split(',')
    .map((token) => token.trim())
    .map((token) => {
      if (token === 'this') return el;
      if (token === 'event') return event;
      if (token === 'true') return true;
      if (token === 'false') return false;
      if (token === 'null') return null;
      if (
        (token.startsWith("'") && token.endsWith("'")) ||
        (token.startsWith('"') && token.endsWith('"'))
      ) {
        return token.slice(1, -1);
      }
      const num = Number(token);
      if (!Number.isNaN(num)) return num;
      return window[token];
    });
}

function invokeExpression(expr, el, event) {
  const trimmed = expr.trim();
  const fnMatch = trimmed.match(/^([A-Za-z0-9_$.]+)\((.*)\)$/);

  try {
    if (fnMatch) {
      const fnName = fnMatch[1].split('.').pop();
      const fn = window[fnName];
      if (typeof fn !== 'function') return;
      const args = parseArgs(fnMatch[2], el, event);
      fn(...args);
      return;
    }

    const direct = window[trimmed];
    if (typeof direct === 'function') {
      direct(el, event);
    }
  } catch (error) {
    console.error('Failed to invoke action:', expr, error);
  }
}
