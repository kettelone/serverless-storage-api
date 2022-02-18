import 'dotenv/config';
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import cors from '@middy/http-cors';
import { configObject } from '../../MySQLConfig/config';
import { S3Event } from './index';

const mysql = require('serverless-mysql')();

mysql.config(configObject);

const baseHandler = async (event:S3Event) => {
    try {
        // user login is a part of the key name
        const imageKeyEncoded = event.Records[0].s3.object.key;
        const imageKey = decodeURIComponent(imageKeyEncoded);
        const end = imageKey.indexOf(':');
        const userLogin = imageKey.substring(0, end);
        const imageUrl = `https://${process.env.imageUploadBucket}.s3-${process.env.region}.amazonaws.com/${imageKey}`;

        // MYSQL DATABASE CODE
        const results = await mysql.query('SHOW TABLES');

        if (results.length !== 2) {
            await mysql.query(
                `CREATE TABLE users(
          id INT AUTO_INCREMENT PRIMARY KEY,
          login VARCHAR(255) NOT NULL)`,
            );
            await mysql.query(
                `CREATE TABLE urls(
          id INT AUTO_INCREMENT PRIMARY KEY,
          url VARCHAR(255) NOT NULL,
          email_id INT NOT NULL,
          FOREIGN KEY (email_id) references users(id))`,
            );
        }

        const userExist = await mysql.query(
            `SELECT * FROM users WHERE login = "${userLogin}"`,
        );

        if (Object.keys(userExist).length === 0) {
            await mysql.query(`INSERT INTO users (login) values ("${userLogin}")`);
        }

        const userInfo = await mysql.query(
            `SELECT * FROM users WHERE login = "${userLogin}"`,
        );
        const userId = userInfo[0].id;

        // store url
        await mysql.query(
            `INSERT INTO urls (url,email_id) VALUES ("${imageUrl}",${userId})`,
        );

        // Run clean up function
        await mysql.end();
        return {
            statusCode: 200,
            body: JSON.stringify(event),
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
    .use(jsonBodyParser()) // parses the request body when it's a JSON and converts it to an object
    .use(httpErrorHandler()); // handles common http errors and returns proper responses

module.exports.handler = handler;
