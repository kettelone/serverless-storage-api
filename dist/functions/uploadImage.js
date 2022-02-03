"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var s3_1 = __importDefault(require("aws-sdk/clients/s3"));
var uuid_1 = require("uuid");
var index_1 = require("../index");
var s3 = new s3_1.default();
var core_1 = __importDefault(require("@middy/core"));
var http_error_handler_1 = __importDefault(require("@middy/http-error-handler"));
var mysql = require('serverless-mysql')();
mysql.config({
    host: process.env.MYSQL_HOST,
    database: process.env.MYSQL_DB_NAME,
    port: process.env.MYSQL_POST,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
});
var baseHandler = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var imageKey, _a, url, fields, imageUrl, users_login, results, userExist, userInfo, userId;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                imageKey = "".concat((0, uuid_1.v4)(), "-").concat(event.queryStringParameters.key);
                return [4, s3.createPresignedPost({
                        Fields: {
                            key: imageKey,
                        },
                        Conditions: [['content-length-range', 0, 1000000]],
                        Expires: 3600,
                        Bucket: process.env.imageUploadBucket,
                    })];
            case 1:
                _a = _b.sent(), url = _a.url, fields = _a.fields;
                imageUrl = "https://".concat(process.env.imageUploadBucket, ".s3-").concat(process.env.region, ".amazonaws.com/").concat(imageKey);
                users_login = event.requestContext.authorizer.claims.email;
                return [4, mysql.query('SHOW TABLES')];
            case 2:
                results = _b.sent();
                if (!(results.length != 2)) return [3, 5];
                return [4, mysql.query("CREATE TABLE users(\n          id INT AUTO_INCREMENT PRIMARY KEY,\n          login VARCHAR(255) NOT NULL)")];
            case 3:
                _b.sent();
                return [4, mysql.query("CREATE TABLE urls(\n          id INT AUTO_INCREMENT PRIMARY KEY,\n          url VARCHAR(255) NOT NULL,\n          email_id INT NOT NULL,\n          FOREIGN KEY (email_id) references users(id))")];
            case 4:
                _b.sent();
                _b.label = 5;
            case 5: return [4, mysql.query("SELECT * FROM users WHERE login = \"".concat(users_login, "\""))];
            case 6:
                userExist = _b.sent();
                if (!(Object.keys(userExist).length === 0)) return [3, 8];
                return [4, mysql.query("INSERT INTO users (login) values (\"".concat(users_login, "\")"))];
            case 7:
                _b.sent();
                _b.label = 8;
            case 8: return [4, mysql.query("SELECT * FROM users WHERE login = \"".concat(users_login, "\""))];
            case 9:
                userInfo = _b.sent();
                return [4, userInfo[0].id];
            case 10:
                userId = _b.sent();
                return [4, mysql.query("INSERT INTO urls (url,email_id) VALUES (\"".concat(imageUrl, "\",").concat(userId, ")"))];
            case 11:
                _b.sent();
                return [4, mysql.end()];
            case 12:
                _b.sent();
                return [2, (0, index_1.sendResponse)(200, { url: url, fields: fields })];
        }
    });
}); };
var handler = (0, core_1.default)(baseHandler).use((0, http_error_handler_1.default)());
module.exports.handler = handler;
