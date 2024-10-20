import dateAndTime from 'date-and-time';
import process from 'process';
import { createServer } from 'http';
import * as os from 'os';

import { log } from './log.js';
import * as serverVariables from "./serverVariables.js";
import HttpContext from './httpContext.js';
import MiddlewarePipeline from './middlewarePipeline.js';
import * as router from './router.js';
import { handleCORSPreflight } from './cors.js';
import { handleStaticResourceRequest } from './staticResourcesServer.js'
import CachedRequestManager from './CachedRequestsManager.js';

let api_server_version = serverVariables.get('main.api_server_version');

export default class APIServer {
    constructor(port = process.env.PORT || 5001) {
        this.port = port;
        this.initMiddlewarePipeline();
        this.httpContext = null;
        this.httpServer = createServer(async (req, res) => { this.handleHttpRequest(req, res) });
    }

    initMiddlewarePipeline() {
        this.middlewarePipeline = new MiddlewarePipeline();

        // Common middlewares
        this.middlewarePipeline.add(handleCORSPreflight);
        this.middlewarePipeline.add(handleStaticResourceRequest);

        // API middleware
        this.middlewarePipeline.add(CachedRequestManager.get);
        this.middlewarePipeline.add(router.apiEndpoint);
    }

    async handleHttpRequest(req, res) {
        this.markRequestProcessStartTime();
        this.httpContext = await HttpContext.create(req, res);
        this.showRequestInfo();

        if (! (await this.middlewarePipeline.handleHttpRequest(this.httpContext)))
            this.httpContext.response.notFound('This endpoint does not exist...');

        this.showRequestProcessTime();
        this.showMemoryUsage();
    }

    start() {
        this.httpServer.listen(this.port, () => { this.startupMessage() });
    }

    startupMessage() {
        console.log(FgGreen, "*************************************");
        console.log(FgGreen, `* API SERVER - version : ${api_server_version} *`);
        console.log(FgGreen, "*************************************");
        console.log(FgGreen, "* Author: Colin Bougie              *");
        console.log(FgGreen, "* Lionel-Groulx College             *");
        console.log(FgGreen, "* Release date: october 2024        *");
        console.log(FgGreen, "*************************************");
        console.log(FgWhite + BgGreen, `HTTP Server running on ${os.hostname()} and linstening to port ${this.port}...`);
        this.showMemoryUsage();
    }

    showRequestInfo() {
        let time = dateAndTime.format(new Date(), 'HH:mm:ss');

        console.log(FgGreen, '-------------------------', time, '-------------------------');
        console.log(FgGreen + Bright, `Request from ${this.httpContext.hostIp} --> [${this.httpContext.req.method}::${this.httpContext.req.url}]`);

        if (this.httpContext.payload)
            console.log(FgGreen + Bright, "Request payload -->", JSON.stringify(this.httpContext.payload).substring(0, 127) + "...");
    }

    markRequestProcessStartTime() {
        this.requestProcessStartTime = process.hrtime();
    }

    showRequestProcessTime() {
        let requestProcessEndTime = process.hrtime(this.requestProcessStartTime);
        console.log(FgCyan, "Response time: ", Math.round((requestProcessEndTime[0] * 1000 + requestProcessEndTime[1] / 1000000) / 1000 * 10000) / 10000, "seconds");
    }

    showMemoryUsage() {
        // for more info https://www.valentinog.com/blog/node-usage/
        const used = process.memoryUsage();
        console.log(FgMagenta, "Memory usage: ", "RSet size:", Math.round(used.rss / 1024 / 1024 * 100) / 100, "Mb |",
            "Heap size:", Math.round(used.heapTotal / 1024 / 1024 * 100) / 100, "Mb |",
            "Used size:", Math.round(used.heapUsed / 1024 / 1024 * 100) / 100, "Mb");
    }
}