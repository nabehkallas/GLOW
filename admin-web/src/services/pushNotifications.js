import api from '../api/axios'

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const now = ctx.currentTime
    ;[[880, 0], [1320, 0.1]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, now + delay)
      gain.gain.exponentialRampToValueAtTime(0.2, now + delay + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.25)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + delay)
      osc.stop(now + delay + 0.3)
    })
    setTimeout(() => ctx.close(), 600)
  } catch {
    // Web Audio unsupported/blocked — silently skip the chime.
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

export function listenForPushMessages() {
  if (!('serviceWorker' in navigator)) return

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'push-received') {
      playChime()
      window.dispatchEvent(new CustomEvent('push-received', { detail: event.data }))
    } else if (event.data?.type === 'push-navigate') {
      window.dispatchEvent(new CustomEvent('push-navigate', { detail: { route: event.data.route } }))
    }
  })
}

export async function subscribeToPush() {
  if (!isPushSupported()) throw new Error('Push notifications are not supported in this browser.')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notification permission denied.')

  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
  })

  await api.post('notifications/web-push-subscribe', subscription.toJSON())
  return subscription
}

export async function unsubscribeFromPush() {
  if (!isPushSupported()) return

  const registration = await navigator.serviceWorker.getRegistration('/sw.js')
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return

  const endpoint = subscription.endpoint
  await subscription.unsubscribe()
  await api.delete('notifications/web-push-unsubscribe', { data: { endpoint } })
}

export async function isSubscribedToPush() {
  if (!isPushSupported()) return false
  const registration = await navigator.serviceWorker.getRegistration('/sw.js')
  const subscription = await registration?.pushManager.getSubscription()
  return !!subscription
}
