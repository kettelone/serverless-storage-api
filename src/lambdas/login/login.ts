import 'dotenv/config';
import AWS from 'aws-sdk';
import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler';
import cors from '@middy/http-cors';
import validator from '@middy/validator';
import {
    APIGatewayProxyResult,
} from 'aws-lambda';
import { AuthEvent } from './index';

const cognito = new AWS.CognitoIdentityServiceProvider();

const baseHandler = async (event:AuthEvent):Promise<APIGatewayProxyResult> => {
    const { email, password } = event.body;
    const { userPoolId, clientId } = process.env;
    const params = {
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        UserPoolId: userPoolId,
        ClientId: clientId,
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
        },
    };
    const response = await cognito.adminInitiateAuth(params).promise();
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Success', token: response.AuthenticationResult.IdToken }),
    };
};

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
};

const handler = middy(baseHandler)
    .use(cors({ origin: '*', credentials: true }))
    .use(jsonBodyParser()) // parses the request body when it's a JSON and converts it to an object
    .use(validator({ inputSchema })) // validates the input
    .use(httpErrorHandler()); // handles common http errors and returns proper responses

module.exports.handler = handler;
