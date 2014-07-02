# 2browsers1bus
=============
![alt tag](https://github.com/chz160/2browsers1bus/raw/master/2b1b.jpg)

## A simple browser window service bus.

### *Requires the jQuery and JSON libraries.*



### Methods:
1. **fireServiceBusEvent(eventName, params)**
Usage:
```javascript
var foo = {
    bar: "chocolate ice cream in my mouth!!!"
};
tbob.fireServiceBusEvent("AlertAboutSomething", foo);
```

2. **listenFor(eventName, callback(args))**
Usage:
```
tbob.listenFor("AlertAboutSomething", function(args){
    alert(args.bar);
})
```
