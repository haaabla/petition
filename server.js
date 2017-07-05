const express = require('express');
const app = express();
const fs = require('fs');
const hb = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const spicedPg = require('spiced-pg');

app.use('/public', express.static(__dirname + '/public/'));
app.use(express.static(__dirname)); //may not need - double check

app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

//DATABASE
var db = spicedPg('postgres:postgres:password@localhost:5432/signaturesDB');

//COOKIES
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/', function(req, res) {
    res.redirect('/petition')
});

app.get('/petition', function(req, res) {
    if (req.cookies.acceptedCookie === 'NomNomNom'){
        res.redirect('/thanks')
    }
    else {
        res.render('petition', {
            layout: 'main-layout-template'
        });
    }
});

app.post('/petition', function(req, res) {
    db.query("INSERT INTO signatures (firstname, lastname, signature) VALUES ($1,$2,$3)",[req.body.firstname,req.body.lastname,req.body.signature]).then(function(result){
        console.log(result.rows);
    }).catch(function(err){
        console.log(err);
    });
    if (res.cookie('acceptedCookie', 'NomNomNom')) {
        res.redirect('/thanks');
    }
});

//THANKS
app.get('/thanks', function(req, res) {
    res.render('layouts/thanks', {
        layout: 'main-layout-template',
    });
});

//SIGNEES
app.get('/signees', function(req, res) {
    res.render('layouts/signees', {
        layout: 'main-layout-template',
    });
});

app.listen(8080, () => console.log('-- Port: 8080 Initialised --'));
