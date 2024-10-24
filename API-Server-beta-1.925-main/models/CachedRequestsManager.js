import * as utilities from "../utilities.js";
import * as serverVariables from "../serverVariables.js";

let repositoryCachesExpirationTime = serverVariables.get("main.repository.CacheExpirationTime");

// Repository file data models cache
global.requestCaches = [];
global.requestCachesCleanerStarted = false;

export default class CachedRequestsManager{


    static add(url, data,Etag="") {
        if (!requestCachesCleanerStarted) {
            requestCachesCleanerStarted = true;
            CachedRequestsManager.startCachedRepositoriesCleaner();
        }
        if (url != "") {
            CachedRequestsManager.clear(url);
            requestCaches.push({
                url,
                data,
                Etag,
                Expire_Time: utilities.nowInSeconds() + repositoryCachesExpirationTime
            });
            console.log(BgWhite + FgBlue, `[Ajout  dans la cache de ${url}]`);
        }
    }
    static startCachedRepositoriesCleaner() {
        // periodic cleaning of expired cached repository data
        setInterval(CachedRequestsManager.flushExpired, repositoryCachesExpirationTime * 1000);
        console.log(BgWhite + FgBlue, "[Periodic repositories data caches cleaning process started...]");

    }
    static clear(url) {
        if (url != "") {
            let indexToDelete = [];
            let index = 0;
            for (let cache of requestCaches) {
                if (cache.url == url) indexToDelete.push(index);
                index++;
            }
            utilities.deleteByIndex(requestCaches, indexToDelete);
        }
    }
    static find(url) {
        try {
            if (url != "") {
                for (let cache of requestCaches) {
                    if (cache.url == url) {
                        // renew cache
                        cache.Expire_Time = utilities.nowInSeconds() + repositoryCachesExpirationTime;
                        console.log(BgWhite + FgBlue, `[${cache.url} data retrieved from cache]`);
                        return cache;
                    }
                }
            }
        } catch (error) {
            console.log(BgWhite + FgRed, "[repository cache error!]", error);
        }
        return null;
    }
    static flushExpired() {
        let now = utilities.nowInSeconds();
        for (let cache of requestCaches) {
            if (cache.Expire_Time <= now) {
                console.log(BgWhite + FgBlue, "Cached file data of " + cache.url + ".json expired");
            }
        }
        requestCaches = requestCaches.filter( cache => cache.Expire_Time > now);
    }
    static get(HttpContext){
        let requestCaches=CachedRequestsManager.find(HttpContext.url)
        if(requestCaches!=null){
            HttpContext.response.JSON( requestCaches.data,requestCaches.Etag , true)
            return true;
        }
        else{
            return false;
        }
    }

}
