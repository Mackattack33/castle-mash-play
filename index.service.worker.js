// Castle Mash friends' test site: offline play.
//
// The first time the game opens (with internet), every file it needs is saved on the
// device. From then on it always loads from that saved copy, with or without internet.
//
// This file is the SAME for every game version on purpose: a browser only replaces a
// service worker when this file changes, so the game never updates by itself. The main
// menu's "Check for Update" button does it: it reads version.txt from the site, and if
// there's a new version it deletes this saved copy and reloads, which saves the new one.
// (Changing THIS file does make devices pick it up on their own, along with a fresh copy.)
//
// tools/publish_pages.py installs it as index.service.worker.js, the name Godot's page
// registers.

const CACHE = 'castle-mash-offline';
const FILES = [
	'index.html', 'index.js', 'index.wasm', 'index.pck',
	'index.audio.worklet.js', 'index.audio.position.worklet.js',
	'index.manifest.json', 'index.icon.png', 'index.apple-touch-icon.png',
	'index.144x144.png', 'index.180x180.png', 'index.512x512.png',
];
const BASE = new URL('./', self.location).href;

// Save every file. 'no-cache' asks the site whether each file changed, which is quick
// when it hasn't (the browser already has it from loading the page).
self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE)
		.then((cache) => cache.addAll(FILES.map((file) => new Request(BASE + file, { cache: 'no-cache' }))))
		.then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

// The name a file is saved under: without any ?query, and the bare folder is index.html.
function key(url) {
	const u = new URL(url);
	u.search = '';
	u.hash = '';
	return u.href === BASE ? BASE + 'index.html' : u.href;
}

self.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET' || !request.url.startsWith(BASE)) {
		return;
	}
	const isPage = request.mode === 'navigate';
	// The update check (version.txt) and the Update button's downloads ask for fresh files
	// on purpose: let those go to the internet. Opening the game (even a pull-to-refresh)
	// always uses the saved copy.
	if (!isPage && (request.url.includes('version.txt') || ['no-cache', 'reload', 'no-store'].includes(request.cache))) {
		return;
	}
	event.respondWith(caches.open(CACHE).then((cache) => cache.match(key(request.url)).then((saved) => {
		if (saved) {
			return saved;
		}
		return fetch(request).then((response) => {
			if (response.ok) {
				cache.put(key(request.url), response.clone());
			}
			return response;
		});
	})));
});
