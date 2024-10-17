import path from 'path';
import fs from 'fs';
import mimes from './mimes.js';

global.wwwroot = 'wwwroot';
let defaultResource = 'index.html';

function isDirectory(url) {
    let extension = path.extname(url).replace('.', '');
    return extension == '';
}

function requestedStaticResourcePath(url) {
    let isDir = isDirectory(url);
    url += isDir ? (url.slice(-1) != '/' ? '/' : '') : '';
    let resourceName = isDir ? url + defaultResource : url;
    let resourcePath = path.join(process.cwd(), wwwroot, resourceName);
    return resourcePath;
}

function extensionToContentType(filePath) {
    let extension = path.extname(filePath).replace('.', '');
    let contentType = mimes(extension);
    if (contentType != undefined)
        return contentType;
    return 'text/html';
}

export function handleStaticResourceRequest(httpContext) {
    let filePath = requestedStaticResourcePath(httpContext.req.url);
    let contentType = extensionToContentType(filePath);

    try {
        let content = fs.readFileSync(filePath);
        console.log(contentType, filePath);
        return httpContext.response.content(contentType, content);
    } catch (error) {
        if (error.code === 'ENOENT')
            return false;
        return httpContext.response.internalError(`Server error: ${error.code}`);
    }
}