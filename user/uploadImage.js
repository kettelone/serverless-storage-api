const S3 = require('aws-sdk/clients/s3')
const { v4: uuidv4 } = require('uuid')
const fileType = require('file-type-es5')
const { sendResponse } = require('../functions')
const s3 = new S3()
const mysql = require('serverless-mysql')()
mysql.config({
  host: process.env.MYSQL_HOST,
  database: process.env.MYSQL_DB_NAME,
  port: process.env.MYSQL_POST,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
})

module.exports.handler = async (event) => {
  try {
    //FILE UPLOADING TO S3
    let body = JSON.parse(event.body)
    let imageData = body.image
    if (body.image.substr(0, 7) === 'base64,') {
      imageData = body.image.substr(7, body.image.length)
    }

    const buffer = Buffer.from(imageData, 'base64')
    const fileInfo = fileType(buffer)
    const detectedExt = fileInfo.ext
    const detectedMime = fileInfo.mime

    const name = uuidv4()
    const key = `${name}.${detectedExt}`

    await s3
      .putObject({
        Body: buffer,
        Key: key,
        ContentType: detectedMime,
        Bucket: process.env.imageUploadBucket,
        ACL: 'public-read-write',
      })
      .promise()

    const url = `https://${process.env.imageUploadBucket}.s3-${process.env.region}.amazonaws.com/${key}`

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
      `INSERT INTO urls (url,email_id) VALUES ("${url}",${userId})`
    )

    //FOR TESTING PURPOSES
    // let storedUrls = await mysql.query(`SELECT * FROM urls`)
    // let storedUser = await mysql.query('SELECT * FROM users')

    // Run clean up function
    await mysql.end()

    return sendResponse(200, url)
  } catch (error) {
    return sendResponse(400, `${error}`)
  }
}
