const express = require('express');
const router = express.Router();

const mainRouter = require('../controller/mainController');



router.get('/', mainRouter.output.mainView);
router.get('/login', mainRouter.output.loginView);
router.post('/login',mainRouter.input.login);
router.get('/join', mainRouter.output.joinView);
router.post('/join',mainRouter.input.join);
router.get('/userchk',mainRouter.output.userchkView);
router.get('/bookplus',mainRouter.output.bookplusView);
router.post('/bookplus',mainRouter.input.bookplus);
router.get('/bookchk',mainRouter.output.bookchkView);
router.get('/booksearch',mainRouter.output.booksearchView);
router.post('/booksearch',mainRouter.input.booksearch);
router.get('/usersearch',mainRouter.output.usersearchView);
router.post('/usersearch',mainRouter.input.usersearch);
router.get('/logout', mainRouter.output.logout);
router.get('/book',mainRouter.output.bookView);
router.get('/updateQuantity',mainRouter.output.updateQuantity);
router.get('/bookcart',mainRouter.output.bookcart);
router.post('/addtocart',mainRouter.input.addtocart);
router.get('/cart', mainRouter.output.cartView);
router.post('/cart', mainRouter.input.cart);


module.exports = router;