const S3 = require('aws-sdk/clients/s3')
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
    const body = JSON.parse(event.body)
    let imageKey = body.key
    //Delete from S3 bucket
    await s3
      .deleteObject({
        Bucket: process.env.imageUploadBucket,
        Key: imageKey,
      })
      .promise()

    //Delete from mySql
    await mysql.query(
      `DELETE from urls WHERE url = '${`https://${process.env.imageUploadBucket}.s3-${process.env.region}.amazonaws.com/${imageKey}`}'`
    )
    let storedUrls = await mysql.query(`SELECT * FROM urls`)
    let storedUser = await mysql.query('SELECT * FROM users')

    return sendResponse(200, {
      message: `${imageKey} was succesfully deleted from the bucket ${process.env.imageUploadBucket}`,
      storedUrls,
      storedUser,
    })
  } catch (error) {
    return sendResponse(400, error)
  }
}
