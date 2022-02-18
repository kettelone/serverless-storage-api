import 'dotenv/config';
import S3 from 'aws-sdk/clients/s3';
import { v4 as uuidv4 } from 'uuid';
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import cors from '@middy/http-cors';
import {
    APIGatewayProxyResult,
} from 'aws-lambda';
import { configObject } from '../../MySQLConfig/config';
import { UploadEvent } from './index';

const s3 = new S3();
const mysql = require('serverless-mysql')();

mysql.config(configObject);

const baseHandler = async (event: UploadEvent):Promise<APIGatewayProxyResult> => {
    // FILE UPLOADING TO S3
    const userLogin = event.requestContext.authorizer.claims.email;
    const imageKey = `${userLogin}:${uuidv4()}:${event.queryStringParameters.key}`;

    const { url, fields } = await s3.createPresignedPost({
        Fields: {
            key: imageKey,
            'Content-Type': 'image/png',
        },
        Conditions: [['content-length-range', 0, 1000000]],
        Expires: 3600, // seconds
        Bucket: process.env.imageUploadBucket,
    });
    return {
        statusCode: 200,
        body: JSON.stringify({ url, fields }),
    };
};
const handler = middy(baseHandler)
    .use(cors({ origin: '*', credentials: true }))
    .use(httpErrorHandler());// handles common http errors and returns proper responses

module.exports.handler = handler;
