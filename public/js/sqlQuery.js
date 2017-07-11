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

exports.insertProfile = (id, data) => {
    return new Promise((resolve, reject) => {
        var query = "INSERT INTO user_profiles (user_id, age, city, url) VALUES ($1,$2,$3,$4)";

        db.query(query, [id, data.age, data.city, data.url]).then(() => {
            resolve('success');
        }).catch((error) => {
            console.log(error);
            reject(error);
        });
    });
};
