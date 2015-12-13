(function () {
    $('#mainChatView').hide();
    $('#loadScreen').show();
    $('#namechangediv').hide();
})();

var socket = io.connect('/chat');
var socketid = socket.io.engine.id;
var serverData = {
    'online': 0,
    'playerData': {},
    'timeOnline': 0,
    'currentTime': '-'
};
var connected = false,
    username = socketid;

// test connection
socket.on('connect', function () {
    socketid = socket.io.engine.id; //set socketid
    if (socket.connected) {
        requestUsername();
    }
});

socket.on('disconnect', function () {
    failConnect('Lost contact with server');
});

socket.on('blocked', function (msg) {
    failConnect(msg);
});

socket.on('refresh', function (data) {
    location.reload(); // refresh page
});

socket.on('global message', function (data) {
    if (data.target === "Everyone" || data.target === socketid) {
        displayMessage('<strong>' + data.from + '</strong>', data.msg);
    }
});

socket.on('init confirm', function (data) {
    if(data === true){
        $('#loadScreen').hide();
        $('#mainChatView').show();
        connected = true;
    }else{
        requestUsername();
        connected = false;
    }

});

// receive game data from server
socket.on('update serverData', function (data) {
    if (connected === true) {
        socketid = socket.io.engine.id;
        serverData = data;

        $('#online-count').text("Online: " + serverData['online']);
        $('#currenttime').text("Server time: " + serverData['currentTime']);
        $('#timeonline').text("Time online: " + toHHMMSS(serverData['timeOnline']));
        $('#usernamelabel').text(username);

        $('#userlist').html(""); // clear list
        $.each(serverData['playerData'], function (key, val) {

            var temppro = "fa fa-user";
            if (val.admin === true) {
                temppro = "fa fa-user-times";
            }
            $('#userlist').append('<li class="' + temppro + '"> ' + val.name + '</li>');
        });
    }
});

$('#mainmessagesform').on('submit', function () {
    socket.emit('player message', $('#mainmessageinput').val().trim());
    $('#mainmessageinput').val("");
    return false;
});

// register name change request
$('#namechangeform').on('submit', function (e) {
    name = $('#username').val().trim();
    username = name;
    socket.emit('init connect', name);
    $.cookie('nodejs_playgroundchat_username', name, {expires: 31, path: '/'});
    $('#namechangediv').hide();
    $('#loadScreen').show();
    $('#mainChatView').hide();
    e.preventDefault();
});

function requestUsername() {
    $('#namechangediv').show();
    $('#loadScreen').hide();
    $('#mainChatView').hide();
    if (typeof $.cookie('nodejs_playgroundchat_username') !== "undefined" && $.cookie('nodejs_playgroundchat_username') != "undefined") {
        $('#username').val($.cookie('nodejs_playgroundchat_username'));
    }
}

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function successConnect() {
    enabled = true;
    $('#mainChatView').show();
    $('#loadScreen').hide();
    $('#usernamelabel').text(serverData['playerData'][socketid]['name']);
    console.log('Connected to server');
}

function failConnect(msg) {
    msg = typeof msg !== 'undefined' ? msg : 'Failed to connect to the server';
    enabled = false;
    $('#mainChatView').hide();
    $('#namechangediv').hide();
    $('#loadScreen').show();
    $('#loadingMessage').text(msg);
    console.log(msg);
}

function displayMessage(from, message) {

    var template = '<li class="hidden-li">'
        + '<div class="row">'
        + ' <div class="col-lg-12">'
        + '<div class="media">'
        + '<div class="media-body">'
        + '<h4 class="media-heading">' + from
        + '<span class="small pull-right">' + serverData['currentTime'] + '</span>'
        + '</h4>'
        + '<p>' + message + '</p>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '<hr>'
        + '</li>';

    if ($('#messagelist li').length >= 20) {
        $("#messagelist li:last-child").remove();
    }

    $('#messagelist').prepend(template);
}

// seconds to minutes
function toHHMMSS(input) {
    var sec_num = parseInt(input, 10);
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    var time = hours + ':' + minutes + ':' + seconds;
    return time;
}

console.log('Loadded the main js file');













