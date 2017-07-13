const express = require('express');
const router = express.Router();
const sqlQuery = require('../public/js/sqlQuery.js');
const password = require('../public/js/password.js');
const spicedPg = require('spiced-pg');
const db = spicedPg(process.env.DATABASE_URL || 'postgres:postgres:password@localhost:5432/signaturesDB');
const bcrypt = require('bcryptjs');

const csrf = require('csurf');
router.use(csrf({ cookie: true }));

/********************** RE-DIRECTING **********************/
router.use((req, res, next) => {
    if (!req.session.user) {
        if (req.url != '/register' && req.url != '/login') {
            res.redirect('/register');
        } else {
            next();
        }
    }
    else if (req.url == '/petition' && req.session.user.signed == true) {
        console.log('Re-directed through /register+login ------> thanks');
        console.log(req.session.user);
        res.redirect('/thanks');
    }
    else {
        if (req.url == '/register' || req.url == '/login') {
            console.log('Re-directed through /register+login ------> thanks');
            console.log(req.session.user);
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
                    id: id,
                    signed: false
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
        db.query("SELECT id, first_name, last_name, email, password FROM users WHERE email=$1",[req.body.email])
        .then(function(userInfo){
            bcrypt.compare(req.body.password, userInfo.rows[0].password, function(err, doesMatch) {
                if(!doesMatch) {
                    console.log('Login / Password does not match');
                    res.render('layouts/login', {
                        layout: 'main-layout-template',
                        incorrect: 'Incorrect password ;/',
                        csrfToken: req.csrfToken()
                    });
                }
                else if (doesMatch){
                    console.log('2   doesMatch before: reqBody: ', req.body);
                    req.session.user = {
                        firstname: userInfo.rows[0].first_name,
                        lastname: userInfo.rows[0].last_name,
                        id: userInfo.rows[0].id,
                        email: userInfo.rows[0].email,
                        signed: undefined
                    };
                    sqlQuery.checkIfSigned(userInfo.rows[0].id).then((result) => {
                        if (result === 1) {
                            req.session.user.signed = true;
                            res.redirect('/thanks');
                        } else {
                            req.session.user.signed = false;
                            res.redirect('/petition');
                        }
                    });
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
            req.session.user.signed = true;
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
                    count: resultcount,
                    csrfToken: req.csrfToken()
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
        sqlQuery.getProfileInfo(req.session.user.id).then((info)=> {
            res.render('layouts/edit', {
                layout: 'main-layout-template',
                info: info,
                csrfToken: req.csrfToken()
            });
        }).catch((error) => {
            console.log('EDIT PROFILE: ', error);
        });
    })

    .post((req, res) => {
        console.log('pooooooooooooosting');
        console.log(req.body.password);
        //put if statement if user has/hasn't entered new password
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

router.get('/logout', function(req,res) {
    console.log('Logging out user');
    req.session.user = null;
    res.redirect('/register');
});

module.exports = router;
