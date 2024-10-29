// small generally useful functions

import queryStringParser from "query-string";

/**
 * @returns the input string with a capital first letter
 */
export function capitalizeFirstLetter(s) {
    if (typeof s !== 'string')
        return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * @returns the current time, in seconds
 */
export function nowInSeconds() {
    const now = new Date();
    return Math.round(now.getTime() / 1000);
}

/**
 * @returns the time, formatted into a string
 */
export function secondsToDateString(dateInSeconds, localizationId = 'fr-FR') {
    const hoursOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    return new Date(dateInSeconds * 1000).toLocaleDateString(localizationId, hoursOptions);
}

/**
 * @returns the current url, without the query string
 */
export function removeQueryString(url) {
    let queryStringMarkerPosition = url.indexOf('?');
    if (queryStringMarkerPosition >= 0)
        url = url.substr(0, queryStringMarkerPosition);
    return url;
}

/**
 * @returns the query string
 */
export function getQueryString(url) {
    let queryStringMarkerPosition = url.indexOf('?');
    if (queryStringMarkerPosition >= 0)
        return url.substr(queryStringMarkerPosition, url.length);
    return undefined;
}

/**
 * @returns a random number, with the specified number of digits
 */
export function getRandomCode(nbDigits) {
    let code = 0;
    for (let i = 0; i < nbDigits; i++) {
        let digit = Math.trunc(Math.random() * 10);
        code = code * 10 + digit;
    }
    return code;
}

/**
 * 
 * @param {Array} array 
 * @param {int[]} indexes The indexes of the elements we want to delete, in ascending order
 */
export function deleteByIndex(array, indexes) {
    for (let i = indexes.length - 1; i >= 0; i--) {
        array.splice(indexes[i], 1);
    }
}

export function tryParseInt(str) {
    if(str !== null) {
        if(str.length > 0) {
            if (!isNaN(str)) {
                return parseInt(str);
            }
        }
    }
    return NaN;
}

export function tryParseFloat(str) {
    if(str !== null) {
        if(str.length > 0) {
            if (!isNaN(str)) {
                return parseFloat(str);
            }
        }
    }
    return NaN;
}

/**
 * Decomposes the url path into either
 * MVC pattern /controller/action/id?querystring
 * or
 * API pattern /api/model/id?querystring
 */
export function decomposePath(url) {
    let isAPI = false;
    let model = undefined;
    let controllerName = undefined;
    let action = undefined;
    let id = '';
    let params = null;

    let queryString = getQueryString(url);
    if (queryString != undefined)
        params = queryStringParser.parse(queryString);
    let path = removeQueryString(url).toLowerCase();

    if (path.indexOf('/api') >= 0) {
        isAPI = true;
        path = path.replace('/api', '');
    }

    let urlParts = path.split('/');

    if (urlParts[1] != undefined) {
        model = capitalizeFirstLetter(urlParts[1]);
        controllerName = model + 'Controller';
    }

    if (isAPI) {
        if (urlParts[2] != undefined) {
            id = urlParts[2];
        }
    } else {
        //Its not an API, so it's a controller
        if (urlParts[2] != undefined && urlParts[2] != '')
            action = urlParts[2];
        else
            action = 'index';

        if (urlParts[3] != undefined)
            id = urlParts[3];
    }

    return { isAPI, model, controllerName, action, id, queryString, params };
}