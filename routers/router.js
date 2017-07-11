const express = require('express');
const router = express.Router();
const sqlQuery = require('../public/js/sqlQuery.js');
const password = require('../public/js/password.js');
const spicedPg = require('spiced-pg');
const db = spicedPg('postgres:postgres:password@localhost:5432/signaturesDB');
const bcrypt = require('bcryptjs');

/********************** RE-DIRECTING **********************/
router.route('/', (req, res) => {
    res.redirect('/petition');
});

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

/********************** REGISTER **********************/
router.route('/register')
    .get((req, res) => {
        res.render('layouts/register', {
            layout: 'main-layout-template'
        });
    })

    .post((req, res) => {
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
    })
;

/********************** ONBOARD **********************/
router.route('/onboard')
    .get((req, res) => {
        res.render('layouts/onboard', {
            layout: 'main-layout-template'
        });
    })

    .post((req, res) => {
        req.session.user.age = req.body.age;
        req.session.user.city = req.body.city;
        req.session.user.url = req.body.url;
        sqlQuery.insertProfile(req.session.user.id, req.body).then((message) => {
            console.log(message);
            res.redirect('petition');
        });
    })
;

/********************** LOGIN **********************/
router.route('/login')
    .get((req, res) => {
        res.render('layouts/login', {
            layout: 'main-layout-template'
        });
    })

    .post((req,res) => {
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
    })
;

/********************** PETITION **********************/
router.route('/petition')
    .get((req, res) => {
        res.render('petition', {
            layout: 'main-layout-template'
        });
    })

    .post((req, res) => {
        db.query("INSERT INTO signatures (user_id, first_name, last_name, signature) VALUES ($1,$2,$3,$4)", [req.session.user.id, req.body.firstname, req.body.lastname, req.body.signature]).then(() => {
            res.redirect('/thanks');
        });
    })
;

/********************** THANKS **********************/
router.route('/thanks')
     .get((req, res) => {
         db.query('SELECT signature FROM signatures WHERE user_id =' + req.session.user.id).then((results) => {
             res.render('layouts/thanks', {
                 layout: 'main-layout-template',
                 sigImg: results.rows[0].signature
             });
         });
     })
;

/********************** SIGNEES **********************/
router.route('/signees')
    .get((req, res) => {
        db.query("SELECT signatures.first_name, signatures.last_name, user_profiles.age, user_profiles.city, user_profiles.url FROM signatures LEFT JOIN user_profiles ON user_profiles.user_id = signatures.user_id").then((results) => {
            res.render('layouts/signees', {
                layout: 'main-layout-template',
                list: results.rows
            });
        }).catch((err) => {
            console.log(err);
        });
    })
;

router.route('/signee-city')
    .get((req, res) => {
        res.render('layouts/signee-city', {
            layout: 'main-layout-template'
        });
    })
;

module.exports = router;
