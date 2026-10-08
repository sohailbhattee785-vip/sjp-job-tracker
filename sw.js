const CACHE="sjp-job-tracker-v1";
const ASSETS=["./","./index.html","./style.css","./app.js","./manifest.webmanifest","./icon.svg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
 if(new URL(e.request.url).origin===location.origin){
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
 }
});
