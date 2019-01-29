
/* litejs.com/MIT-LICENSE.txt */


console.log('Push service started', self);

self.addEventListener('install', function(event) {
	self.skipWaiting();
	console.log('Installed', event);
});

self.addEventListener('activate', function(event) {
	console.log('Activated', event);
});

self.addEventListener('push', function(event) {
	console.log('Push message', event);

	var title = 'Push message';

	event.waitUntil(
		self.registration.showNotification(title, {
			'body': 'The Message',
			'icon': 'images/icon.png'
		})
	);
});


