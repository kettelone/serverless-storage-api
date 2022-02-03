import S3 from 'aws-sdk/clients/s3'
import { sendResponse } from '../index'
import { 
  APIGatewayProxyEvent, 
  APIGatewayProxyResult 
} from "aws-lambda";

const s3 = new S3()
const mysql = require('serverless-mysql')()
mysql.config({
  host: process.env.MYSQL_HOST,
  database: process.env.MYSQL_DB_NAME,
  port: process.env.MYSQL_POST,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
})
import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import httpErrorHandler from '@middy/http-error-handler'

const baseHandler = async (event:APIGatewayProxyEvent):Promise<APIGatewayProxyResult> => {
  try {
    // @ts-ignore
    let imageKey = event.body.key
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

    return sendResponse(200, {
      message: `${imageKey} was succesfully deleted from the bucket ${process.env.imageUploadBucket}`,
    })
  } catch (error) {
    return sendResponse(400, error)
  }
}

const handler = middy(baseHandler)
  .use(jsonBodyParser()) // parses the request body when it's a JSON and converts it to an object
  .use(httpErrorHandler()) // handles common http errors and returns proper responses

module.exports.handler = handler
