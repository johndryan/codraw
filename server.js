#!/usr/bin/env node

/* Integrated code from http://gist.github.com/jeffkreeftmeijer/488562 */

/* Express 3 requires that you instantiate a `http.Server` to attach socket.io to first */
var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    crypto = require('crypto'),
    json = JSON.stringify,
    port = 8080,
    url  = 'http://localhost:' + port + '/';
/* We can access nodejitsu enviroment variables from process.env */
/* Note: the SUBDOMAIN variable will always be defined for a nodejitsu app */
if(process.env.SUBDOMAIN){
  url = 'http://' + process.env.SUBDOMAIN + '.jit.su/';
}

server.listen(port);
console.log("Express server listening on port " + port);
console.log(url);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

//Socket.io emits this event when a connection is made.
io.sockets.on('connection', function (client) {

    client.on('message', function(message){
      try {
        request = JSON.parse(message.replace('<', '&lt;').replace('>', '&gt;'));
      } catch (SyntaxError) {
        console.log('Invalid JSON:');
        console.log(message);
        return false;
      }
 
      if(request.action != 'close' && request.action != 'move' && request.action != 'speak') {
        console.log('Invalid request:' + "\n" + message);
        return false;
      }
 
      if(request.action == 'speak') {
        request.email = crypto.createHash('md5').update(request.email).digest("hex");
        client.send(json(request));
      }
    
      request.id = client.sessionId
      client.broadcast(json(request));
    });
 
    client.on('disconnect', function(){
      client.broadcast(json({'id': client.sessionId, 'action': 'close'}));
    });

});