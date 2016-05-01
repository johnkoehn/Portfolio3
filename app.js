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

var currentColor = 'red';
var timesSinceGreen = 0;
var tickTime = 0;
var betting = false;

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

app.get('/time', function(req, res)
{
    res.sendStatus(tickTime);
});

app.get('/color', function(req, res)
{
    res.send(currentColor);
});

app.get('/points', function(req, res)
{
    var fs = require('fs');
    var array = fs.readFileSync('users.txt').toString().split(",");

    var index = array.indexOf(req.session.username);
    res.send(array[index+2]);
});

app.get('/login', function(req, res)
{
    res.render('login.html');
});

app.get('/bets', function(req, res)
{
    res.send({redPoints: redPoints, greenPoints: greenPoints, blackPoints: blackPoints});
});

app.post('/session', function(req, res)
{
    req.session.points = req.body.points;
    console.log(req.session.points);
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

app.get('/logout', function(req, res)
{
    req.session = null;
    res.redirect('login.html');
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
        io.sockets.emit('bets', redPoints, greenPoints, blackPoints);
    });

    socket.on('updatePoints', function(name, points)
    {
        //find the name in users and then update the number of points
        //go through the file, and check usernames
        console.log(points);
        var fs = require('fs');
        var array = fs.readFileSync('users.txt').toString().split(",");

        var index = array.indexOf(name);
        array[index + 2] = points;
        console.log(array[index + 2]);

        var string = '';
        for(var i = 0; i < array.length; i++)
        {
            if((i+1) != array.length)
            {
                string +=array[i] + ",";
            }
            else
            {
                string +=array[i];
            }
        }
        fs.writeFileSync("users.txt", string, 'utf8');
    });
});

//this functions decides the winning color, sends the information to the clients
//and then after a set period, allows betting again
function betDecider(callback)
{
    if(!betting && tickTime == 20)
    {
        tickTime = 0;
        console.log("Started Cycle");
        betting = true;
        var time = 0;
        var winningColor = Math.floor(Math.random() * 15) + 1;
        var numOfCycles = winningColor + 30;

        //send out the information to all clients
        io.sockets.emit('cycle', winningColor, numOfCycles);

        //calculate approximate time to wait and then tell the client when to change color
        time = 0;
        for(var i = 1; i <= numOfCycles; i++)
        {
            if(timesSinceGreen == 15)
            {
                currentColor = 'Green';
                timesSinceGreen = 0;
            }
            else if(currentColor == 'Red' || currentColor == 'Green')
                currentColor = 'Black';
            else
                currentColor = 'Red';

            time += i * 10;
            if(i != numOfCycles)
                setTimeout(colorChange.bind(undefined, currentColor, false), (time));
            else
                setTimeout(colorChange.bind(undefined, currentColor, true), (time));

            timesSinceGreen += 1;
        }
        redPoints = 0;
        greenPoints = 0;
        blackPoints = 0;
    }
    else if(!betting)
    {
        tickTime += 1;
       // console.log(tickTime);
        io.sockets.emit('progressBar', 20 - tickTime);
    }


    callback();
}

function colorChange(newColor, sendReset)
{
    io.sockets.emit('changeColor', newColor);

    if(sendReset)
    {
        io.sockets.emit('reset', newColor);
        betting = false;
    }
}

(function schedule() {
    setTimeout(function () {
        betDecider(function() {
            schedule();
        });
    }, 1000);
}());

http.listen(3001, function () {
    console.log('Server listening on port 3001!');
});