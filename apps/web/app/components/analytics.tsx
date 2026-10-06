'use client';

import { Analytics as VercelAnalytics, type BeforeSendEvent } from '@vercel/analytics/next';

/** Strips query strings (e.g. the CV id in /editor?id=…) so page views carry only the path. */
function pathOnly(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url);
  url.search = '';
  url.hash = '';
  return { ...event, url: url.toString() };
}

/** Cookieless page-view counts from Vercel Web Analytics; no CV content is ever sent. */
export function Analytics() {
  return <VercelAnalytics beforeSend={pathOnly} />;
}
