var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));
var server = require('http').Server(app);
var io = require('socket.io')(server);
var chat = io.of('/chat'); // chat namespace
var stdin = process.openStdin();
stdin.addListener("data", function (d) {
    var command = d.toString().trim();
    var commandsplit = command.split(" ");
    console.log("Command: [" + command + "]");

});

server.listen(80);
console.log('Server started at port: 80');

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.get('/chat', function (req, res) {
    res.sendFile(__dirname + '/chat.html');
});

var blockDoubleConnections = true; // set to true to allow 1 user per ip
var addressList = {};
var serverData = {
    'online': 0,
    'playerData': {},
    'timeOnline': 0,
    'currentTime': '-'
};

var admins = {'::1': true};

//limit to 1 connection
chat.use(function(socket, next){
    if(blockDoubleConnections){
        var tempid = socket.handshake.address;
        var socketclients = io.sockets.server.eio.clients;
        if(typeof addressList[tempid] === "undefined") {
            next();
        }else{
            if (socketclients[addressList[tempid].id] === undefined || (parseInt(serverData['time']) - parseInt(addressList[tempid].time) > 2)) {
                next();
            }else{
                console.log(tempid + ' has already connected.');
                socket.emit('blocked', 'You\'re already logged in from your current IP address');
                next(new Error('You are already connected!'));
            }
        }
    }else{
        next();
    }

});

chat.on('connection', function (socket) {

    var address = socket.handshake.address;
    var socketid = socket.id;

    addressList[address] = {'id':socketid, 'time': serverData['timeOnline']};

    serverData['playerData'][socketid] = {
        'id': socketid,
        'name': socketid,
        'admin': false,
        'connected': false
    };

    if(typeof admins[address] !== "undefined" && admins[address] === true){
        serverData['playerData'][socketid]['admin'] = true;
    }


    socket.on('init connect', function(data){
        if(data != ""){
            socket.emit('init confirm', true);

            serverData['playerData'][socketid]['name'] = data;
            globalMessage(serverData['playerData'][socketid]['name'] + " has joined the chat server");
            serverData['playerData'][socketid]['connected'] = true;
        }else{
            socket.emit('init confirm', false);
        }

    });

    socket.on('disconnect', function (data) {
        if(serverData['playerData'][socketid]['connected'] == true){
            if (typeof serverData['playerData'][socketid] !== "undefined") {
                globalMessage(serverData['playerData'][socketid]['name'] + ' has left the server.');
            }else{
                globalMessage(socketid + ' has left the server.');
            }
        }
        delete serverData['playerData'][socketid];
        delete addressList[address];
    });

    socket.on('player message', function (data) {
        if(data != ""){
            console.log('Msg from: ' + serverData['playerData'][socketid]['name'] + " msg: " + data);
            globalMessage(data, serverData['playerData'][socketid]['name']);
        }
    });

    socket.on('player changename', function (data) {

        if (serverData['playerData'][socketid]['name'] != data) {
            serverData['playerData'][socketid]['name'] = data;
            globalMessage(socketid + " changed name to " + data);
        }

    });

    socket.on('player move', function (data) {
        if (typeof serverData['playerData'][socketid]['coords'] !== "undefined") {
            serverData['playerData'][socketid]['coords'] = data;
            serverData['playerData'][socketid]['time'] = serverData['timeOnline'];
            addressList[address].time = serverData['timeOnline'];
        }
    });

});

setInterval(function () {
    emitServerData();
}, 50);

setInterval(function () {
    console.log('');
    console.log(serverData);
    console.log(addressList);
}, 5000);

function emitServerData(){
    serverData['online'] = Object.keys(serverData['playerData']).length;
    var tempData = serverData;
    chat.emit('update serverData', tempData);
}

function globalMessage(message, from, target) {
    target = typeof target !== 'undefined' ? target : 'Everyone';
    from = typeof from !== 'undefined' ? from : 'System';

    var resultPackage = {'target': target, 'msg': message, 'from': from};
    console.log('');
    console.log('Globalmessage', resultPackage);
    chat.emit('global message', resultPackage);
}

setInterval(function () {
    var curDate = new Date();
    var datetext = curDate.toTimeString().split(' ')[0]
    serverData['timeOnline']++;
    serverData['currentTime'] = datetext;
}, 1000);




















