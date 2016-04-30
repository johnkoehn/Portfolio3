/**
 * Created by John Koehn on 4/29/2016.
 */

var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');


var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('views', __dirname);
app.use(express.static(__dirname));
app.engine('html', require('ejs').renderFile);

app.use(session({secret: 'ssshhhhh'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var sess;
var name;
var activeUsers = [];

app.get('/', function (req, res)
{
    sess = req.session;

    //check to see if the user is logged in already
    if(sess.loggedIn)
    {
        res.render('game.html');
    }
    else
    {
        res.render('login.html');
    }
});

app.get('/game', function(req, res)
{
    sess = req.session;

    //check to see if the user is logged in already
    if(sess.loggedIn)
    {
        res.render('game.html');
    }
    else
    {
        res.render('login.html');
    }
});

app.post('/login', function(req, res)
{
    sess = req.session;

    //open up the users file and check if the login data matches
    var success = false;
    var pass = 0;
    var fs = require('fs');
    var array = fs.readFileSync('users.txt').toString().split(",");
    var username;
    for(i in array)
    {
        if((i % 3) == 0 && req.body.username == array[i])
        {
            pass = 1;
            username = req.body.username;
        }
        else if(pass == 1 && req.body.password == array[i])
        {
            //set session to active
            sess.loggedIn = true;
            break;
        }
        else
        {
            pass = 0;
        }
    }

    if(sess.loggedIn)
    {
        res.end('success');
    }
    else
    {
        res.end('failed');
    }

});

io.on('connection', function(socket){
    console.log('user connected');
});

http.listen(3001, function () {
    console.log('Server listening on port 3001!');
});