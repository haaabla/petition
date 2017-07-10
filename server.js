const express = require('express');
const app = express();
const fs = require('fs');
const hb = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const spicedPg = require('spiced-pg');
const cookieSession = require('cookie-session');
const sqlQuery = require('./sqlQuery.js');
const password = require('./password.js');
var bcrypt = require('bcryptjs');
const db = spicedPg('postgres:postgres:password@localhost:5432/signaturesDB');

app.use(express.static(__dirname + '/public/'));

app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//COOKIE MIDDLEWARE
app.use(cookieSession({
    secret: 'my own secret code',
    maxAge: 1000 * 60 * 60 * 24 * 14
}));

//RE-DIRECTING
app.use((req, res, next) => {
    if (!req.session.user) {
        if (req.url != '/register' && req.url != '/login') {
            res.redirect('/register');
        } else {
            next();
        }
    } else {
        if ( req.url == '/register' || req.url == '/login') {
            res.redirect('/petition');
        } else {
            next();
        }
    }
});

app.get('/', (req, res) => {
    res.redirect('/petition')
});

app.get('/petition', (req, res) => {
    res.render('petition', {
        layout: 'main-layout-template'
    });
});

// app.use((req, res, next) => {
//     if (req.session.user) {
//         if (req.url != '/register' && req.url != '/login') {
//             res.redirect('/register');
//         }
//         else {
//             next();
//         }
//     }
//     else {
//         if (req.session.user) {
//             if (req.url != '/register' && req.url != '/login') {
//                 res.redirect('/register');
//             }
//             else {
//                 next();
//             }
//         }
//     }
// });

//POST TO DATABASE & SET COOKIE
app.post('/petition', (req, res) => {
    db.query("INSERT INTO signatures (user_id, first_name, last_name, signature) VALUES ($1,$2,$3,$4)", [req.session.user.id, req.body.firstname, req.body.lastname, req.body.signature]).then(() => {
        res.redirect('/thanks');
    });
});

//REGISTER PAGE
app.get('/register', (req, res) => {
    res.render('layouts/register', {
        layout: 'main-layout-template'
    });
});

//REGISTER POST
app.post('/register', (req, res) => {
    password.hashPassword(req.body.password).then((hashed) => {
        sqlQuery.insertUser(req.body, hashed).then((id) => {
            req.session.user = {
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                password: hashed,
                id: id
            };
            res.redirect('/petition');
        }).catch((err) => {
            console.log(err);
            res.render('layouts/register', {
                layout: 'main-layout-template',
                error: 'This email already exists :('
            });
        });
    });
});

//ONBOARD PAGE
app.get('/onboard', (req, res) => {
    res.render('layouts/onboard', {
        layout: 'main-layout-template'
    });
});

//LOGIN
app.get('/login', (req, res) => {
    res.render('layouts/login', {
        layout: 'main-layout-template'
    });
});

//CHECK LOGIN/PASSWORD MATCH
app.post('/login', function(req,res) {
    db.query("SELECT id, first_name, last_name, email, password FROM users WHERE email=$1",[req.body.email])
    .then(function(userInfo){
        console.log(req.body.email);
        console.log(req.body.password);
        bcrypt.compare(req.body.password, userInfo.rows[0].password, function(err, doesMatch) {
            if(!doesMatch) {
                console.log('Login / Password does not match');
                res.render('layouts/login', {
                    layout: 'main-layout-template',
                    incorrect: 'Incorrect password ;/'
                });
            }
            else if (doesMatch){
                console.log(doesMatch);
                req.session.user = {
                    id: userInfo.rows[0].id,
                    firstname: userInfo.rows[0].firstname,
                    lastname: userInfo.rows[0].lastname,
                    email: userInfo.rows[0].email
                };
                res.redirect('/petition');
            }
        });
    }).catch(function(err){
        console.log(err);
        res.render('layouts/login', {
            layout: 'main-layout-template',
            incorrect: 'Cannot find user with matching password and email'
        });
    });
});

//THANKS
app.get('/thanks', (req, res) => {
    db.query('SELECT signature FROM signatures WHERE user_id =' + req.session.user.id).then((results) => {
        res.render('layouts/thanks', {
            layout: 'main-layout-template',
            sigImg: results.rows[0].signature
        });
    });
});

//SIGNEES
app.get('/signees', (req, res) => {
    db.query('SELECT first_name, last_name FROM signatures').then((results) => {
        res.render('layouts/signees', {
            layout: 'main-layout-template',
            listSignees: results.rows
        });
    }).catch((err) => {
        console.log(err);
    });

});

app.listen(8080, () => console.log('-- Port: 8080 Initialised --'));
