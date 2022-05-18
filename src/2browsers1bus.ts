module tbob {
    export class serviceBus {
        private static instance: serviceBusBase;
        static getInstance(): serviceBusBase {
            if (this.instance == undefined) {
                this.instance = new serviceBusBase();
            }
            return this.instance;
        }

        static setExceptionHandlerCallback(callback: Function) { this.getInstance().setExceptionHandlerCallback(callback); }
        static listenFor(eventName: string, callback: Function): void { this.getInstance().listenFor(eventName, callback); }
        static fireEvent(eventName: string, arg: any, single: boolean): void { this.getInstance().fireEvent(eventName, arg, single); }
        static cleanUpStorage(): void { this.getInstance().cleanUpStorage(); }
    }

    class serviceBusBase {
        private _store: Storage;
        private _serviceBusPrefix: string = "tbob.servicebus.";
        private _listeningForList = {};
        //var _firedEvents = [];
        private _heardEvents = [];
        private _cleanupDelay = 250;
        private exceptionHandler: Function;

        constructor() {
            this._store = localStorage || null;
            this.init();
        }

        private init() {
            if (window.addEventListener) {
                window.addEventListener("storage", (event) => {
                    if (!event) {
                        event = window.event as StorageEvent;
                    }
                    this.listen(event);
                }, false);
            } else {
                (window as any).attachEvent("onstorage", (event) => {
                    if (!event) {
                        event = window.event as StorageEvent;
                    }
                    this.listen(event);
                });
            }
        }
        
        setExceptionHandlerCallback(callback: Function): void {
            this.exceptionHandler = callback;
        }

        private handleException(e: Error): void {
            this.exceptionHandler(e);
        }

        listenFor(eventName: string, callback: Function): void {
            try {
                const key = this.getKeyForEventName(eventName);
                this._listeningForList[key] = {
                    key: key,
                    callback: callback,
                    guid: this.newGuid()
                };
            } catch (e) {
                this.logError(e);
            }
        }

        fireEvent(eventName: string, arg: any, single: boolean): void {
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
                //TODO: could be useful for tracking ones own events
                //if (_firedEvents.length >= 100) {
                //    _firedEvents.shift();
                //}
                //_firedEvents.push([key, eventStamp]);
            } catch (e) {
                this.logError(e);
            }
        }

        cleanUpStorage(): void {
            try {
                const keys: string[] = [];
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
            } catch (e) {
                this.logError(e);
            }
        }

        private listen(event): void {
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
                                    if ($.inArray(eventStamp, this._heardEvents) > -1) {
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
            } catch (e) {
                this.logError(e);
            }
        }

        private storageCleanup(key: string): void {
            try {
                const json = this._store.getItem(key);
                if (typeof json != "undefined" && json != null) {
                    const eventTypeCollection = JSON.parse(json);
                    const indexesToRemove: number[] = [];
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
                    } else {
                        const eventTypeCollectionJson = JSON.stringify(eventTypeCollection);
                        this._store.setItem(key, eventTypeCollectionJson);
                    }
                }
            } catch (e) {
                this.logError(e);
            }
        }

        private getKeyForEventName(eventName: string): string {
            return this._serviceBusPrefix + eventName;
        }
        
        private timestamp(): number {
            return +new Date();
        }

        private newGuid(): string {
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
                var r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        //private onHandleStorage(event) {
        //    if (!event) { event = window.event; }
        //    this.listen(event);
        //}

        private logError(e): void {
            if (window.console && window.console.log && e != null && e.message) {
                console.log(e.message);
                if (this.handleException != null) {
                    this.handleException(e);
                }
            }
        }
    }
}