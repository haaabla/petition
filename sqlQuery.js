const spicedPg = require('spiced-pg');
const db = spicedPg('postgres:postgres:password@localhost:5432/signaturesDB');

exports.insertUser = (data, hashed) => {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO users (first_name, last_name, email, password) VALUES ($1,$2,$3,$4) RETURNING id", [data.firstname, data.lastname, data.email, hashed]).then((results) => {
            // console.log(results.rows[0].id);
            resolve(results.rows[0].id);
        }).catch((err) => {
            reject(err);
        });
    });
};

// exports.insertIdToSig = (id) => {
//     return new Promise((resolve, reject) => {
//         db.query("SELECT users.id FROM users JOIN signatures ON users.id = signatures.user_id").then((results) => {
//             console.log('we made it through');
//             console.log(results);
//             resolve('hejsan');
//         }).catch((err) => {
//             reject(err);
//         });
//     });
// };
