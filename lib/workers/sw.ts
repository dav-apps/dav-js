importScripts("/ngsw-worker.js");

self.addEventListener('message', (event: any) => {
	if(event.data.baseUrl){
		self.baseUrl = event.data.baseUrl;
	}

	if(event.data.icon){
		self.icon = event.data.icon;
	}

	if(event.data.badge){
		self.badge = event.data.badge;
	}
});

self.addEventListener('push', (event: any) => {
	let data = event.data.json();
	let title = data.properties.title;
	let body = data.properties.body;
	let icon = self.icon;
	let badge = self.badge;
	
	event.waitUntil(self.registration.showNotification(title, {body, icon, badge}));
});

self.addEventListener('notificationclick', (event: any) => {
	event.notification.close();
	event.waitUntil(
		clients.openWindow(self.baseUrl)
  	);
});