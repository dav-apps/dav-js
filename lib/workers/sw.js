importScripts("/ngsw-worker.js");

self.addEventListener('message', (event) => {
	if(event.data.icon){
		self.icon = event.data.icon;
	}

	if(event.data.badge){
		self.badge = event.data.badge;
	}
});

self.addEventListener('push', (event) => {
	let data = event.data.json();
	let title = data.properties.title;
	let body = data.properties.message;
	let icon = self.icon;
	let badge = self.badge;
	
	event.waitUntil(self.registration.showNotification(title, {body, icon, badge}));
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();

	let baseUrl = `${self.location.protocol}//${self.location.host}`;
	event.waitUntil(
		clients.openWindow(baseUrl)
  	);
});