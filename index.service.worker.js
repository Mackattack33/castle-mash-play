// Castle Mash test site: no offline cache (it kept players on old builds).
// This replaces the old worker on devices that have it, clears its cache, removes itself,
// and reloads the page so it loads the current build.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
	event.waitUntil((async () => {
		const keys = await caches.keys();
		await Promise.all(keys.map((key) => caches.delete(key)));
		await self.registration.unregister();
		const windows = await self.clients.matchAll({ type: 'window' });
		windows.forEach((client) => client.navigate(client.url));
	})());
});
