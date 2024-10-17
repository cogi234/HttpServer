import { log } from './log.js';

function accessControlConfig(httpContext) {
    if (httpContext.req.headers['sec-fetch-mode'] == 'cors') {
        httpContext.res.setHeader('Access-Control-Allow-Origin', '*');
        httpContext.res.setHeader('Access-Control-Allow-Methods', '*');
        httpContext.res.setHeader('Access-Control-Allow-Headers', '*');
        httpContext.res.setHeader('Access-Control-Expose-Headers', '*');
    }
}

export function handleCORSPreflight(httpContext) {
    accessControlConfig(httpContext);
    if (httpContext.req.method === "OPTIONS") {
        console.log(BgRed + FgWhite, "[CORS preflight verifications]");
        httpContext.res.end();
        return true;
    }
    return false;
}