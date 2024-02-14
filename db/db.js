const mysql = require("mysql2/promise")

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "0000",
    port: 3306,
    database: "book1",
})


module.exports = pool;