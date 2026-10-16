import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Permissão atual, reativa; "unsupported" no servidor. */
export function useNotificationPermission(): NotificationPermission | "unsupported" {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    notificationPermission,
    () => "unsupported",
  );
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notificationsSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  } finally {
    emit();
  }
}

/** Fallback silencioso se não houver permissão. */
export function notify(title: string, body: string): void {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, { body, tag: "flowmodoro-break", icon: "/icon-192.png" });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* alguns navegadores móveis exigem service worker */
  }
}
