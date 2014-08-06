var tbob = {};
(function () {
    var self = this;
    var _serviceBusKey = "tbob.servicebus.";
    var _listeningForList = [];
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
            if (typeof (single) == 'undefined' || single == null || single === false) {
                var json = localStorage.getItem(key);
                if (typeof (json) != 'undefined' && json != null) {
                    eventTypeCollection = JSON.parse(json);
                }
            }
            var eventStamp = timestamp();
            var storeObject = {
                data: arg,
                eventTimeStamp: eventStamp,
                guid: guid()
            };
            eventTypeCollection.push(storeObject);
            json = JSON.stringify(eventTypeCollection);
            localStorage.setItem(key, json);
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
            for (var i = 0; i < localStorage.length; i++) {
                if (localStorage.key(i).indexOf(_serviceBusKey) == 0) {
                    localStorage.removeItem(localStorage.key(i));
                }
            }
        } catch (e) {
            logError(e);
        }
    }
    function listen(event) {
        try {
            for (i in _listeningForList) {
                var eventName = _listeningForList[i].key;
                var callback = _listeningForList[i].callback;
                if (event.key == eventName) {
                    var json = event.newValue;
                    if (typeof (json) != 'undefined' && json != null && json != "") {
                        var eventTypeCollection = JSON.parse(json);
                        for (var ii in eventTypeCollection) {
                            var eventStamp = eventTypeCollection[ii].eventTimeStamp;
                            if ($.inArray(eventStamp, _heardEvents) > -1) {
                                continue;
                            }
                            var args = eventTypeCollection[ii].data;
                            if (typeof (callback) != 'undefined' && callback != null) {
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
        } catch (e) {
            logError(e);
        }
    }
    function storageCleanup(key) {
        try {
            var json = localStorage.getItem(key);
            if (typeof (json) != 'undefined' && json != null) {
                var eventTypeCollection = JSON.parse(json);
                var indexesToRemove = [];
                for (i in eventTypeCollection) {
                    if (timestamp() - eventTypeCollection[i].eventTimeStamp > _cleanupDelay) {
                        indexesToRemove.push(i);
                    }
                }
                for (i in indexesToRemove) {
                    eventTypeCollection.splice(i, 1);
                }
                if (eventTypeCollection.length == 0) {
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
    var timestamp = (function () {
        return function () {
            return +new Date();
        }
    })();
    var guid = (function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                       .toString(16)
                       .substring(1);
        }
        return function () {
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                   s4() + '-' + s4() + s4() + s4();
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