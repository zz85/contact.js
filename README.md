Contact.js
==========

> Contact.js is a multi-touch event emulator for non hardware multi-touch browsers by utilizing websockets.

In another words, you may beam multi-touch events from your mobile device to touch enabled web applications running on your desktop. You may also view contact.js as a  wireless multi-touch remote control.

How it works
--
There are 3 components to contact.js.

1. contact.js server
2. contact.js transmitter
3. contact.js receiver

The server is a node.js application which handles serves up contact.js and handle the websocket communication betwen the transmitter and receiver.

The transmitter is what you use to beam touch events for. This is probably your mobile phone or tablet. You would probably load it using a websocket supported browser (eg. Mobile Firefox/Chrome/Safari).

The receiver is your web application that utilizes multi-touch events. You probably just need to include a script to initialize its connection to the server.

Usage
--

###Server
Make sure you have node.js dependenices installed
(run `npm install`)

```
cd contact.js // change to contact.js directory
node src/server.js // run the server application
```
You can see something like
>Running at http server on http://192.168.1.88:8000/
>Running at contact.js websocket server on http://192.168.1.88:8080/

if its successful.

###Transmitter
Include `src/transmitter.js` if you write your own interface.

Otherwise open the transmitter demo file on your mobile device. Eg.
```
http://192.168.1.88:8080/transmitter.html
```

###Recevier
Include `src/recevier.js` into your own application.

Otherwise open the recevier demo file on your desktop, Eg.
```
http://localhost:8080/recevier.html
```

Changelog
--

16 Feb 17 - Remote Mouse / Trackpad

2 Mar 13 - Initial Prototype


What is supported
--
Probably simple use cases and demos of multi-touch web applications.

What is not supported
--
Probably anything else.
Also checkout [remote.js](https://github.com/jtangelder/remote.js), a project inspired by this.

Features that would be good to have
--
1. Support scaling for mapping difference in screen sizes
2. Binary protocol for more effecient network usage
3. Multi-channel server to support more clients / receivers
4. Better implementation of the W3C TouchEvent specifications
5. Refactor this into a nice client library
6. Put this on a public server

Think you can contribute something? Make a [pull request](https://github.com/zz85/contact.js).

Questions?
--
Create an issue or ask me on [twitter](http://twitter.com/blurspline).

License
--
MIT
