"use strict";
const pool = require("../db/db");
//const UserStorage = require("./UserStorage");

class User {
    constructor(body) {
        this.body = body;
    }

    async booksearch(query) {
        try {
       
            const [rows] = await pool.query('SELECT * FROM book WHERE book_name LIKE ?', [`%${query}%`]);
        
            return rows; // 객체 안에 bookList 하나만 반환
        } catch (error) {
            console.error("도서 검색 중 오류 발생:", error);
            throw error;
        }
    }

    async usersearch(query) {
        try {
       
            const [rows] = await pool.query('SELECT * FROM user WHERE name LIKE ?', [`%${query}%`]);
        
            return rows; // 객체 안에 bookList 하나만 반환
        } catch (error) {
            console.error("회원 검색 중 오류 발생:", error);
            throw error;
        }
    }






}

module.exports = User;