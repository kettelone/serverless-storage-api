import 'dotenv/config';
import AWS from 'aws-sdk';
import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler';
import validator from '@middy/validator';
import cors from '@middy/http-cors';
import {
    APIGatewayProxyResult,
} from 'aws-lambda';
import { AuthEvent } from './index';

const cognito = new AWS.CognitoIdentityServiceProvider();

const baseHandler = async (event:AuthEvent):Promise<APIGatewayProxyResult> => {
    const { email, password } = event.body;
    const { userPoolId } = process.env;
    const params = {
        UserPoolId: userPoolId,
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
    };
    const response = await cognito.adminCreateUser(params).promise();
    if (response.User) {
        const paramsForSetPass = {
            Password: password,
            UserPoolId: userPoolId,
            Username: email,
            Permanent: true,
        };
        await cognito.adminSetUserPassword(paramsForSetPass).promise();
    }
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'User registration successful' }),
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
