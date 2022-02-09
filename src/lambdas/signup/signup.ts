import AWS from 'aws-sdk'
import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import httpErrorHandler from '@middy/http-error-handler'
import validator from '@middy/validator'
import { sendResponse } from '../../utils/utils'
import {AuthEvent} from '../../interfaces/interfaces'
import {  
  APIGatewayProxyResult 
} from "aws-lambda";

const cognito = new AWS.CognitoIdentityServiceProvider()

const baseHandler = async (event:AuthEvent):Promise<APIGatewayProxyResult> => {
  const { email, password } = event.body
  const { user_pool_id } = process.env
  const params = {
    UserPoolId: user_pool_id,
    Username: email,
    UserAttributes: [
      {
        Name: 'email',
        Value: email,
      },
      {
        Name: 'email_verified',
        Value: 'true',
      },
    ],
    MessageAction: 'SUPPRESS',
  }
  const response = await cognito.adminCreateUser(params).promise()
  if (response.User) {
    const paramsForSetPass = {
      Password: password,
      UserPoolId: user_pool_id,
      Username: email,
      Permanent: true,
    }
    await cognito.adminSetUserPassword(paramsForSetPass).promise()
  }
  return sendResponse(200, { message: 'User registration successful' })
}

const inputSchema = {
  type: 'object',
  properties: {
    body: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
        },
        password: { type: 'string', minLength: 6 },
      },
      required: ['email', 'password'], // Insert here all required event properties
    },
  },
}

const handler = middy(baseHandler)
  .use(jsonBodyParser()) // parses the request body when it's a JSON and converts it to an object
  .use(validator({ inputSchema })) // validates the input
  .use(httpErrorHandler()) // handles common http errors and returns proper responses

module.exports.handler = handler
