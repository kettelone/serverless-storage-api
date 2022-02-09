import S3 from 'aws-sdk/clients/s3'
import { v4 as uuidv4 } from 'uuid'
import { sendResponse, configObject} from '../../utils/utils'
import middy from '@middy/core'
import httpErrorHandler from '@middy/http-error-handler'
import { 
  APIGatewayProxyResult 
} from "aws-lambda";
import {UploadEvent} from '../../interfaces/interfaces'
const s3 = new S3()
const mysql = require('serverless-mysql')()
mysql.config(configObject)

const baseHandler = async (event: UploadEvent):Promise<APIGatewayProxyResult> => {
  // FILE UPLOADING TO S3
  const users_login = event.requestContext.authorizer.claims.email
  const imageKey = `${users_login}:${uuidv4()}:${event.queryStringParameters.key}`

  const { url, fields } = await s3.createPresignedPost({
    Fields: {
      key: imageKey,
      'Content-Type': 'image/png',
    },
    Conditions: [['content-length-range', 0, 1000000]],
    Expires: 3600, //seconds
    Bucket: process.env.imageUploadBucket,
  })
  return sendResponse(200, { url, fields })
}
const handler = middy(baseHandler).use(httpErrorHandler()) // handles common http errors and returns proper responses

module.exports.handler = handler
