/**
 * Created by John Koehn on 4/29/2016.
 */

var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var app = express();

app.use(session({secret: 'ssshhhhh'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
var sess;

app.get('/', function (req, res)
{
    sess = req.session;
    //res.send('Hello World!');
    sess.test = 'logged in';
    res.redirect('/login');
});

app.get('/login', function(req, res)
{
    sess = req.session;
    if(sess.test)
    {
        res.write('<h1> Login Please<h1>');
        console.log("good");
    }
    else
    {
        console.log("bad");
    }
});

app.listen(3001, function () {
    console.log('Example app listening on port 3001!');
});