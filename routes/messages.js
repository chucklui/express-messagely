"use strict";

const Router = require("express").Router;
const Message = require('../models/message');
const { ensureLoggedIn } = require('../middleware/auth');
const { NotFoundError, BadRequestError, UnauthorizedError } = require('../expressError');
const router = new Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn, async function (req, res) {
  const username = res.locals.user.username;
  const message = await Message.get(req.params.id);
  if (!message) throw new NotFoundError('Message Not Found');

  if (message.from_user.username === username || message.to_user.username === username) {
    return res.json({ message });
  }
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', ensureLoggedIn, async function (req, res) {
  const from_username = res.locals.user.username;
  req.body.from_username = from_username;
  const message = await Message.create(req.body);
  if (!message) throw new BadRequestError("Couldn't post message");

  return res.json({ message });
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', ensureLoggedIn, async function (req, res){
  const id = req.params.id;
  const foundMessage = await Message.get(id);
  if(!foundMessage) throw new NotFoundError("Could not find message");

  if( res.locals.user.username === foundMessage.to_user.username){
    const message = await Message.markRead(id);
    return res.json({ message});
  }
  throw new UnauthorizedError("You are not authorized to mark this message as read");
})


module.exports = router;