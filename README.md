2browsers1bus
=============
#### *A simple browser window service bus.*
![Yummy chocolate ice cream!!](https://github.com/chz160/2browsers1bus/raw/master/2b1b.jpg)


2browser1bus (TBOB) is a service bus for communicating between browser windows using the localStorage feature of modern browsers.  

TBOB has two parts, Events and Listeners. Let's say that Browser 1 (B1) wants to send an object to Browser 2 (B2), B1 fires an event, which contains an object, onto the bus. B2 has started a listener to watch for the event that B1 has placed on the bus.  Once B2 sees the event that it is looking for and retrieves it. The event is then removed from the bus.

Events can be fired from one browser and picked up by any number of other browsers. This is done by delaying the removal of events from the bus for a short time and by the listeners keeping track of what events they have already seen so they will not retrieve them more than once.

When an event is fired it can contain a JavaScript object of any type, which TBOB serializes to JSON before placing it on the bus. Once the event is retrieved by the reciving browser the JSON is desterilized back into its original form.


### Dependencies:
1. [jQuery](http://jquery.com/download/)
2. [JSON-js](https://github.com/douglascrockford/JSON-js)


### Methods:
**fireEvent(eventName, params)**
Usage:
```javascript
var foo = {
    bar: "chocolate ice cream in my mouth!!!"
};
tbob.fireEvent("AlertAboutSomething", foo);
```

**listenFor(eventName, callback(args))**
Usage:
```
tbob.listenFor("AlertAboutSomething", function(args){
    alert(args.bar);
})
```
