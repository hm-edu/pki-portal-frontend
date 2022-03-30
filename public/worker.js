// These listeners will make the service worker immediately available for the page
self.addEventListener("install", function (event) {
    event.waitUntil(self.skipWaiting());
    console.log("[SW] serviceworker installed!");
});

self.addEventListener("activate", function (event) {
    event.waitUntil(self.clients.claim());
    console.log("[SW] serviceworker ready!");
});
const broadcast = new BroadcastChannel("user-channel");
// Hardocded checks for origins/paths to send credentials to
const whitelistedOrigins = [
    "https://backend.my-dev.private.cc.hm.edu",
];

// Global user variable in the service worker
let user = null;

// Exposed "method" for saving the token
self.addEventListener("message", function (event) {
    if (event.data && event.data.type === "SET_TOKEN") {
        let wasUser = user != undefined && user != null;
        user = event.data.user;
        console.log("[SW] token set!");
        if (!user && wasUser) {
            broadcast.postMessage({ type: "LOGOUT" });
        }
    }
    if (event.data && event.data.type === "GET_TOKEN") {
        console.log("[SW] token get!");
        let communicationPort = event.ports[0];
        if (user != null) {
            let data = { ...user };
            if (data && data.access_token)
                data.access_token = "[REDACTED]";
            communicationPort.postMessage({ user: data });
        } else {
            communicationPort.postMessage({ user: null });
        }
    }
    if (event.data && event.data.type === "PING") {
        let communicationPort = event.ports[0];
        communicationPort.postMessage({ msg: "PONG" });
    }
});

// Helper function to add the auth header if the oubound request matches the whitelists
const addAuthHeader = function (event) {
    const destURL = new URL(event.request.url);
    if (whitelistedOrigins.includes(destURL.origin)) {
        console.log("[SW] Intercepting request");
        const modifiedHeaders = new Headers(event.request.headers);
        if (user && user.access_token) {
            modifiedHeaders.set("Authorization", "Bearer " + user.access_token);
        }
        const authReq = new Request(event.request, { headers: modifiedHeaders });
        event.waitUntil(event.respondWith(fetch(authReq)));
    }
};

// Intercept all fetch requests and add the auth header
self.addEventListener("fetch", addAuthHeader);
