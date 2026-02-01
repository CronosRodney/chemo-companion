import { useEffect, useState, useCallback } from 'react';

interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (!navigator.onLine) {
        setWasOffline(true);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}

// Service Worker Registration Hook
export function useServiceWorker() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Check if service worker is registered
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          setOfflineReady(true);
          
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setNeedRefresh(true);
                }
              });
            }
          });
        }
      });
    }
  }, []);

  const updateServiceWorker = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  }, []);

  return { needRefresh, offlineReady, updateServiceWorker };
}

// Cache data locally
const CACHE_PREFIX = 'oncotrack_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function useLocalCache<T>(key: string, initialValue: T) {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  
  const [data, setData] = useState<T>(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const entry: CacheEntry<T> = JSON.parse(cached);
        const isValid = Date.now() - entry.timestamp < CACHE_EXPIRY;
        if (isValid) {
          return entry.data;
        }
      }
    } catch (error) {
      console.error('Error reading from cache:', error);
    }
    return initialValue;
  });

  const updateCache = useCallback((newData: T) => {
    setData(newData);
    try {
      const entry: CacheEntry<T> = {
        data: newData,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(entry));
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  }, [cacheKey]);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(cacheKey);
      setData(initialValue);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, [cacheKey, initialValue]);

  return { data, updateCache, clearCache };
}

// Clear all OncoTrack cache
export function clearAllCache() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
}
