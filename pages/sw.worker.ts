declare var self: ServiceWorkerGlobalScope

const getCacheStorage = async () => {
  return await caches.open("artworks")
}

const addResourceToCache = async (resources: string[]) => {
  const cache = await getCacheStorage()
  await cache.addAll(resources)
}

const addCache = async (request: RequestInfo, response: Response) => {
  const cache = await getCacheStorage()
  await cache.put(request, response)
}

const cacheFirst = async (
  request: RequestInfo,
  preloadResponsePromise: Promise<Response>,
  fallbackUrl: RequestInfo
) => {
  // First try to get the resource from the cache
  const responseFromCache = await caches.match(request)
  if (responseFromCache) {
    return responseFromCache
  }

  // Next try to use the preloaded response, if it's there
  const preloadResponse = await preloadResponsePromise
  if (preloadResponse) {
    console.info("using preload response", preloadResponse)
    addCache(request, preloadResponse.clone())
    return preloadResponse
  }

  // Next try to get the resource from the network
  try {
    const responseFromNetwork = await fetch(request)
    // response may be used only once
    // we need to save clone to put one copy in cache
    // and serve second one
    addCache(request, responseFromNetwork.clone())
    return responseFromNetwork
  } catch (error) {
    const fallbackResponse = await caches.match(fallbackUrl)
    if (fallbackResponse) {
      return fallbackResponse
    }
    // when even the fallback response is not available,
    // there is nothing we can do, but we must always
    // return a Response object
    return new Response("Network error happened", {
      status: 408,
      headers: { "Content-Type": "text/plain" },
    })
  }
}

export {}
