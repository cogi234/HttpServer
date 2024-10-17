import queryString from "query-string";
import Response from './response.js';
import * as utilities from './utilities.js';

let httpContext = null;

export default class HttpContext {
    constructor(req, res) {
        this.req = req;
        this.res = res;
        this.path = utilities.decomposePath(req.url);
        this.response = new Response(this);
        this.payload = null;
        this.secure = req.headers['x-forwarded-proto'] != undefined;
        this.host = (this.secure ? "https://" : "http://") + req.headers['host'];
        this.hostIp = req.headers['x-forwarded-for'] != undefined
            ? req.headers['x-forwarded-for'].substring(0, 15)
            : (req.connection.remoteAdress == "::1"
                ? "localhost"
                : req.connection.remoteAdress.substring(0, 15));
        this.isCacheable = this.path.isAPI && this.req.method == "GET" && this.path.id == undefined;
    }

    static get() {
        return httpContext;
    }

    async getJSONPayload() {
        return await new Promise(resolve => {
            let body = [];
            this.req.on('data', chunk => {
                body += chunk;
            }).on('end', () => {
                if (body.length > 0) {
                    if (this.req.headers['content-type'] == 'application/json') {
                        try {
                            this.payload = JSON.parse(body);
                        } catch (error) {
                            console.log(error);
                            this.payload = null;
                        }
                    } else if (this.req.headers['content-type'] == 'application/x-www-form-urlencoded') {
                        try {
                            this.payload = queryString.parse(body.toString());
                        } catch (error) {
                            console.log(error);
                        }
                    }
                } else {
                    try {
                        this.payload = queryString.parse(utilities.getQueryString(this.req.url));
                    }
                    catch (error) {
                        console.log(error);
                    }
                }
                //if the payload is an empty array, we make it null
                if (this.payload && Object.keys(this.payload).length == 0)
                    this.payload = null;
                resolve(this.payload);
            });
        });
    }

    static async create(req, res) {
        httpContext = new HttpContext(req, res);
        await httpContext.getJSONPayload();
        return httpContext;
    }
}