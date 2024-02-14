const { render } = require("../app");
const pool = require("../db/db");
const User = require("../models/user");


const output = {

    mainView: async (req, res) => {


        return res.render('main', { user: req.session.user });
    },


    loginView: async (req, res) => {
        return res.render('login');
    },



    logout: (req, res) => {
        // 세션을 다시 시작
        req.session.regenerate((err) => {
            if (err) {
                console.error('로그아웃 중 오류 발생: ', err);
                res.status(500).send('로그아웃 중 오류가 발생했습니다.');
            } else {
                res.redirect('/');
            }
        });
    },





    joinView: async (req, res) => {
        return res.render('join');
    },

    userchkView: async (req, res) => {
        try {
            const [rows] = await pool.query('select * from user');
            res.render('userchk', { users: rows });

        }


        catch (error) {
            console.error("회원 조회 중 오류 발생:", error);
            throw error;

        }

    },

    bookView: async (req, res) => {

        try {

            let searchData = req.query.menuSearch || '';
            let q1;

            if (searchData === '') {
                // 검색어가 없을 때는 전체 메뉴 조회
                q1 = 'SELECT * FROM book';
            } else {
                // '%'를 사용하여 부분 일치 검색을 수행
                q1 = 'SELECT * FROM menu WHERE book_name LIKE ?';
            }


            const data = await pool.query(q1, [`%${searchData}%`]);


            res.render('book', { data: data[0], searchData: searchData });

        }

        catch (error) {

            console.error('메뉴 조회 중 오류 발생: ', error);
            res.status(500).send('메뉴 조회 중 오류가 발생했습니다.');

        }
    },


    bookplusView: async (req, res) => {
        return res.render('bookplus')

    },
    bookchkView: async (req, res) => {
        try {
            const [rows] = await pool.query('select * from book');
            res.render('bookchk', { books: rows });

        }


        catch (error) {
            console.error("도서 조회 중 오류 발생:", error);
            throw error;

        }


    },


    booksearchView: async (req, res) => {
        try {
            res.render('booksearch', { bookList: null });
        } catch (error) {
            res.status(500).send('서버에러');

        }

    },

    usersearchView: async (req, res) => {
        try {
            res.render('usersearch', { userList: null });
        } catch (error) {
            res.status(500).send('서버에러');

        }

    },

    bookcart: async (req, res) => {

        if (req.session.user) {

            try {

                const id = req.session.user.id;

                const getCartQuery = 'select *from bookcart where user_id =?';
                const [cartRows] = await pool.query(getCartQuery, [id]);

                if (cartRows.length > 0) {
                    const bookcartId = cartRows[0].bookcart_no;

                    // 2. cart_menu 테이블에서 각 메뉴 정보 가져오기
                    const getCartMenuQuery = 'SELECT * FROM bookcartlist WHERE bookcart_bookcartid = ?';
                    const [cartMenuRows] = await pool.query(getCartMenuQuery, [bookcartId]);

                    // 3. 메뉴 정보를 기반으로 장바구니 페이지에 전달
                    res.render('bookcart', { session: req.session, cartItems: cartMenuRows });
                } else {
                    // 카트가 비어있는 경우
                    res.render('bookcart', { session: req.session, cartItems: [] });
                }
            } catch (error) {
                console.error('장바구니 확인 중 오류 발생: ', error);
                res.status(500).send('장바구니 확인 중 오류가 발생했습니다.');

            }
        } else {
            // 로그인하지 않은 경우에는 로그인 페이지로 리다이렉트
            res.redirect('/login');
        }
    },
    updateQuantity: async (req, res) => {
        const { menuNo, amount } = req.query;

        try {
            // 수량 업데이트 쿼리 실행
            const updateQuantityQuery = 'UPDATE SET bookcartlist_count = bookcartlist_count + ? WHERE bookcartlist_id = ?';
            await pool.query(updateQuantityQuery, [parseInt(amount), menuNo]);


            res.json({ success: true, newTotal });
        } catch (error) {
            console.error('수량 업데이트 중 오류 발생: ', error);
            res.json({ success: false, error: '수량 업데이트 중 오류가 발생했습니다.' });
        }
    },

    cartView: async (req, res, next) => {
        /**
         * 1. session에서 user_id를 받아온다.
         * 2. user_id를 이용하여 cart_id를 받아온다.
         * 3. cart_id에 해당하는 bookcartlist를 받아온다.
         * 4. 받아온 list배열을 cart에 넘겨준다.
         */

        if (req.session.user) {
            // 1. session에서 user_id를 받아온다.
            const userid = req.session.user.id;

            // 2. user_id를 이용하여 cart_id를 받아온다.
            const cartQuery = 'select bookcartid from bookcart where user_id = ?';
            const [cartRows] = await pool.query(cartQuery, [userid]);

            const cartId = cartRows[0].bookcartid;

            // 3. cart_id에 해당하는 bookcartlist를 받아온다.
            const cartListQuery = 'select * from bookcartlist where bookcart_bookcartid = ?';
            const [cartListRows] = await pool.query(cartListQuery, [cartId]);

            console.log(cartListRows);

            // 4. 받아온 list배열을 cart에 넘겨준다.
            return res.render('cart', { cartList: cartListRows });
        }

        res.redirect('/');
    },


    rental: async (req, res) => {
        try {
            /* * 1. 세션에서  id  정보 가져오기 
     * 장바구니 조회 
     * 비어잇으면 -> 빈카트 ~~  
     * 있으면 -> 정보조회 
     * 총권수 / 날짜 조회 
    
            */

            //1. 세션에서 id 정보 가져오기 
            const userid = req.session.user.id;
            //2. 장바구니 조회
            const getCartQuery = 'select * from bookcart where user_id = ?';
            const [cartRows] = await pool.query(getCartQuery, [userid]);


            if (cartRows.length > 0) {
                const cartid = cartRows[0].bookcartid;

                const getCartMenuQuery = 'select * from bookcartlist where bookcart_bookcartid = ?';
                const [cartMenuRows] = await pool.query(getCartMenuQuery, [cartid]);

                const rentalList = cartMenuRows.map(cartItem => cartItem.bookcartlist_bookname).join(',');

                const totalCountQuery = 'select count(*) as total_count from bookcartlist where bookcart_bookcartid=?';
                const [totalCountRows] = await pool.query(totalCountQuery, [cartid]);

                const dateQuery = 'select date_format(now(), "%y-%m-%d") as today';
                const [dateRows] = await pool.query(dateQuery);

                const totalCount = totalCountRows[0].total_count;
                const currentDate = dateRows[0].today;

                res.render('rental', { session: req.session, cartItems: cartMenuRows, totalCount, currentDate });
            } else {
                res.render('rental', { session: req.session, cartItems: [] });
            }
        } catch (error) {
            res.status(500).send('서버에러');
        }
    },

    /*
    주문내역 가져오기(카트내역)
    세부정보 가져오기 ()
    선택된 책 목록 가져오기 
    대출일시, 권수 가져오기
    내역을 리스트 페이지에 전달  
    
    
    
    
    */


}





