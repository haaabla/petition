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

exports.signPetition = (id, data) => {
    return new Promise((resolve, reject) => {
        var query = "INSERT INTO signatures (user_id, first_name, last_name, signature) VALUES ($1,$2,$3,$4)";

        db.query(query, [id, data.firstname, data.lastname, data.signature]).then(() => {
            resolve('success');
        }).catch((error) => {
            console.log(error);
            reject(error);
        });
    });
};

exports.updateUser = (data, id, hashed) => {
    return new Promise((resolve, reject) => {
        var query = "UPDATE users SET first_name=$1, last_name=$2, email=$3, password=$4 WHERE id=$5";

        db.query(query, [data.firstname, data.lastname, data.email, hashed, id]).then((message) => {
            console.log(message);
            resolve('success');
        }).catch((error) => {
            console.log(error);
            reject(error);
        });
    });
};

exports.updateOptionals = (data, id) => {
    return new Promise((resolve, reject) => {
        var query = "UPDATE user_profiles SET age=$1, city=$2, url=$3 WHERE user_id=$4";

        db.query(query, [data.age, data.city, data.url, id]).then((message) => {
            console.log(message);
            resolve('success');
        }).catch((error) => {
            console.log(error);
            reject(error);
        });
    });
};
