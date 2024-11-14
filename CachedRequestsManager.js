import Repository from './models/repository.js';
import * as serverVariables from './serverVariables.js';
import * as utilities from './utilities.js';

global.requestCacheExpirationTime = serverVariables.get('main.request.CacheExpirationTime');

global.requestCaches = [];
global.cachedRequestCleanerStarted = false;

let showCacheInfo = serverVariables.get('main.request.showCacheInfo');

export default class CachedRequestManager {
    /**
     * Start cleaning the cache
     */
    static startCachedRequestCleaner() {
        setInterval(CachedRequestManager.flushExpired, requestCacheExpirationTime * 1000);
        if (showCacheInfo)
            console.log(BgWhite + FgBlue, "[Periodic request caches cleaning process started...]");
    }

    /**
     * Clears the cache for an url
     */
    static clear(url) {
        if (url == "")
            return;

        if (showCacheInfo)
            console.log(BgWhite + FgBlue, `[Cached ${url} data deleted]`);

        //We delete the cache for the url
        requestCaches = requestCaches.filter(cache => cache.url.toLowerCase().indexOf(url.toLowerCase()) == -1);
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
        if (showCacheInfo)
            console.log(BgWhite + FgBlue, `[Data for {GET: ${url}} has been cached]`);
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
                    return cache;
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
                if (showCacheInfo)
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
                if (data.ETag == Repository.getETag(httpContext.path.model)) {
                    if (showCacheInfo)
                        console.log(BgWhite + FgBlue, `[{${httpContext.req.url}} data retrieved from cache]`);
                    return httpContext.response.JSON(data.content, data.ETag, true);
                } else {
                    //If we found cache, but it's the wrong ETag, we clear it
                    CachedRequestManager.clear(httpContext.path.model);
                    return false;
                }
            }
            return false
        }
        return false;
    }
}