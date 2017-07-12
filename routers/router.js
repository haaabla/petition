const express = require('express');
const router = express.Router();
const sqlQuery = require('../public/js/sqlQuery.js');
const password = require('../public/js/password.js');
const spicedPg = require('spiced-pg');
const db = spicedPg(process.env.DATABASE_URL || 'postgres:postgres:password@localhost:5432/signaturesDB');
const bcrypt = require('bcryptjs');

/********************** RE-DIRECTING **********************/
router.use((req, res, next) => {
    if (!req.session.user) {
        if (req.url != '/register' && req.url != '/login') {
            res.redirect('/register');
        } else {
            next();
        }
    } else {
        // if (req.url == '/petition') {
        //     res.redirect('/thanks');
        // }
        if (req.url == '/register' || req.url == '/login' || req.url == '/petition') {
            res.redirect('/thanks');
        } else {
            next();
        }
    }
});

/********************** REGISTER **********************/
router.route('/register')
    .get((req, res) => {
        res.render('layouts/register', {
            layout: 'main-layout-template',
            csrfToken: req.csrfToken()
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
            }).catch((error) => {
                console.log(error);
                res.render('layouts/register', {
                    layout: 'main-layout-template',
                    error: 'This email already exists :(',
                    csrfToken: req.csrfToken()
                });
            });
        });
    })
;

/********************** ONBOARD **********************/
router.route('/onboard')
    .get((req, res) => {
        res.render('layouts/onboard', {
            layout: 'main-layout-template',
            csrfToken: req.csrfToken()
        });
    })

    .post((req, res) => {
        if (!req.body.age.length) {
            req.body.age = null;
        }
        req.session.user.age = req.body.age;
        req.session.user.city = req.body.city;
        req.session.user.url = req.body.url;
        sqlQuery.insertProfile(req.session.user.id, req.body).then((message) => {
            console.log(message);
            res.redirect('/petition');
        });
    })
;

/********************** LOGIN **********************/
router.route('/login')
    .get((req, res) => {
        res.render('layouts/login', {
            layout: 'main-layout-template',
            csrfToken: req.csrfToken()
        });
    })

    .post((req,res) => {
        console.log('hello we are in login.POST');
        db.query("SELECT id, first_name, last_name, email, password FROM users WHERE email=$1",[req.body.email])
        .then(function(userInfo){
            bcrypt.compare(req.body.password, userInfo.rows[0].password, function(err, doesMatch) {
                if(!doesMatch) {
                    console.log('Login / Password does not match');
                    res.render('layouts/login', {
                        layout: 'main-layout-template',
                        incorrect: 'Incorrect password ;/'
                    });
                }
                else if (doesMatch){
                    req.session.user = {
                        id: userInfo.rows[0].id,
                        firstname: userInfo.rows[0].firstname,
                        lastname: userInfo.rows[0].lastname,
                        email: userInfo.rows[0].email
                    };
                    res.redirect('/petition');
                }
            });
        }).catch(function(error){
            console.log(error);
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
        res.render('layouts/petition', {
            layout: 'main-layout-template',
            csrfToken: req.csrfToken()
        });
    })

    .post((req, res) => {
        sqlQuery.signPetition(req.session.user.id, req.body)
        .then(() => {
            res.redirect('/thanks');
        }).catch((error) => {
            console.log(error);
        });
    })
;

/********************** THANKS **********************/
router.route('/thanks')
    .get((req, res) => {
        sqlQuery.countSignees().then((resultcount) => {
            db.query('SELECT signature FROM signatures WHERE user_id = $1', [req.session.user.id])
            .then((results) => {
                res.render('layouts/thanks', {
                    layout: 'main-layout-template',
                    sigImg: results.rows[0].signature,
                    count: resultcount
                });
            });
        });
    })
;

/********************** DELETE SIGNATURE **********************/
router.route('/delete')
    .post((req, res) => {
        sqlQuery.deleteSignature(req.session.user.id)
        .then((message) => {
            res.redirect('/petition');
        }).catch((error) => {
            console.log(error);
        });
    })
;

/********************** EDIT PROFILE **********************/
router.route('/profile/edit')
    .get((req, res) => {
        db.query("SELECT users.first_name, users.last_name, user_profiles.age, user_profiles.city, user_profiles.url FROM users LEFT JOIN user_profiles ON user_profiles.user_id = users.id")
        .then(() => {
            res.render('layouts/edit', {
                layout: 'main-layout-template',
                csrfToken: req.csrfToken(),
                firstname: req.session.user.firstname,
                lastname: req.session.user.lastname,
                email: req.session.user.email,
                age: req.session.user.age,
                city: req.session.user.city,
                url: req.session.user.url
            });
        });
    })

    .post((req, res) => {
        password.hashPassword(req.body.password).then((hashed) => {
            sqlQuery.updateUser(req.body, req.session.user.id, hashed)
            .then(() => {
                sqlQuery.updateOptionals(req.body, req.session.user.id)
                .then(() => {
                    res.redirect('/thanks');
                }).catch((error) => {
                    console.log(error);
                });
            });
        });
    })
;

/********************** SIGNEES **********************/
router.route('/signees')
    .get((req, res) => {
        db.query("SELECT users.first_name, users.last_name, user_profiles.age, user_profiles.city, user_profiles.url FROM users INNER JOIN user_profiles ON user_profiles.user_id = users.id INNER JOIN signatures ON user_profiles.user_id = signatures.user_id")
        .then((results) => {
            res.render('layouts/signees', {
                layout: 'main-layout-template',
                list: results.rows
            });
        }).catch((err) => {
            console.log(err);
        });
    })
;

/********************** SIGNEES BY CITY **********************/
router.route('/signees/:city')
    .get((req, res) => {
        sqlQuery.signeesByCity(req.params.city).then((results) => {
            res.render('layouts/signee-by-city', {
                layout: 'main-layout-template',
                signees: results
            });
        });
    })
;

router.get('/', (req, res) => {
    res.redirect('/petition');
});

module.exports = router;
