"use strict";

const Router = require("express").Router;
const User = require('../models/user');
const bcrypt = require('bcrypt');
const { SECRET_KEY } = require('../config');
const { UnauthorizedError } = require('../expressError');
const router = new Router();
const jwt = require("jsonwebtoken");

/** POST /login: {username, password} => {token} */
router.post('/login', async function (req, res) {
  const { username, password } = req.body;
  if(await User.authenticate(username, password)){
    const token = jwt.sign({ username }, SECRET_KEY);
    return res.json({ token });
  }
  throw new UnauthorizedError("Invalid user/password");
})

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post('/register', async function (req, res) {
  //TODO: Make sure to put an if/then statement here,
  //like above. make sure to send an error if the user 
  //is not created properly
  const { username } = req.body;
  await User.register(req.body);
  const token = jwt.sign({ username }, SECRET_KEY);

  return res.json({ token });
})

module.exports = router;