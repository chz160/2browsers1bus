var tbob = {};
(function () {
    var self = this;
    var _serviceBusKey = "tbob.servicebus.";
    var _listeningForList = [];
    var _firedEvents = [];
    var _heardEvents = [];
    var _listening = false;
    var _poleDelay = 250;
    var _cleanupDelay = 250;
    this.listenFor = function (eventName, callback) {
        var key = getKeyForEventName(eventName);
        if ($.inArray(key, _listeningForList) == -1) {
            _listeningForList[key] = [key, callback];
        }
        if (_listening === false) {
            listen();
        }
    }
    this.fireEvent = function (eventName, arg, single) {
        var key = getKeyForEventName(eventName);
        var eventTypeCollection = [];
        if (typeof (single) == 'undefined' || single == null || single === false) {
            var json = localStorage.getItem(key);
            if (typeof (json) != 'undefined' && json != null) {
                eventTypeCollection = JSON.parse(json);
            }
        }
        var eventStamp = timestamp();
        var storeObject = [arg, eventStamp];
        eventTypeCollection.push(storeObject);
        json = JSON.stringify(eventTypeCollection);
        localStorage.setItem(key, json);
        if (_firedEvents.length >= 100) {
            _firedEvents.shift();
        }
        _firedEvents.push([key, eventStamp]);
    }
    function listen() {
        if (_listening === false) _listening = true;
        for (i in _listeningForList) {
            var eventName = _listeningForList[i][0];
            var callback = _listeningForList[i][1];
            var json = localStorage.getItem(eventName);
            if (typeof (json) != 'undefined' && json != null) {
                var eventTypeCollection = JSON.parse(json);
                for (var ii in eventTypeCollection) {
                    var eventStamp = eventTypeCollection[ii][1];
                    if ($.inArray(eventStamp, _heardEvents) > -1) {
                        continue;
                    }
                    var args = eventTypeCollection[ii][0];
                    if (typeof (callback) != 'undefined' && callback != null) {
                        callback(args);
                    }
                    if (_heardEvents.length >= 100) {
                        _heardEvents.shift();
                    }
                    _heardEvents.push(eventStamp);
                }
            }
            storageCleanup(eventName);
        }
        setTimeout(function () { listen(); }, _poleDelay);
    }
    function storageCleanup(key) {
        var json = localStorage.getItem(key);
        if (typeof (json) != 'undefined' && json != null) {
            var eventTypeCollection = JSON.parse(json);
            var indexesToRemove = [];
            for (i in eventTypeCollection) {
                if (timestamp() - eventTypeCollection[i][1] > _cleanupDelay) {
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
    }
    function getKeyForEventName(eventName) {
        return _serviceBusKey + eventName;
    }
    var timestamp = (function () {
        return function () {
            return +new Date();
        }
    })();
}).apply(tbob);