const input = {

    login: async (req, res) => {
        const client = req.body;
        const [userInfo] = await pool.query('select * from user where id = ?', [client.id]);


        if (!req.session.user) {
            if (userInfo) {
                const user = userInfo[0];

                if (String(user.id) !== client.id) {
                    return res.status(401).json({ success: false, msg: "존재하지 않는 아이디입니다." });
                }

                if (user.pw !== client.pw) {
                    return res.status(401).json({ success: false, msg: "비밀번호가 틀렸습니다." });
                }
                console.log('user_name');
                req.session.user = user;

                return res.redirect("/");
            }

        }

    },






    join: async (req, res) => {

        const client = req.body;
        try {
            const response = await pool.query("insert into user values(?,?,?,?,?)",
                [
                    client.id,
                    client.pw,
                    client.name,
                    client.birth,
                    client.tel,

                ]);

            return res.redirect("/login");
        }

        catch (error) {
            console.error("회원가입중 오류발생 ", error);
        }
    },
    bookplus: async (req, res) => {

        const client = req.body;
        try {

            if (!req.session.user) {
                console.log(req.session.user)
                return console.log('로그인안함')
            }
            console.log(req.session.user)

            const response = await pool.query("insert into book values(?,?,?,?,?)",
                [

                    client.book_id,
                    client.book_name,
                    client.book_author,
                    client.book_publ,
                    client.book_ISBN,


                ]);

            return res.render('main');






        }

        catch (error) {
            console.error("도서추가중 오류발생 ", error);




        }




    },


    booksearch: async (req, res) => {
        try {
            const user = new User(req.body);
            const bookList = await user.booksearch(req.body.search_word);

            res.render('booksearch', { bookList });
        }

        catch (error) {
            console.error("도서 검색 중 오류 발생:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }



    },
    usersearch: async (req, res) => {
        try {
            const user = new User(req.body);
            const userList = await user.usersearch(req.body.search_word);

            res.render('usersearch', { userList });
        }

        catch (error) {
            console.error("도서 검색 중 오류 발생:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }



    },
    addtocart: async (req, res) => {
        if (req.session.user) {
            const bookId = req.body.book_no;
            const quantity = 1; // 현재는 하나의 메뉴만 추가하도록 설정
            const userid = req.session.user.id;

            // 1. 사용자의 카트 정보 가져오기
            const getCartQuery = 'SELECT * FROM bookcart WHERE user_id = ?';
            const [cartRows] = await pool.query(getCartQuery, [userid]);

            let cartId;

            if (cartRows.length > 0) {
                // 이미 카트가 있는 경우
                cartId = cartRows[0].bookcartid;
            } else {
                // 카트가 없는 경우 새로 생성
                const insertCartQuery = 'INSERT INTO bookcart ( user_id) VALUES (?)';
                const [insertedCart] = await pool.query(insertCartQuery, [userid]);
                cartId = insertedCart.insertId;
            }

            // 2. 메뉴 정보 가져오기
            const getMenuInfoQuery = 'SELECT book_name FROM book WHERE book_no = ?';
            const [menuRows] = await pool.query(getMenuInfoQuery, [bookId]);

            const getbookInfoQuery = 'SELECT book_author FROM book WHERE book_no= ?';
            const [AuthorRows] = await pool.query(getbookInfoQuery, [bookId]);

            const getISBNInfoQuery = 'SELECT book_ISBN FROM book where book_no= ?';
            const [ISBNRows] = await pool.query(getISBNInfoQuery, [bookId]);




            if (menuRows.length > 0) {
                const bookName = menuRows[0].book_name;
                const authorname = AuthorRows[0].book_author;
                const ISBN = ISBNRows[0].book_ISBN;



                // 3. cart_menu 테이블에 메뉴 추가 또는 수량 증가
                const getCartItemQuery = 'SELECT * FROM bookcartlist WHERE bookcart_bookcartid = ? AND book_book_no = ?';
                const [cartItemRows] = await pool.query(getCartItemQuery, [cartId, bookId]);



                if (cartItemRows.length > 0) {
                    // 이미 장바구니에 있는 메뉴인 경우 수량 증가 
                    const updateQuantityQuery = 'UPDATE bookcartlist SET bookcartlist_count = bookcartlist_count + ? WHERE bookcart_bookcartid = ? AND book_book_no = ?';
                    await pool.query(updateQuantityQuery, [quantity, cartId, bookId]);
                } else {
                    // 새로운 메뉴인 경우 레코드 추가
                    const insertMenuCartQuery = 'INSERT INTO bookcartlist (bookcartlist_bookname, bookcartlist_count, bookcart_bookcartid, book_book_no,bookcartlist_author, bookcartlist_ISBN) VALUES (?, ?, ?, ?, ?, ?)';
                    await pool.query(insertMenuCartQuery, [bookName, quantity, cartId, bookId, authorname,ISBN]);
                }

                // 4. cart_total_price 업데이트
                // const updateTotalPriceQuery = 'UPDATE cart SET cart_total_price = (SELECT SUM(cart_menu_price * cart_menu_count) FROM cart_menu WHERE cart_cart_no = ?) WHERE cart_no = ?';
                // await pool.query(updateTotalPriceQuery, [cartId, cartId]);

                console.log('메뉴가 장바구니에 추가되었습니다.');
                res.redirect('/book');
            }
        } else {
            const alertMessage = '사용자 정보가 없습니다.';
            res.send(`<script>alert("${alertMessage}"); window.location.href="/";</script>`);
        }
    },

    cart: async (req, res, next) => {
        // 장바구니 목록 삭제
        /**
         * 1. bookcartlistid를 받아온다.
         * 2. user_id를 받아온다.
         * 3. user_id에 맞는 cartid를 들고온다.
         * 4. bookcartlist에서 해당 cartid와 bookcartlistid에 맞는 속성값을 삭제한다
         */

        // 1. bookcartlistid를 받아온다. 
        const cartItemId = req.body.cartItemId;
        // 2. user_id를 받아온다.
        if (req.session.user) {
            const userId = req.session.user.id;

            // 3. user_id에 맞는 cartid를 들고온다.
            const cartQuery = 'select bookcartid from bookcart where user_id = ?';
            const [cartRows] = await pool.query(cartQuery, [userId]);

            const cartId = cartRows[0].bookcartid;

            // 4. bookcartlist에서 해당 cartid와 bookcartlistid에 맞는 속성값을 삭제한다
            const removeItemQuery = 'delete from bookcartlist where bookcart_bookcartid = ? and bookcartlistid = ?';
            const [removeItem] = await pool.query(removeItemQuery, [cartId, cartItemId]);

            console.log(removeItem);
            return res.redirect('/cart');
        }

        res.redirect('/');
    },

    /*
    1.대출버튼누른다

    4.대출이된다
        대출내역이뜬다(history 대출날짜? 반납날짜 )
        1.세션로그인 (유저 정보 받아옴 )
        2. 책정보받아옴 -책이름 작가(일단 작가까지만 받장) 출판사  
        3. 날짜받아옴 
        4.반납날짜 계산함
        5.저장함  
        6.책대출여부 변경

    5. 장바구니 초기화 
    6. 대출내역 출력





        */
    rental: async (req, res) => {

        try {
            const userId = req.session.user.id;
            // user가 가지고 있는 장바구니 가져옴
            const [query] = await pool.query("SELECT user_id, bookcartid, bookcartlist_bookname FROM book1.bookcart inner join book1.bookcartlist on bookcartid = bookcart_bookcartid where user_id = ?;", [userId]);
            const cartId = query[0].bookcartid;
            
            // 현재 user 가 담고 있는 도서 장바구니 목록 불러옴
            const cartItemQuery = 'select * from bookcartlist where bookcart_bookcartid = ?';
            const [cartItems] = await pool.query(cartItemQuery, [cartId]);

            // rental 데이터 추가
            const today = new Date();
            today.setDate(today.getDate() + 7);
            const returnDay = today;
            const insertRentalQuery = "insert into rental(rental_date, rental_returndate, user_id) values (?, ?, ?)";
            const [rentalQuery] = await pool.query(insertRentalQuery, [today, returnDay, userId]);

            console.log(rentalQuery);
            const rentalId = rentalQuery.insertId;

            // 장바구니 목록을 rental 목록에 추가
            const rentalItemQuery = 'insert into rentallist(book_book_no, rental_rentalid) values (?, ?)';
            const updateRentalQuery = 'update book set book_on = 1 where book_no = ?';
            const updateCartItemQuery = 'update bookcartlist set bookcart_bookcartid = NULL where bookcartlistid = ?';
            cartItems.forEach(async (cartItem) => {
                const rentalItem = await pool.query(rentalItemQuery, [cartItem.book_book_no, rentalId]);
                // 대출여부 변경
                const updateRental = await pool.query(updateRentalQuery, [cartItem.book_book_no]);

                // 장바구니 번호 삭제
                const updateCartItem = await pool.query(updateCartItemQuery, [cartItem.bookcartlistid]);
            });

            // query 의 length 이용을 해서 for 문 돌린다 -> query[0] ==> 화산귀환 , query[1] ==> 마음의소리
            // for 문으로 1씩 증가하는 insert 문을 작성

            // 동시에 대출이 완료된 책은 장바구니에서 삭제

            // const cardelquery = 'delete from bookcartlist where bookcart_bookcartid = ? ';
            

            // if(query.length !=0 ){
            //     await pool.query (cardelquery)
                
            // };

            // 최종적으로 완료되면 완료됨 알림}
            return res.redirect('/cart');
        }
        catch (e) {
            console.log(e);
        }





    }

}


module.exports = { output, input }