const mysql = require('serverless-mysql')()
mysql.config({
  host: process.env.MYSQL_HOST,
  database: process.env.MYSQL_DB_NAME,
  port: process.env.MYSQL_POST,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
})
const { sendResponse } = require('../functions')
module.exports.handler = async (event) => {
  try {
    let users_login = event.requestContext.authorizer.claims.email
    let userInfo = await mysql.query(
      `SELECT * FROM users WHERE login = "${users_login}"`
    )
    let userId = await userInfo[0].id
    let imagesList = await mysql.query(
      `SELECT * FROM urls WHERE email_id = ${userId}`
    )

    return sendResponse(200, imagesList)
  } catch (error) {
    return sendResponse(400, `${error}`)
  }
}
