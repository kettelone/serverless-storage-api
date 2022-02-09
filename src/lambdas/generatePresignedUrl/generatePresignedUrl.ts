import S3 from 'aws-sdk/clients/s3'
import { sendResponse} from '../../utils/utils'
import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import httpErrorHandler from '@middy/http-error-handler'
import { 
  APIGatewayProxyResult 
} from "aws-lambda";
import {EventPresignedUrl} from '../../interfaces/interfaces'

const s3 = new S3()

const baseHandler = async (event:EventPresignedUrl):Promise<APIGatewayProxyResult> => {

    const cutUrl = event.body.url.substring(8)
    const startOfKey = (cutUrl.indexOf('/') + 1)
    const imageKey = cutUrl.substring(startOfKey)

  // create an s3 pre-signed download url for the image if it exists
  const url = s3.getSignedUrl('getObject', {
    Bucket: process.env.imageUploadBucket,
    Key: `${imageKey}`,
    Expires: 60,
  });

  return sendResponse(200, url )
}
const handler = middy(baseHandler)
.use(jsonBodyParser()) // parses the request body when it's a JSON and converts it to an object
.use(httpErrorHandler()) // handles common http errors and returns proper responses

module.exports.handler = handler
