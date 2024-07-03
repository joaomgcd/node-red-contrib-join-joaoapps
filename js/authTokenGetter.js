const { createSign } = require('crypto');
const util = require("./util");
const fetch = util.fetch;

module.exports = class AuthTokenGetter {
    constructor(accountEmail, privateKey) {
        this.accountEmail = accountEmail;
        this.privateKey = privateKey;
    }

    static accessToken = null;
    static tokenExpiry = null;

    async getAccessToken() {
        // Check if we have a cached token and it's still valid
        if (AuthTokenGetter.accessToken && AuthTokenGetter.tokenExpiry && Date.now() < AuthTokenGetter.tokenExpiry) {
            console.log("reused token from static cache");
            return AuthTokenGetter.accessToken;
        }

        const accountEmail = this.accountEmail;
        const privateKey = this.privateKey;

        const iat = Math.floor(Date.now() / 1000); // Issued at time
        const exp = iat + 3600; // Expires in one hour

        const payload = {
            iss: accountEmail,
            sub: accountEmail,
            aud: 'https://oauth2.googleapis.com/token',
            iat: iat,
            exp: exp,
            scope: 'https://www.googleapis.com/auth/firebase.messaging', // Customize the scopes as needed
        };

        const header = {
            alg: 'RS256',
            typ: 'JWT',
        };

        const base64Encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

        const signingInput = `${base64Encode(header)}.${base64Encode(payload)}`;

        const sign = createSign('RSA-SHA256');
        sign.update(signingInput);
        const signature = sign.sign(privateKey, 'base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

        const jwt = `${signingInput}.${signature}`;

        const fetchProper = await fetch();
        const tokenResponse = await fetchProper('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt,
            }).toString(),
        });

        if (!tokenResponse.ok) {
            const errorResponse = await tokenResponse.json();
            throw new Error(`Failed to get token: ${errorResponse.error} - ${errorResponse.error_description}`);
        }

        const { access_token, expires_in } = await tokenResponse.json();

        // Cache the new token and set its expiration time
        AuthTokenGetter.accessToken = access_token;
        AuthTokenGetter.tokenExpiry = Date.now() + (expires_in * 1000);
        console.log("new token fetched and cached");

        return AuthTokenGetter.accessToken;
    }
};