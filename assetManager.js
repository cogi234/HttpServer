import fs from 'fs';
import HttpContext from './httpContext.js';
import { v1 as uuidv1 } from 'uuid';

let assetsDirectory = "storage";

/**
 * Reveives a base64 encoded file, assigns it a UUID and stores it in the assets path
 * @returns the new url of the file
 */
export function save(base64Data) {
    if (base64Data.indexOf(';base64,') == -1)
        return base64Data;

    let parts = base64Data.split(';base64,');
    let ext = parts[0].split('/')[1];
    let blob = new Buffer.from(parts[1], 'base64');
    let assetPath = '';
    let assetFileName = '';
    //Continue generating new uuids until it's not taken
    do {
        let UUID = uuidv1();
        assetFileName = UUID + '.' + ext;
        assetPath = `./${wwwroot}/${assetsDirectory}/${assetFileName}`;
    } while (fs.existsSync(assetPath));

    fs.writeFileSync(assetPath, blob);
    return assetFileName;
}

export function remove(assetFileName) {
    if (assetFileName != '') {
        let assetPath = `./${wwwroot}/${assetsDirectory}/${assetFileName}`;
        fs.unlinkSync(assetPath);
    }
} 

export function addHostReference(assetFileName) {
    let host = HttpContext.get().host;
    return `${host}/${assetsDirectory}/${assetFileName}`;
}