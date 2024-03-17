importScripts("/ngsw-worker.js")

self.addEventListener("message", event => {
	if (event.data.icon != null) {
		self.icon = event.data.icon
	}

	if (event.data.badge != null) {
		self.badge = event.data.badge
	}
})

self.addEventListener("push", event => {
	let data = event.data.json()

	event.waitUntil(
		self.registration.showNotification(data.title, {
			icon: self.icon,
			badge: self.badge,
			image: body.image,
			body: data.body,
			data: {
				href: data.href
			}
		})
	)
})

self.addEventListener("notificationclick", event => {
	event.notification.close()

	const href = event.notification.data?.href
	let url = `${self.location.protocol}//${self.location.host}`

	if (href != null) {
		if (href.startsWith("/")) {
			url += href
		} else {
			url = href
		}
	}

	event.waitUntil(clients.openWindow(url))
})
