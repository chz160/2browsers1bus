2browsers1bus
=============
#### *A simple browser window service bus.*
![Yummy chocolate ice cream!!](https://github.com/chz160/2browsers1bus/raw/master/2b1b.jpg)


### Dependencies:
[jQuery](http://jquery.com/download/)
[JSON-js](https://github.com/douglascrockford/JSON-js)


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
