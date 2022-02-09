import S3 from 'aws-sdk/clients/s3'
import { sendResponse, configObject} from '../../utils/utils'
import {  
  APIGatewayProxyResult 
} from "aws-lambda";
import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import httpErrorHandler from '@middy/http-error-handler'
import {EventPresignedUrl} from '../../interfaces/interfaces'
const s3 = new S3()
const mysql = require('serverless-mysql')()
mysql.config(configObject)

const baseHandler = async (event:EventPresignedUrl):Promise<APIGatewayProxyResult> => {
  try {
    const cutUrl = event.body.url.substring(8)
    const startOfKey = (cutUrl.indexOf('/') + 1)
    const imageKey = cutUrl.substring(startOfKey)
    
    //check if such picture name exist in DB
    const imageExist = await mysql.query(
      `SELECT * FROM urls WHERE url = '${`https://${process.env.imageUploadBucket}.s3-${process.env.region}.amazonaws.com/${imageKey}`}'`
    )
  
    if (Object.keys(imageExist).length === 0) {
      return sendResponse(200, {
        message: `There is no image ${imageKey} in your storage`,
      })
    }else{
      //Delete from mySql
    await mysql.query(
      `DELETE from urls WHERE url = '${`https://${process.env.imageUploadBucket}.s3-${process.env.region}.amazonaws.com/${imageKey}`}'`
    )
       //Delete from S3 bucket
    await s3
       .deleteObject({
         Bucket: process.env.imageUploadBucket,
         Key: imageKey,
       })
       .promise()

    return sendResponse(200, {
      message: `${imageKey} was succesfully deleted from the bucket ${process.env.imageUploadBucket}`,
    })
    }
  } catch (error) {
    return sendResponse(400, error)
  }
}

const handler = middy(baseHandler)
  .use(jsonBodyParser()) // parses the request body when it's a JSON and converts it to an object
  .use(httpErrorHandler()) // handles common http errors and returns proper responses

module.exports.handler = handler
