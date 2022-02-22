"use strict";

const Router = require("express").Router;
const User = require('../models/user');
const { SECRET_KEY } = require('../config');
const { UnauthorizedError } = require('../expressError');
const router = new Router();

/** POST /login: {username, password} => {token} */
router.post('/', async function (req, res) {
  const { username, password } = req.body;
  const tokenFromRequest = req.query._token || req.body._token;
  const user = await User.get(username);
  // console.log(res.local.user);

  if (user) {
    if (await bcrypt.compare(password, user.password) === true) {
      return res.json({ tokenFromRequest });
    }
  }

  throw new UnauthorizedError("Invalid user/password");
})

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post('/register', async function (req, res) {
  const { username, password, first_name, last_name, phone } = req.body;
  const user = await User.register(username, password, first_name, last_name, phone);
  const token = jwt.sign({ username }, SECRET_KEY);

  return res.json({ token });
})

module.exports = router;