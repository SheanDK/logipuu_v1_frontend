//frontend/src/components/EmotionCache.tsx

'use client';

import * as React from 'react';
import createCache from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';
import { CacheProvider as EmotionCacheProvider } from '@emotion/react';
import type { EmotionCache, Options as EmotionCacheOptions } from '@emotion/cache';

// This is the interface for the props of our provider component
export interface NextAppDirEmotionCacheProviderProps {
  /** This is the options passed to createCache() from emotion. */
  options: Omit<EmotionCacheOptions, 'insertionPoint'>;
  /** By default, emotion inserts styles to the head tag at the top of the page.
   * This makes it easy for MUI styles to be overridden by other styles created by other libraries.
   * This is especially important for multi-bundle applications, like microfrontends.
   * It can also be useful for single-bundle applications.
   *
   * If you use a different insertion point, you might have to adjust the nonce if you use CSP.
   * See https://emotion.sh/docs/nonce
   */
  insertionPoint?: HTMLElement;
  children: React.ReactNode;
}

// This component is a wrapper around Emotion's CacheProvider.
// It is responsible for creating a new cache instance on every request
// and inserting the styles into the head tag of the page.
export function NextAppDirEmotionCacheProvider(props: NextAppDirEmotionCacheProviderProps) {
  const { options, children } = props;

  const [{ cache, flush }] = React.useState(() => {
    const cache = createCache(options);
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted: string[] = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) {
      return null;
    }
    let styles = '';
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    );
  });

  return <EmotionCacheProvider value={cache}>{children}</EmotionCacheProvider>;
}