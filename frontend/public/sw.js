self.addEventListener("push", (event) => {
  let payload = { title: "알림", body: "", url: "/" };
  try {
    payload = event.data.json();
  } catch {
    // 페이로드가 없거나 JSON이 아니면 기본값 사용
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: { url: payload.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(self.clients.openWindow(url));
});
