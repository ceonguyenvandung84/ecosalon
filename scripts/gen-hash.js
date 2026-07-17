const bcrypt = require("bcryptjs");
const pwd = "Admin@123";
const hash = bcrypt.hashSync(pwd, 10);
console.log(hash);
