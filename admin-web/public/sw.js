// Routes each notification type to a page — mirrors NotificationBell.jsx's routeForNotification.
function routeForNotification(data) {
  switch (data?.type) {
    case 'salon_pending_approval':
    case 'salon_approved':
    case 'salon_rejected':
      return data.salon_id ? `/salons/${data.salon_id}` : '/salons'
    case 'new_order_placed':
    case 'order_return_requested':
    case 'order_cancellation_requested':
      return data.order_type === 'b2c' ? '/client-orders' : '/orders'
    default:
      return '/'
  }
}

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    return
  }

  const { title = 'Prima', body, data } = payload

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Always show the native OS notification — an open/focused tab also gets
      // a postMessage so it can chime + bump the bell badge, but the native
      // toast is what the admin actually relies on to notice new activity.
      clients.forEach((c) => c.postMessage({ type: 'push-received', title, body, data }))

      return self.registration.showNotification(title, {
        body,
        icon: '/logo.png',
        badge: '/logo.png',
        data,
      })
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const route = routeForNotification(event.notification.data)

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.postMessage({ type: 'push-navigate', route })
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(route)
      }
    })
  )
})
