import * as utilities from './utilities.js';
import * as serverVariables from './serverVariables.js';

let requestCacheExpirationTime = serverVariables.get('main.request.CacheExpirationTime');

global.requestCaches = [];
global.cachedRequestCleanerStarted = false;

export default class CachedRequestManager {
    /**
     * Start cleaning the cache
     */
    static startCachedRequestCleaner() {
        setInterval(CachedRequestManager.flushExpired, requestCacheExpirationTime * 1000);
        console.log(BgWhite + FgBlue, "[Periodic request caches cleaning process started...]");
    }

    /**
     * Clears the cache for an url
     */
    static clear(url, log = true) {
        if (url == "")
            return;
        
        if (log)
            console.log(BgWhite + FgBlue, `[Cached ${url} data deleted]`);
        
        //We delete the cache for the url and any derived url (urls that start with the provided url)
        requestCaches = requestCaches.filter(cache => cache.url != url && !cache.url.startsWith(url));
    }

    /**
     *  Adds the data to the cache for this url
     */
    static add(url, content, ETag = "") {
        if (!cachedRequestCleanerStarted) {
            cachedRequestCleanerStarted = true;
            CachedRequestManager.startCachedRequestCleaner();
        }

        if (url == "")
            return;

        CachedRequestManager.clear(url, false);
        requestCaches.push({
            url,
            content,
            ETag,
            Expire_Time: utilities.nowInSeconds() + requestCacheExpirationTime
        });
        console.log(BgWhite + FgBlue, `[Data for {${url}} has been cached]`);
    }

    /**
     * Find the cache for this url
     */
    static find(url) {
        try {
            if (url == "")
                return null;

            for (let cache of requestCaches) {
                if (cache.url == url) {
                    // renew cache
                    cache.Expire_Time = utilities.nowInSeconds() + requestCacheExpirationTime;
                    let content = cache.content;
                    let ETag = cache.ETag;
                    return {
                        content,
                        ETag
                    };
                }
            }
        } catch (error) {
            console.log(BgWhite + FgRed, "[request cache error!]", error);
        }
        return null;
    }

    /**
     * Delete the expired caches
     */
    static flushExpired() {
        let now = utilities.nowInSeconds();

        for (let cache of requestCaches) {
            if (cache.Expire_Time <= now) {
                console.log(BgWhite + FgBlue, `[Cached ${cache.url} data expired]`);
            }
        }

        requestCaches = requestCaches.filter(cache => cache.Expire_Time >= now);
    }

    /**
     * Search the cache for data.
     */
    static get(httpContext) {
        if (httpContext.isCacheable) {
            let data = CachedRequestManager.find(httpContext.req.url);
            if (data != null) {
                console.log(BgWhite + FgBlue, `[{${httpContext.req.url}} data retrieved from cache]`);
                return httpContext.response.JSON(data.content, data.ETag, true);
            }
            return false
        }

        return false;
    }
}