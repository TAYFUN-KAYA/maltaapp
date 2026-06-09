type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeNotificationCount(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function bumpNotificationCount(): void {
  listeners.forEach((l) => l());
}
