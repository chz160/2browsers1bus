const tbob = {};
(function () {
    const self = this;
    const _serviceBusKey = "tbob.servicebus.";
    const _listeningForList = {};
    //var _firedEvents = [];
    const _heardEvents = [];
    const _cleanupDelay = 250;
    
    self.exceptionHandler = null;
    self.listenFor = function (eventName, callback) {
        try {
            const key = getKeyForEventName(eventName);
            _listeningForList[key] = {
                key,
                callback,
                guid: tbob.guid.GenerateGuid()
            };
        } catch (e) {
            logError(e);
        }
    }
    self.fireEvent = function (eventName, arg, single) {
        try {
            const key = getKeyForEventName(eventName);
            let eventTypeCollection = [];
            if (typeof single == "undefined" || single == null || single === false) {
                const jsonFromStore = localStorage.getItem(key);
                if (typeof jsonFromStore != "undefined" && jsonFromStore != null) {
                    eventTypeCollection = JSON.parse(jsonFromStore);
                }
            }
            const eventStamp = timestamp();
            const storeObject = {
                data: arg,
                eventTimeStamp: eventStamp,
                guid: tbob.guid.GenerateGuid()
            };
            eventTypeCollection.push(storeObject);
            const jsonToStore = JSON.stringify(eventTypeCollection);
            localStorage.setItem(key, jsonToStore);
            //TODO: could be useful for tracking ones own events
            //if (_firedEvents.length >= 100) {
            //    _firedEvents.shift();
            //}
            //_firedEvents.push([key, eventStamp]);
        } catch (e) {
            logError(e);
        }
    }
    self.cleanUpStorage = function () {
        try {
            const keys = [];
            for (let key in localStorage) {
                if (key.indexOf(_serviceBusKey) === 0) {
                    keys.push(key);
                }
            }
            for (let i = 0; i < keys.length; i++) {
                localStorage.removeItem(keys[i]);
            }
        } catch (e) {
            logError(e);
        }
    }
    function listen(event) {
        try {
            for (let prop in _listeningForList) {
                if (_listeningForList.hasOwnProperty(prop)) {
                    const eventName = _listeningForList[prop].key;
                    const callback = _listeningForList[prop].callback;
                    if (event.key === eventName) {
                        const json = event.newValue;
                        if (typeof json != "undefined" && json != null && json !== "") {
                            const eventTypeCollection = JSON.parse(json);
                            for (let ii = 0; ii < eventTypeCollection.length; ii++) {
                                const eventStamp = eventTypeCollection[ii].eventTimeStamp;
                                if ($.inArray(eventStamp, _heardEvents) > -1) {
                                    continue;
                                }
                                const args = eventTypeCollection[ii].data;
                                if (typeof callback != "undefined" && callback != null) {
                                    callback(args);
                                }
                                if (_heardEvents.length >= 100) {
                                    _heardEvents.shift();
                                }
                                _heardEvents.push(eventStamp);
                            }
                            storageCleanup(eventName);
                        }
                    }
                }
            }
        } catch (e) {
            logError(e);
        }
    }
    function storageCleanup(key) {
        try {
            const json = localStorage.getItem(key);
            if (typeof json != "undefined" && json != null) {
                const eventTypeCollection = JSON.parse(json);
                const indexesToRemove = [];
                for (let i = 0; i < eventTypeCollection.length; i++) {
                    if (timestamp() - eventTypeCollection[i].eventTimeStamp > _cleanupDelay) {
                        indexesToRemove.push(i);
                    }
                }
                for (let ii = 0; ii < indexesToRemove.length; ii++) {
                    eventTypeCollection.splice(ii, 1);
                }
                if (eventTypeCollection.length === 0) {
                    localStorage.removeItem(key);
                } else {
                    const eventTypeCollectionJson = JSON.stringify(eventTypeCollection);
                    localStorage.setItem(key, eventTypeCollectionJson);
                }
            }
        } catch (e) {
            logError(e);
        }
    }
    function getKeyForEventName(eventName) {
        return _serviceBusKey + eventName;
    }
    function timestamp() {
        return +new Date();
    }
    if (window.addEventListener) {
        window.addEventListener("storage", onHandleStorage, false);
    } else {
        window.attachEvent("onstorage", onHandleStorage);
    }
    function onHandleStorage(event) {
        if (!event) { event = window.event; }
        listen(event);
    }
    function logError(e) {
        if (window.console && window.console.log && e != null && e.message) {
            console.log(e.message);
            if (exceptionHandler != null) {
                exceptionHandler(e);
            }
        }
    }
}).apply(tbob);

tbob.guid = {};
(function () {
    const self = this;
    const guid = (function () {
        const lut = []; for (let i = 0; i < 256; i++) { lut[i] = (i < 16 ? "0" : "") + (i).toString(16); }
        function generate() {
            const d0 = randomizer();
            const d1 = randomizer();
            const d2 = randomizer();
            const d3 = randomizer();
            return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + "-" +
                lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + "-" + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + "-" +
                lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + "-" + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
                lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
        }
        function randomizer() {
            const crypto = window.crypto || window.msCrypto; // IE 11
            if (crypto && crypto.getRandomValues) {
                const result = new Uint8Array(5);
                crypto.getRandomValues(result);
                let number = "0.";
                for (let i = 0; i < result.length; i++) {
                    number = number + "" + result[i];
                }
                return Number(number) * 0x100000000 >>> 0;
            }
            return Math.random() * 0xffffffff >>> 0;
        }
        return function () {
            return generate();
        }
    })();
    self.GenerateGuid = function() {
        return guid();
    }
}).apply(tbob.guid);
