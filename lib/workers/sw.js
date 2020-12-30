importScripts("/ngsw-worker.js")

self.addEventListener('message', (event) => {
	if (event.data.icon != null) {
		self.icon = event.data.icon
	}

	if (event.data.badge != null) {
		self.badge = event.data.badge
	}
})

self.addEventListener('push', (event) => {
	let data = event.data.json()

	event.waitUntil(
		self.registration.showNotification(
			data.title,
			{
				icon: self.icon,
				badge: self.badge,
				body: data.body
			}
		)
	)
})

self.addEventListener('notificationclick', (event) => {
	event.notification.close()

	let baseUrl = `${self.location.protocol}//${self.location.host}`
	event.waitUntil(
		clients.openWindow(baseUrl)
	)
})