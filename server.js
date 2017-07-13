const express = require('express');
const app = express();
const hb = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const csrf = require('csurf');
const router = require('./routers/router.js');

app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(csrf({ cookie: true }));

/********************** SETTING SESSION **********************/
app.use(cookieSession({
    secret: 'my own secret code',
    maxAge: 1000 * 60 * 60 * 24 * 14
}));

/********************** ROUTES **********************/
app.use(express.static(__dirname + '/public'));
app.use(router);

app.listen(process.env.PORT || 8080, () => console.log('---------------------------- Port: 8080 Initialised ----------------------------'));
