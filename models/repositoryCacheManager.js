import * as utilities from '../utilities.js';
import * as serverVariables from '../serverVariables.js';

let repositoryCacheExpirationTime = serverVariables.get('main.repository.CacheExpirationTime');

global.repositoryCaches = [];
global.cachedRepositoriesCleanerStarted = false;

export default class RepositoryCacheManager {
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
        console.log(BgWhite + FgBlue, `[Data of ${model} repository has been cached]`);

    }

    static startCachedRepositoriesCleaner() {
        setInterval(RepositoryCacheManager.flushExpired, repositoryCacheExpirationTime * 1000);
        console.log(BgWhite + FgBlue, "[Periodic repositories data caches cleaning process started...]");
    }

    /**
     * Clears the cache for this model
     */
    static clear(model) {
        if (model == "")
            return;

        let indexesToDelete = [];
        let index = 0;

        for (let cache of repositoryCaches) {
            if (cache.model == model)
                indexesToDelete.push(index);
            index++;
        }

        utilities.deleteByIndex(repositoryCaches, indexesToDelete);
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
                console.log(BgWhite + FgBlue, `[Cached ${cache.model} data expired]`);
            }
        }

        repositoryCaches = repositoryCaches.filter(cache => cache.Expire_Time >= now);
    }
}
