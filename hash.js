const bcrypt = require('bcrypt');

const password = '123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    console.log("Your Hash:", hash);
});