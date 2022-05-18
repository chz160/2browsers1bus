var tbob;
(function (tbob) {
    var serviceBus = (function () {
        function serviceBus() {
        }
        serviceBus.getInstance = function () {
            if (this.instance == undefined) {
                this.instance = new serviceBusBase();
            }
            return this.instance;
        };
        serviceBus.setExceptionHandlerCallback = function (callback) { this.getInstance().setExceptionHandlerCallback(callback); };
        serviceBus.listenFor = function (eventName, callback) { this.getInstance().listenFor(eventName, callback); };
        serviceBus.fireEvent = function (eventName, arg, single) { this.getInstance().fireEvent(eventName, arg, single); };
        serviceBus.cleanUpStorage = function () { this.getInstance().cleanUpStorage(); };
        return serviceBus;
    }());
    tbob.serviceBus = serviceBus;
    var serviceBusBase = (function () {
        function serviceBusBase() {
            this._serviceBusPrefix = "tbob.servicebus.";
            this._listeningForList = {};
            this._heardEvents = [];
            this._cleanupDelay = 250;
            this._store = localStorage || null;
            this.init();
        }
        serviceBusBase.prototype.init = function () {
            var _this = this;
            if (window.addEventListener) {
                window.addEventListener("storage", function (event) {
                    if (!event) {
                        event = window.event;
                    }
                    _this.listen(event);
                }, false);
            }
            else {
                window.attachEvent("onstorage", function (event) {
                    if (!event) {
                        event = window.event;
                    }
                    _this.listen(event);
                });
            }
        };
        serviceBusBase.prototype.setExceptionHandlerCallback = function (callback) {
            this.exceptionHandler = callback;
        };
        serviceBusBase.prototype.handleException = function (e) {
            this.exceptionHandler(e);
        };
        serviceBusBase.prototype.listenFor = function (eventName, callback) {
            try {
                var key = this.getKeyForEventName(eventName);
                this._listeningForList[key] = {
                    key: key,
                    callback: callback,
                    guid: this.newGuid()
                };
            }
            catch (e) {
                this.logError(e);
            }
        };
        serviceBusBase.prototype.fireEvent = function (eventName, arg, single) {
            try {
                var key = this.getKeyForEventName(eventName);
                var eventTypeCollection = [];
                if (typeof single == "undefined" || single == null || single === false) {
                    var jsonFromStore = this._store.getItem(key);
                    if (typeof jsonFromStore != "undefined" && jsonFromStore != null) {
                        eventTypeCollection = JSON.parse(jsonFromStore);
                    }
                }
                var eventStamp = this.timestamp();
                var storeObject = {
                    data: arg,
                    eventTimeStamp: eventStamp,
                    guid: this.newGuid()
                };
                eventTypeCollection.push(storeObject);
                var jsonToStore = JSON.stringify(eventTypeCollection);
                this._store.setItem(key, jsonToStore);
            }
            catch (e) {
                this.logError(e);
            }
        };
        serviceBusBase.prototype.cleanUpStorage = function () {
            try {
                var keys = [];
                for (var key in this._store) {
                    if (this._store.hasOwnProperty(key)) {
                        if (key.indexOf(this._serviceBusPrefix) === 0) {
                            keys.push(key);
                        }
                    }
                }
                for (var i = 0; i < keys.length; i++) {
                    this._store.removeItem(keys[i]);
                }
            }
            catch (e) {
                this.logError(e);
            }
        };
        serviceBusBase.prototype.listen = function (event) {
            try {
                for (var prop in this._listeningForList) {
                    if (this._listeningForList.hasOwnProperty(prop)) {
                        var eventName = this._listeningForList[prop].key;
                        var callback = this._listeningForList[prop].callback;
                        if (event.key === eventName) {
                            var json = event.newValue;
                            if (typeof json != "undefined" && json != null && json !== "") {
                                var eventTypeCollection = JSON.parse(json);
                                for (var ii = 0; ii < eventTypeCollection.length; ii++) {
                                    var eventStamp = eventTypeCollection[ii].eventTimeStamp;
                                    if (this._heardEvents.indexOf(eventStamp) > -1) {
                                        continue;
                                    }
                                    var args = eventTypeCollection[ii].data;
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
        };
        serviceBusBase.prototype.storageCleanup = function (key) {
            try {
                var json = this._store.getItem(key);
                if (typeof json != "undefined" && json != null) {
                    var eventTypeCollection = JSON.parse(json);
                    var indexesToRemove = [];
                    for (var i = 0; i < eventTypeCollection.length; i++) {
                        if (this.timestamp() - eventTypeCollection[i].eventTimeStamp > this._cleanupDelay) {
                            indexesToRemove.push(i);
                        }
                    }
                    for (var ii = 0; ii < indexesToRemove.length; ii++) {
                        eventTypeCollection.splice(ii, 1);
                    }
                    if (eventTypeCollection.length === 0) {
                        this._store.removeItem(key);
                    }
                    else {
                        var eventTypeCollectionJson = JSON.stringify(eventTypeCollection);
                        this._store.setItem(key, eventTypeCollectionJson);
                    }
                }
            }
            catch (e) {
                this.logError(e);
            }
        };
        serviceBusBase.prototype.getKeyForEventName = function (eventName) {
            return this._serviceBusPrefix + eventName;
        };
        serviceBusBase.prototype.timestamp = function () {
            return +new Date();
        };
        serviceBusBase.prototype.newGuid = function () {
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };
        serviceBusBase.prototype.logError = function (e) {
            if (window.console && window.console.log && e != null && e.message) {
                console.log(e.message);
                if (this.handleException != null) {
                    this.handleException(e);
                }
            }
        };
        return serviceBusBase;
    }());
})(tbob || (tbob = {}));
//# sourceMappingURL=2browsers1bus.js.map