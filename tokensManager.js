import crypto from 'crypto';

import { log } from './log.js';
import * as serverVariables from './serverVariables.js';
import * as utilities from './utilities.js';

global.cachedTokens = [];
global.tokensLifeDuration = serverVariables.get('main.token.lifeDuration');
global.tokensCleanerStarted = false;

export default class TokensManager {
    /**
     * Tries to create a token. If one already exists return it instead of creating another one.
     */
    static create(user) {
        if (!tokensCleanerStarted) {
            tokensCleanerStarted = true;
            TokensManager.startTokensCleaner();
        }

        let token = TokensManager.findUserToken(user.Id);
        if (!token) {
            token = TokensManager.createToken(user);
            cachedTokens.push(token);
            console.log(BgGreen + FgWhite, "User " + token.User.Name + " logged in");
        } else {
            console.log(BgGreen + FgWhite, "User " + token.User.Name + " already logged in");
        }

        return token;
    }
    
    /**
     * Create a new token object
     */
    static createToken(user = null) {
        let token = {};
        if (user) {
            token.Id = 0;
            token.Access_token = TokensManager.makeToken(user.Id);//Nicolas used the Email. I'm trying with the Id. If something doesn't work, check here.
            token.User = user;
            token.Expire_Time = utilities.nowInSeconds() + tokenLifeDuration;
        }
        return token;
    }

    /**
     * Create a new token text, by hashing an unique property of the user model
     */
    static makeToken(text) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.randomBytes(32);
        const iv = crypto.randomBytes(16);
    
        function encrypt(text) {
            let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
            let encrypted = cipher.update(text);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            return {
                iv: iv.toString('hex'),
                encryptedData: encrypted.toString('hex')
            };
        }
        return encrypt(text).encryptedData;
    }

    static startTokensCleaner() {
        // periodic cleaning of expired tokens
        setInterval(TokensManager.clean, tokenLifeDuration * 1000);
        console.log(BgGreen + FgWhite, "Periodic tokens cleaning process started...");
    }
    static clean() {
        //tokensRepository.keepByFilter(); TODO: This is for storing tokens in a repository, so they persist
        for (let token of cachedTokens) {
            if (token.Expire_Time > utilities.nowInSeconds())
                console.log(BgGreen + FgWhite, `Token of user ${token.User.Name} has expired.`);
        }
        cachedTokens = cachedTokens.filter(token => token.Expire_Time > utilities.nowInSeconds());
    }

    /**
     * Delete all tokens associated with the user
     */
    static logout(userId) {
        //tokensRepository.keepByFilter(token => token.User.Id != userId); TODO: This is for storing tokens in a repository, so they persist
        cachedTokens = cachedTokens.filter(token => token.User.Id != userId);
    }
    
    /**
     * Find the user associated with a request, by checking for an access token
     */
    static getUser(req) {
        if (req.headers["authorization"] != undefined) {
            // Extract bearer token from head of the http request
            let access_token = req.headers["authorization"].replace('Bearer ', '');
            let token = this.findAccessToken(access_token);
            if (token && token.User)
                return token.User;
        }
        return null;
    }

    /**
     * Find an token in cache
     */
    static findAccessToken(access_token, renew = true) {
        for (let token of cachedTokens) {
            if (token.Access_token == access_token) {
                if (renew) {
                    // renew expiration date
                    token.Expire_Time = utilities.nowInSeconds() + tokenLifeDuration;
                }
                return token;
            }
            return null;
        }
    }
}