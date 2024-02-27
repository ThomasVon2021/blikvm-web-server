import Logger from "./log/logger.js";
import { existFile, createFile, generateUniqueCode, generateSecret } from "./common/tool.js"
import fs from 'fs';
import HttpServer from "./http_server/http_server.js";
import HttpApi from "./http_api/http_api.js";

const logger = new Logger();
 
createSecretFile(); 

const httpApi = new HttpApi();
httpApi.startService().then((result) => {
    logger.info(`Http API started at ${result.name}`);
}).catch((error) => {
    throw error;
});

let interval = 0;
setInterval(() => {
    console.log(++interval);
}, 1000);
setTimeout(() => {
    httpApi.closeService().then((result) => {
        logger.info(`Http API stopped at ${result.name}`);
    });
}, 5000);

// const httpServer = new HttpServer();

// httpServer.startService().then((result) => {
//     logger.info(`Http Server started at ${result.port}`);
// }).catch((error) => {
//     throw error;
// });

/**
 * Creates or updates a secret file with a unique code, secret key, and empty OTP.
 */
function createSecretFile() {
    let keyLength = 32;
    const { other } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
    if(!existFile(other.secretFile)){
        createFile(other.secretFile);
        const data={
            id:generateUniqueCode(),
            key:generateSecret(keyLength),
            otp:''
        };
        fs.writeFileSync(other.secretFile,JSON.stringify(data));
        logger.info(`Secret file created at ${other.secretFile}`);
    }
}