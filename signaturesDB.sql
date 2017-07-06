DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL primary key,
    firstname VARCHAR(255) not null,
    lastname VARCHAR(255) not null,
    timestamp TIMESTAMP default current_TIMESTAMP,
    signature TEXT
);
