import { useEffect } from 'react';

interface PageMetaOptions {
  title: string;
  description?: string;
  /** Canonical URL path, e.g. '/tours/snorkeling-giftun' */
  canonical?: string;
}

const SITE_NAME = 'WavesOfEgypt';
const BASE_URL = 'https://wavesofegypt.com';

/**
 * Sets document.title and key meta tags for the current page.
 * Resets to homepage defaults when the component unmounts.
 */
export function usePageMeta({ title, description, canonical }: PageMetaOptions) {
  useEffect(() => {
    const fullTitle = `${title} — ${SITE_NAME}`;
    const prevTitle = document.title;
    document.title = fullTitle;

    const setMeta = (selector: string, content: string) => {
      const el = document.querySelector<HTMLMetaElement>(selector);
      if (el) el.setAttribute('content', content);
    };

    if (description) {
      setMeta('meta[name="description"]', description);
      setMeta('meta[property="og:description"]', description);
      setMeta('meta[name="twitter:description"]', description);
    }

    setMeta('meta[property="og:title"]', fullTitle);
    setMeta('meta[name="twitter:title"]', fullTitle);

    const canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonicalEl && canonical) {
      canonicalEl.setAttribute('href', `${BASE_URL}${canonical}`);
    }

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, canonical]);
}
