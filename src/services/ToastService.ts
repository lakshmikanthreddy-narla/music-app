type ToastListener = (message: string) => void;

class ToastManager {
  private listeners: Set<ToastListener> = new Set();

  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  show(message: string): void {
    this.listeners.forEach((listener) => listener(message));
  }
}

export const ToastService = new ToastManager();
