import S3 from 'aws-sdk/clients/s3'
import { v4 as uuidv4 } from 'uuid'
import { sendResponse } from '../index'
const s3 = new S3()
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

const baseHandler = async (event: APIGatewayProxyEvent):Promise<APIGatewayProxyResult> => {
  // FILE UPLOADING TO S3
  const imageKey = `${uuidv4()}-${event.queryStringParameters.key}`
  const { url, fields } = await s3.createPresignedPost({
    Fields: {
      key: imageKey,
    },
    Conditions: [['content-length-range', 0, 1000000]],
    Expires: 3600, //seconds
    Bucket: process.env.imageUploadBucket,
  })

  const imageUrl = `https://${process.env.imageUploadBucket}.s3-${process.env.region}.amazonaws.com/${imageKey}`

  //MYSQL DATABASE CODE
  let users_login = event.requestContext.authorizer.claims.email
  let results = await mysql.query('SHOW TABLES')

  if (results.length != 2) {
    await mysql.query(
      `CREATE TABLE users(
          id INT AUTO_INCREMENT PRIMARY KEY,
          login VARCHAR(255) NOT NULL)`
    )
    await mysql.query(
      `CREATE TABLE urls(
          id INT AUTO_INCREMENT PRIMARY KEY,
          url VARCHAR(255) NOT NULL,
          email_id INT NOT NULL,
          FOREIGN KEY (email_id) references users(id))`
    )
  }

  let userExist = await mysql.query(
    `SELECT * FROM users WHERE login = "${users_login}"`
  )

  if (Object.keys(userExist).length === 0) {
    await mysql.query(`INSERT INTO users (login) values ("${users_login}")`)
  }

  let userInfo = await mysql.query(
    `SELECT * FROM users WHERE login = "${users_login}"`
  )
  let userId = await userInfo[0].id

  //store url
  await mysql.query(
    `INSERT INTO urls (url,email_id) VALUES ("${imageUrl}",${userId})`
  )

  // Run clean up function
  await mysql.end()

  return sendResponse(200, { url, fields })
  // return sendResponse(200, url)
}
const handler = middy(baseHandler).use(httpErrorHandler()) // handles common http errors and returns proper responses

module.exports.handler = handler
