/**
 * Created by John Koehn on 4/29/2016.
 */

var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('views', __dirname);
app.use(express.static(__dirname));
app.engine('html', require('ejs').renderFile);

app.use(cookieParser());
app.use(session({secret: 'ssshhhhh'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var sess;
var name;
var activeUsers = [];

//betting information
var redPoints = 0;
var greenPoints = 0;
var blackPoints = 0;

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

app.get('/register', function(req, res)
{
    res.render('register.html');
});

app.get('/name', function(req, res)
{
    res.end(req.session.username);
});

app.get('/points', function(req, res)
{
    //console.log(req.session.points);
    res.end(req.session.points);
});

app.get('/login', function(req, res)
{
    res.render('login.html');
});

app.get('/bets', function(req, res)
{
    res.send({redPoints: redPoints, greenPoints: greenPoints, blackPoints: blackPoints});
});

app.post('/register', function(req, res)
{
    sess = req.session;

    //check is the passwords are the same
    if(req.body.password == req.body.password2)
    {
        //go through the file, and check usernames
        var fs = require('fs');
        var array = fs.readFileSync('users.txt').toString().split(",");
        var unique_username = true;
        for(i in array)
        {
            if((i % 3) == 0 && req.body.username == array[i])
            {
                res.end('Username already exists!!');
                unique_username = false;
                break;
            }
        }

        if(unique_username)
        {
            //write the data to file
            var string = '';
            for(i in array)
            {
                string +=array[i] + ",";
            }
            string += req.body.username + "," + req.body.password + "," + "10000";
            fs.writeFileSync("users.txt", string, 'utf8');
            res.end('Account registered! Login or register another account');
        }
    }
    else
    {
        res.end('Passwords don\'t match!!!');
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
            req.session.username = req.body.username;
        }
        else if(pass == 1 && req.body.password == array[i])
        {
            //set session to active
            sess.loggedIn = true;
            pass = 2;



        }
        else if(pass == 2)
        {
            //get the number of points the user has
            req.session.points = array[i];
            console.log(array[i]);
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

    socket.on('message', function(message)
    {
        io.sockets.emit('new_message', message);
    });

    socket.on('bet', function(color_selected, points_bet)
    {
        points_bet = parseInt(points_bet);
        if(color_selected == "red")
        {
            redPoints += points_bet;
        }
        else if(color_selected == "green")
        {
            greenPoints += points_bet;
        }
        else if(color_selected == "black")
        {
            blackPoints += points_bet;
        }
        else
        {
            console.log("Invalid color bet!!!");
        }

        //send the updated color data to all the clients
        io.sockets.emit('bets', redPoints, greenPoints, blackPoints)
    });
});

http.listen(3001, function () {
    console.log('Server listening on port 3001!');
});