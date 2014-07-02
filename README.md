# 2browsers1bus
=============
![alt tag](https://github.com/chz160/2browsers1bus/raw/master/2b1b.jpg)
### A simple browser window service bus.


### Requirements:
1. [*jQuery*](http://jquery.com/download/)

1. [*JSON-js*](https://github.com/douglascrockford/JSON-js)


### Methods:
2. **fireEvent(eventName, params)**
Usage:
```javascript
var foo = {
    bar: "chocolate ice cream in my mouth!!!"
};
tbob.fireEvent("AlertAboutSomething", foo);
```

2. **listenFor(eventName, callback(args))**
Usage:
```
tbob.listenFor("AlertAboutSomething", function(args){
    alert(args.bar);
})
```
