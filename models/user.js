"use strict";

const db = require('../db');
const { BCRYPT_WORK_FACTOR } = require('../config');
const { BadRequestError, NotFoundError } = require('../expressError');
const bcrypt = require("bcrypt");

/** User of the site. */
class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    console.log(username, password, first_name, last_name, phone );
    console.log("Running User.register");
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    console.log("hashed password:", hashedPassword);
    
    const result = await db.query(`
      INSERT INTO users (username, 
        password, 
        first_name, 
        last_name, 
        phone,
        join_at,
        last_login_at)
      VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
      RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]);
    const user = result.rows[0];
    if (!user) throw new BadRequestError(`Could not create new user.`);
    return user;
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    //find user in db by username
    //check password to ensure
    const result = await db.query(
      `SELECT password FROM users
      WHERE username =$1`,
      [username]
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`Invalid username`);

    console.log(` Username: ${username} \n
                  input password: ${password} \n
                  stored password hash : ${user.password}`)

    if (await bcrypt.compare(password, user.password) === true) {
      return true;
    }
    return false;
  }

  /** Update last_login_at for user 
   * returns {username, last_login_at}
  */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
      SET last_login_at = current_timestamp
        WHERE username = $1
        RETURNING username, last_login_at`,
      [username]
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
    return user;
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(`
    SELECT username, first_name, last_name
    FROM users`);
    const users = result.rows;
    if (!users) throw new NotFoundError('No users');
    return users;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(`
    SELECT username, first_name, last_name, phone, join_at, last_login_at
    FROM users
    WHERE username = $1`,
      [username]);
    const user = result.rows[0];
    if (!user) throw new NotFoundError(`No user: ${username}`);
    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const messagesResult = await db.query(`
    SELECT id, to_username, body, sent_at, read_at
    FROM messages
    WHERE from_username = $1`,
      [username]);

    const messages = messagesResult.rows;

    for (let m of messages) {
      const userResult = await db.query(`
      SELECT username, first_name, last_name, phone
      FROM users
      WHERE username = $1`,
        [m.to_username]);
      m.to_user = userResult.rows[0];
      delete m.to_username;
    }

    return messages;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const messagesResult = await db.query(`
    SELECT id, from_username, body, sent_at, read_at
    FROM messages
    WHERE to_username = $1`,
      [username]);
    const messages = messagesResult.rows;
    for (let m of messages) {
      const userResult = await db.query(`
      SELECT username, first_name, last_name, phone
      FROM users
      WHERE username = $1`,
        [m.from_username]);
      m.from_user = userResult.rows[0];
      delete m.from_username;
    }
    return messages;
  }
}


module.exports = User;
