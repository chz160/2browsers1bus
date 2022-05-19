"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tbob = void 0;
var tbob;
(function (tbob) {
    class serviceBus {
        static getInstance() {
            if (this.instance == undefined) {
                this.instance = new serviceBusBase();
            }
            return this.instance;
        }
        static setExceptionHandlerCallback(callback) { this.getInstance().setExceptionHandlerCallback(callback); }
        static listenFor(eventName, callback) { this.getInstance().listenFor(eventName, callback); }
        static fireEvent(eventName, arg, single) { this.getInstance().fireEvent(eventName, arg, single); }
        static cleanUpStorage() { this.getInstance().cleanUpStorage(); }
    }
    tbob.serviceBus = serviceBus;
    class serviceBusBase {
        constructor() {
            this._serviceBusPrefix = "tbob.servicebus.";
            this._listeningForList = {};
            this._heardEvents = [];
            this._cleanupDelay = 250;
            this._store = localStorage || null;
            this.init();
        }
        init() {
            if (window.addEventListener) {
                window.addEventListener("storage", (event) => {
                    if (!event) {
                        event = window.event;
                    }
                    this.listen(event);
                }, false);
            }
            else {
                window.attachEvent("onstorage", (event) => {
                    if (!event) {
                        event = window.event;
                    }
                    this.listen(event);
                });
            }
        }
        setExceptionHandlerCallback(callback) {
            this.exceptionHandler = callback;
        }
        handleException(e) {
            this.exceptionHandler(e);
        }
        listenFor(eventName, callback) {
            try {
                const key = this.getKeyForEventName(eventName);
                this._listeningForList[key] = {
                    key: key,
                    callback: callback,
                    guid: this.newGuid()
                };
            }
            catch (e) {
                this.logError(e);
            }
        }
        fireEvent(eventName, arg, single) {
            try {
                const key = this.getKeyForEventName(eventName);
                let eventTypeCollection = [];
                if (typeof single == "undefined" || single == null || single === false) {
                    const jsonFromStore = this._store.getItem(key);
                    if (typeof jsonFromStore != "undefined" && jsonFromStore != null) {
                        eventTypeCollection = JSON.parse(jsonFromStore);
                    }
                }
                const eventStamp = this.timestamp();
                const storeObject = {
                    data: arg,
                    eventTimeStamp: eventStamp,
                    guid: this.newGuid()
                };
                eventTypeCollection.push(storeObject);
                const jsonToStore = JSON.stringify(eventTypeCollection);
                this._store.setItem(key, jsonToStore);
            }
            catch (e) {
                this.logError(e);
            }
        }
        cleanUpStorage() {
            try {
                const keys = [];
                for (let key in this._store) {
                    if (this._store.hasOwnProperty(key)) {
                        if (key.indexOf(this._serviceBusPrefix) === 0) {
                            keys.push(key);
                        }
                    }
                }
                for (let i = 0; i < keys.length; i++) {
                    this._store.removeItem(keys[i]);
                }
            }
            catch (e) {
                this.logError(e);
            }
        }
        listen(event) {
            try {
                for (let prop in this._listeningForList) {
                    if (this._listeningForList.hasOwnProperty(prop)) {
                        const eventName = this._listeningForList[prop].key;
                        const callback = this._listeningForList[prop].callback;
                        if (event.key === eventName) {
                            const json = event.newValue;
                            if (typeof json != "undefined" && json != null && json !== "") {
                                const eventTypeCollection = JSON.parse(json);
                                for (let ii = 0; ii < eventTypeCollection.length; ii++) {
                                    const eventStamp = eventTypeCollection[ii].eventTimeStamp;
                                    if (this._heardEvents.indexOf(eventStamp) > -1) {
                                        continue;
                                    }
                                    const args = eventTypeCollection[ii].data;
                                    if (typeof callback != "undefined" && callback != null) {
                                        callback(args);
                                    }
                                    if (this._heardEvents.length >= 100) {
                                        this._heardEvents.shift();
                                    }
                                    this._heardEvents.push(eventStamp);
                                }
                                this.storageCleanup(eventName);
                            }
                        }
                    }
                }
            }
            catch (e) {
                this.logError(e);
            }
        }
        storageCleanup(key) {
            try {
                const json = this._store.getItem(key);
                if (typeof json != "undefined" && json != null) {
                    const eventTypeCollection = JSON.parse(json);
                    const indexesToRemove = [];
                    for (let i = 0; i < eventTypeCollection.length; i++) {
                        if (this.timestamp() - eventTypeCollection[i].eventTimeStamp > this._cleanupDelay) {
                            indexesToRemove.push(i);
                        }
                    }
                    for (let ii = 0; ii < indexesToRemove.length; ii++) {
                        eventTypeCollection.splice(ii, 1);
                    }
                    if (eventTypeCollection.length === 0) {
                        this._store.removeItem(key);
                    }
                    else {
                        const eventTypeCollectionJson = JSON.stringify(eventTypeCollection);
                        this._store.setItem(key, eventTypeCollectionJson);
                    }
                }
            }
            catch (e) {
                this.logError(e);
            }
        }
        getKeyForEventName(eventName) {
            return this._serviceBusPrefix + eventName;
        }
        timestamp() {
            return +new Date();
        }
        newGuid() {
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
                var r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        logError(e) {
            if (window.console && window.console.log && e != null && e.message) {
                console.log(e.message);
                if (this.handleException != null) {
                    this.handleException(e);
                }
            }
        }
    }
})(tbob = exports.tbob || (exports.tbob = {}));
//# sourceMappingURL=2browsers1bus.js.map