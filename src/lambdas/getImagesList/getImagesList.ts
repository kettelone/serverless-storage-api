import 'dotenv/config';
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import cors from '@middy/http-cors';
import {
    APIGatewayProxyResult,
} from 'aws-lambda';
import { configObject } from '../../MySQLConfig/config';
import { GetImageEvent } from './index';

const mysql = require('serverless-mysql')();

mysql.config(configObject);

const baseHandler = async (event:GetImageEvent):Promise<APIGatewayProxyResult> => {
    try {
        const userLogin = event.requestContext.authorizer.claims.email;
        const userInfo = await mysql.query(
            `SELECT * FROM users WHERE login = "${userLogin}"`,
        );
        const userId = userInfo[0].id;
        const imagesList = await mysql.query(
            `SELECT * FROM urls WHERE email_id = ${userId}`,
        );
        return {
            statusCode: 200,
            body: JSON.stringify({ imagesList }),
        };
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error }),
        };
    }
};

const handler = middy(baseHandler)
    .use(cors({ origin: '*', credentials: true }))
    .use(httpErrorHandler()); // handles common http errors and returns proper responses

module.exports.handler = handler;
