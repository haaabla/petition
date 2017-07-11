const express = require('express');
const app = express();
const hb = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const spicedPg = require('spiced-pg');
const cookieSession = require('cookie-session');
const sqlQuery = require('./public/js/sqlQuery.js');
const password = require('./public/js/password.js');
const bcrypt = require('bcryptjs');
const db = spicedPg('postgres:postgres:password@localhost:5432/signaturesDB');
const router = require('./routers/router.js');

app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(cookieSession({
    secret: 'my own secret code',
    maxAge: 1000 * 60 * 60 * 24 * 14
}));




//RE-DIRECTING
router.use((req, res, next) => {
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
    res.redirect('/petition');
});

app.get('/petition', (req, res) => {
    res.render('petition', {
        layout: 'main-layout-template'
    });
});

//POST TO DATABASE & SET COOKIE
app.post('/petition', (req, res) => {
    db.query("INSERT INTO signatures (user_id, first_name, last_name, signature) VALUES ($1,$2,$3,$4)", [req.session.user.id, req.body.firstname, req.body.lastname, req.body.signature]).then(() => {
        res.redirect('/thanks');
    });
});

//REGISTER PAGE


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
            res.redirect('/onboard');
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

app.post('/onboard', (req, res) => {
    db.query("INSERT INTO user_profiles (user_id, age, city, url) VALUES ($1,$2,$3,$4)", [req.session.user.id, req.body.age, req.body.city, req.body.url]).then(() => {
        res.redirect('petition');
    }).catch(function(err){
        console.log(err);
        res.redirect('petition');
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
    db.query("SELECT signatures.first_name, signatures.last_name, user_profiles.age, user_profiles.city, user_profiles.url FROM signatures LEFT JOIN user_profiles ON user_profiles.user_id = signatures.user_id").then((results) => {
        res.render('layouts/signees', {
            layout: 'main-layout-template',
            list: results.rows
        });
    }).catch((err) => {
        console.log(err);
    });
});

//SIGNEE CITY
app.get('/signee-city', (req, res) => {
    res.render('layouts/signee-city', {
        layout: 'main-layout-template'
    });
});

/*********** ROUTES ***********/
app.use(express.static(__dirname + '/public/'));
app.use(router);

app.listen(8080, () => console.log('-- Port: 8080 Initialised --'));
