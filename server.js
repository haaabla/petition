const express = require('express');
const app = express();
const fs = require('fs');
const hb = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const spicedPg = require('spiced-pg');
const cookieSession = require('cookie-session');

app.use('/public', express.static(__dirname + '/public/'));

app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

//DATABASE
const db = spicedPg('postgres:postgres:password@localhost:5432/signaturesDB');

//COOKIES
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.redirect('/petition')
});

app.get('/petition', (req, res) => {
    if (req.cookies.session === 'eyJpZCI6MX0='){
        res.redirect('/thanks')
    }
    else {
        res.render('petition', {
            layout: 'main-layout-template'
        });
    }
});

//COOKIE MIDDLEWARE
app.use(cookieSession({
    secret: 'my own secret code',
    maxAge: 1000 * 60 * 60 * 24 * 14
}));

//POST TO DATABASE & SET COOKIE
app.post('/petition', (req, res) => {
    db.query("INSERT INTO signatures (firstname, lastname, signature) VALUES ($1,$2,$3) RETURNING id", [req.body.firstname, req.body.lastname, req.body.signature]).then((results) => {
        req.session.id = results.rows[0].id;
        res.redirect('/thanks');
    });
});

//THANKS
app.get('/thanks', (req, res) => {
    db.query('SELECT signature FROM signatures WHERE id =' + req.session.id).then((results) => {
        res.render('layouts/thanks', {
            layout: 'main-layout-template',
            sigImg: results.rows[0].signature
        });
    });
});

//SIGNEES
app.get('/signees', (req, res) => {
    db.query('SELECT firstname, lastname FROM signatures').then((results) => {
        res.render('layouts/signees', {
            layout: 'main-layout-template',
            listSignees: results.rows
        });
    }).catch((err) => {
        console.log(err);
    });

});

app.listen(8080, () => console.log('-- Port: 8080 Initialised --'));
