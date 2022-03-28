import { User, UserManager, UserManagerSettings } from "oidc-client-ts";

export class ServiceWorkerUserManager extends UserManager {
    
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    sendMessageAsync(worker: ServiceWorker, action: "SET_TOKEN" | "GET_TOKEN", data: User | null): Promise<User | null> {
        return new Promise(function (resolve, reject) {
            const messageChannel = new MessageChannel();
            console.log("Talking to ServiceWorker! " + JSON.stringify(data));
            if (action == "SET_TOKEN") {
                resolve(null);
            } else {
                messageChannel.port1.onmessage = function (event) {
                    if (event.data && event.data.error) {
                        reject(event.data.error);
                    } else {
                        if (event.data.user) {
                            resolve(event.data.user as User);
                        } else {
                            resolve(null);
                        }
                    }
                };
            }

            worker.postMessage({ type: action, user: data }, [messageChannel.port2]);
        });
    }

    constructor(settings: UserManagerSettings) {
        super(settings);
        if (navigator.serviceWorker) {
            navigator.serviceWorker.register("worker.js").then(function () {
                console.log("ServiceWorker registration succesful!");
            }, function (err) {
                console.log("ServiceWorker registration failed: ", err);
            });
        }
    }

    storeUser(user: User | null): Promise<void> {
        if (!navigator.serviceWorker) {
            return super.storeUser(user);
        }
        const worker = navigator.serviceWorker.controller;
        if (worker) {
            return this.sendMessageAsync(worker, "SET_TOKEN", user).then(() => Promise.resolve());
        }
        return Promise.reject();
    }

    protected _loadUser(): Promise<User | null> {
        if (!navigator.serviceWorker) {
            return super._loadUser();
        }
        const worker = navigator.serviceWorker.controller;
        if (worker) {
            return this.sendMessageAsync(worker, "GET_TOKEN", null).then((data) => Promise.resolve(data));
        }
        return Promise.reject();
    }
}
