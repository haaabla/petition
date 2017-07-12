const spicedPg = require('spiced-pg');
const db = spicedPg(process.env.DATABASE_URL || 'postgres:postgres:password@localhost:5432/signaturesDB');

exports.insertUser = (data, hashed) => {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO users (first_name, last_name, email, password) VALUES ($1,$2,$3,$4) RETURNING id", [data.firstname, data.lastname, data.email, hashed]).then((results) => {
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
            console.log('this is the insert Error', error);
            reject(error);
        });
    });
};

exports.signPetition = (id, data) => {
    return new Promise((resolve, reject) => {
        var query = "INSERT INTO signatures (user_id, signature) VALUES ($1,$2)";

        db.query(query, [id, data.signature]).then(() => {
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

exports.deleteSignature = (id) => {
    return new Promise((resolve, reject) => {
        var query = "DELETE FROM signatures WHERE user_id=$1";

        db.query(query, [id]).then((message) => {
            console.log(message);
            resolve('success');
        }).catch((error) => {
            console.log(error);
            reject(error);
        });
    });
};

exports.signeesByCity = (city) => {
    return new Promise((resolve, reject) => {
        var query = `SELECT users.id, users.first_name, users.last_name, user_profiles.age, user_profiles.url FROM users LEFT JOIN user_profiles ON (users.id = user_profiles.user_id) JOIN signatures ON (users.id = signatures.user_id) WHERE user_profiles.city = initcap('${city}')`;

        db.query(query).then((results) => {
            resolve(results.rows);
        }).catch((error) => {
            console.log(error);
            reject(error);
        });
    });
};

exports.countSignees = () => {
    return new Promise((resolve, reject) => {
        var query = "SELECT COUNT(signature) FROM signatures";

        db.query(query).then((resultcount) => {
            resolve(resultcount.rows[0].count);
        });
    });
};
