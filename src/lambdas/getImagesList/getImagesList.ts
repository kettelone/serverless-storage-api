import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import {
    APIGatewayProxyResult,
} from 'aws-lambda';
import { sendResponse, configObject } from '../../utils/utils';
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

        return sendResponse(200, imagesList);
    } catch (error) {
        return sendResponse(400, `${error}`);
    }
};

const handler = middy(baseHandler).use(httpErrorHandler()); // handles common http errors and returns proper responses

module.exports.handler = handler;
