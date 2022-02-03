import middy from '@middy/core'
import httpErrorHandler from '@middy/http-error-handler'
const mysql = require('serverless-mysql')()
mysql.config({
  host: process.env.MYSQL_HOST,
  database: process.env.MYSQL_DB_NAME,
  port: process.env.MYSQL_POST,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
})
import { 
  APIGatewayProxyEvent, 
  APIGatewayProxyResult 
} from "aws-lambda";
import { sendResponse } from '../index'

const baseHandler = async (event:APIGatewayProxyEvent):Promise<APIGatewayProxyResult> => {
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

const handler = middy(baseHandler).use(httpErrorHandler()) // handles common http errors and returns proper responses

module.exports.handler = handler
