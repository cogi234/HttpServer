import { log } from './log.js';

export default class Response {
    constructor(HttpContext) {
        this.HttpContext = HttpContext;
        this.res = HttpContext.res;
        this.errorContent = "";
    }

    /**
     * Responds with the status number and an error message, if specified
     */
    status(number, errorMessage = '') {
        if (errorMessage) {
            this.res.writeHead(number, { 'content-type': 'application/json' });
            this.errorContent = { 'error_description': errorMessage };
            return this.end(JSON.stringify(this.errorContent));
        } else {
            this.res.writeHead(number, { 'content-type': 'text/plain' });
            return this.end();
        }
    }

    /**
     * Ends the response, with content if specified
     */
    end(content = null) {
        if (content)
            this.res.end(content);
        else
            this.res.end();

        console.log(FgCyan + Bright, "Response status:", this.res.statusCode, this.errorContent);
        return true;
    }

    /////////////////////////////////////////////// 200 ///////////////////////////////////////////////////////

    ok() {
        return this.status(200);
    }
    ETag(etag) {
        console.log(FgCyan + Bright, "Response header ETag key:", etag);
        this.res.writeHead(204, { 'ETag': etag });
        return this.end();
    }
    JSON(object, etag = "") {                     // ok status with content
        if (etag != "")
            this.res.writeHead(200, { 'content-type': 'application/json', "ETag" : etag });
        else
            this.res.writeHead(200, { 'content-type': 'application/json' });
        
        if (object) {
            let content = JSON.stringify(object);
            console.log(FgCyan + Bright, "Response payload -->", content.toString().substring(0, 75) + "...");
            return this.end(content);
        }
        return this.end();
    }
    HTML(content) {
        this.res.writeHead(200, { 'content-type': 'text/html' });
        return this.end(content);
    }
    accepted() {
        return this.status(202);
    }
    deleted() {
        return this.status(202);
    }
    created(object) {
        this.res.writeHead(201, { 'content-type': 'application/json' });
        return this.end(JSON.stringify(object));
    }
    /**
     * Let the browser cache the received content locally
     */
    content(contentType, content) {
        this.res.writeHead(200, { 'content-type': contentType, "Cache-Control": 'public, max-age=31536000' });
        return this.end(content);
    }
    noContent() {
        return this.status(204);
    }
    updated() {
        return this.status(204);
    }

    /////////////////////////////////////////////// 300 ///////////////////////////////////////////////////////

    redirect(url) {
        this.res.writeHead(302, { 'Location': url })
        return this.end();
    }

    /////////////////////////////////////////////// 400 ///////////////////////////////////////////////////////

    badRequest(errormessage = '') {
        return this.status(400, errormessage);
    }
    unAuthorized(errormessage = '') {
        return this.status(401, errormessage);
    }
    forbidden(errormessage = '') {
        return this.status(403, errormessage);
    }
    notFound(errormessage = '') {
        return this.status(404, errormessage);
    }
    /**
     * Method not allowed status
     */
    notAllowed(errormessage = '') {
        return this.status(405, errormessage);
    }
    conflict(errormessage = '') {
        return this.status(409, errormessage);
    }
    /**
     * Unsupported Media Type status
     */
    unsupported(errormessage = '') {
        return this.status(415, errormessage);
    }
    /**
     * Unprocessable Entity status
     */
    unprocessable(errormessage = '') {
        return this.status(422, errormessage);
    }

    //Custom status
    userNotFound(errormessage = '') {
        return this.status(481, errormessage);
    }
    wrongPassword(errormessage = '') {
        return this.status(482, errormessage);
    }

    /////////////////////////////////////////////// 500 ///////////////////////////////////////////////////////

    internalError(errormessage = '') {
        return this.status(500, errormessage);
    }
    notImplemented(errormessage = '') {
        return this.status(501, errormessage);
    }
}