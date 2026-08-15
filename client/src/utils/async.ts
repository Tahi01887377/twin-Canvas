export function throttle<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let last = 0;
  let pending: Parameters<T> | null = null;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = ms - (now - last);
    if (remaining <= 0 || remaining > ms) {
      if (pending) {
        fn(...pending);
        pending = null;
      }
      last = now;
      fn(...args);
    } else if (!pending) {
      pending = args;
      setTimeout(() => {
        if (pending) {
          fn(...pending);
          pending = null;
        }
        last = Date.now();
      }, remaining);
    }
  }) as T;
}

export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  }) as T;
}
