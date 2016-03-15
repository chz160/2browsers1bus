var tbob = {};
(function () {
    var self = this;
    var _serviceBusKey = "tbob.servicebus.";
    var _listeningForList = {};
    //var _firedEvents = [];
    var _heardEvents = [];
    var _cleanupDelay = 250;
    self.exceptionHandler = null;
    self.listenFor = function (eventName, callback) {
        try {
            var key = getKeyForEventName(eventName);
            _listeningForList[key] = {
                key: key,
                callback: callback,
                guid: guid()
            };
        } catch (e) {
            logError(e);
        }
    }
    self.fireEvent = function (eventName, arg, single) {
        try {
            var key = getKeyForEventName(eventName);
            var eventTypeCollection = [];
            if (typeof (single) == "undefined" || single == null || single === false) {
                var jsonFromStore = localStorage.getItem(key);
                if (typeof (jsonFromStore) != "undefined" && jsonFromStore != null) {
                    eventTypeCollection = JSON.parse(jsonFromStore);
                }
            }
            var eventStamp = timestamp();
            var storeObject = {
                data: arg,
                eventTimeStamp: eventStamp,
                guid: guid()
            };
            eventTypeCollection.push(storeObject);
            var jsonToStore = JSON.stringify(eventTypeCollection);
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
            var keys = [];
            for (var key in localStorage) {
                if (key.indexOf(_serviceBusKey) === 0) {
                    keys.push(key);
                }
            }
            for (var i = 0; i < keys.length; i++) {
                localStorage.removeItem(keys[i]);
            }
        } catch (e) {
            logError(e);
        }
    }
    function listen(event) {
        try {
            for (var prop in _listeningForList) {
                if (_listeningForList.hasOwnProperty(prop)) {
                    var eventName = _listeningForList[prop].key;
                    var callback = _listeningForList[prop].callback;
                    if (event.key === eventName) {
                        var json = event.newValue;
                        if (typeof (json) != "undefined" && json != null && json !== "") {
                            var eventTypeCollection = JSON.parse(json);
                            for (var ii = 0; ii < eventTypeCollection.length; ii++) {
                                var eventStamp = eventTypeCollection[ii].eventTimeStamp;
                                if ($.inArray(eventStamp, _heardEvents) > -1) {
                                    continue;
                                }
                                var args = eventTypeCollection[ii].data;
                                if (typeof (callback) != "undefined" && callback != null) {
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
            var json = localStorage.getItem(key);
            if (typeof (json) != "undefined" && json != null) {
                var eventTypeCollection = JSON.parse(json);
                var indexesToRemove = [];
                for (var i = 0; i < eventTypeCollection.length; i++) {
                    if (timestamp() - eventTypeCollection[i].eventTimeStamp > _cleanupDelay) {
                        indexesToRemove.push(i);
                    }
                }
                for (var ii = 0; ii < indexesToRemove.length; ii++) {
                    eventTypeCollection.splice(ii, 1);
                }
                if (eventTypeCollection.length === 0) {
                    localStorage.removeItem(key);
                } else {
                    var eventTypeCollectionJson = JSON.stringify(eventTypeCollection);
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
    };
    var guid = (function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                       .toString(16)
                       .substring(1);
        }
        return function () {
            return s4() + s4() + "-" + s4() + "-" + s4() + "-" +
                   s4() + "-" + s4() + s4() + s4();
        };
    })();
    if (window.addEventListener) {
        window.addEventListener("storage", onHandleStorage, false);
    } else {
        window.attachEvent("onstorage", onHandleStorage);
    };
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