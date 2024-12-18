import * as utilities from '../utilities.js';
import * as serverVariables from '../serverVariables.js';

let repositoryCacheExpirationTime = serverVariables.get('main.repository.CacheExpirationTime');

global.repositoryCaches = [];
global.cachedRepositoriesCleanerStarted = false;

let showCacheInfo = serverVariables.get('main.repository.showCacheInfo');

export default class RepositoryCacheManager {
    /**
     * Start cleaning the cache
     */
    static startCachedRepositoriesCleaner() {
        setInterval(RepositoryCacheManager.flushExpired, repositoryCacheExpirationTime * 1000);
        if (showCacheInfo)
            console.log(BgWhite + FgBlue, "[Periodic repositories data caches cleaning process started...]");
    }

    /**
     * Adds the model data to the cache
     */
    static add(model, data) {
        if (!cachedRepositoriesCleanerStarted) {
            cachedRepositoriesCleanerStarted = true;
            RepositoryCacheManager.startCachedRepositoriesCleaner();
        }

        if (model == "")
            return;

        RepositoryCacheManager.clear(model);
        repositoryCaches.push({
            model,
            data,
            Expire_Time: utilities.nowInSeconds() + repositoryCacheExpirationTime
        });
        
        if (showCacheInfo)
            console.log(BgWhite + FgBlue, `[Data of ${model} repository has been cached]`);
    }

    /**
     * Clears the cache for this model
     */
    static clear(model) {
        repositoryCaches = repositoryCaches.filter(cache => cache.model != model);
    }

    /**
     * Try to find the cached data for the model
     */
    static find(model) {
        try {
            if (model == "")
                return null;

            for (let cache of repositoryCaches) {
                if (cache.model == model) {
                    // renew cache
                    cache.Expire_Time = utilities.nowInSeconds() + repositoryCacheExpirationTime;
                    if (showCacheInfo)
                        console.log(BgWhite + FgBlue, `[${cache.model} data retrieved from cache]`);
                    return cache.data;
                }
            }
        } catch (error) {
            console.log(BgWhite + FgRed, "[repository cache error!]", error);
        }
        return null;
    }

    /**
     * Flush all expired cache data
     */
    static flushExpired() {
        let now = utilities.nowInSeconds();

        for (let cache of repositoryCaches) {
            if (cache.Expire_Time <= now) {
                if (showCacheInfo)
                    console.log(BgWhite + FgBlue, `[Cached ${cache.model} data expired]`);
            }
        }

        repositoryCaches = repositoryCaches.filter(cache => cache.Expire_Time >= now);
    }
}
