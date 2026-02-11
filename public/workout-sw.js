/* eslint-disable no-restricted-globals */

// Basic service worker for the /workout mini app.
// Focused on push notifications and simple navigation handling.

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Optional: very minimal runtime caching for navigation requests under /workout
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.mode === "navigate" && url.pathname.startsWith("/workout")) {
    event.respondWith(fetch(event.request));
  }
});

// Handle incoming push messages
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    // fall back to text
    payload = { title: "Workout", body: event.data.text() };
  }

  const title = payload.title || "Workout";
  const body = payload.body || "";
  const url = payload.url || "/workout";

  const options = {
    body,
    icon: "/icons/workout-icon-192.png",
    badge: "/icons/workout-icon-192.png",
    data: { url },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Deep-link into the app when the user taps a notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/workout";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          const clientUrl = new URL(client.url);
          if (clientUrl.origin === self.location.origin) {
            client.navigate(url);
            return client.focus();
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
      return undefined;
    })
  );
});

