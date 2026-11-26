import { PARSERS } from './parse.js';
import { SOURCES } from './sources.js';

const TIMEOUT_MS = 30000;
// A list that fails once is asked again after a pause: networks and CDNs drop the odd request.
const ATTEMPTS = 3;
const RETRY_PAUSE_MS = 2000;
const USER_AGENT = 'botpassport (+https://github.com/ilanoh/botpassport)';

async function download(source, fetchImpl) {
  const response = await fetchImpl(source.url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json, text/html' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`${source.url} answered HTTP ${response.status}`);
  }
  return response.text();
}

/** Fetches and parses one source's list. Throws with the source id on any failure, network or parsing. */
async function downloadWithRetries(source, fetchImpl, pauseMs) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await download(source, fetchImpl);
    } catch (error) {
      if (attempt === ATTEMPTS) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, pauseMs * attempt));
    }
  }
}

export async function fetchSource(source, fetchImpl = fetch, pauseMs = RETRY_PAUSE_MS) {
  try {
    return PARSERS[source.format](await downloadWithRetries(source, fetchImpl, pauseMs));
  } catch (error) {
    throw new Error(`${source.id}: ${error.message}`, { cause: error });
  }
}

function describe(source, parsed) {
  const { id, operator, userAgents, purpose, docs, url, reverseDns = [] } = source;
  return { id, operator, userAgents, purpose, docs, url, reverseDns, ...parsed };
}

/**
 * Every source fetched at once. A source that fails is listed under `failures` and left out of `sources`, so a
 * consumer can keep its previous prefixes for that source. The snapshot carries no fetch time: two snapshots of
 * the same lists are byte for byte the same, which keeps a daily refresh commit free of noise.
 */
export async function buildSnapshot({ sources = SOURCES, fetchImpl = fetch } = {}) {
  const results = await Promise.allSettled(sources.map((source) => fetchSource(source, fetchImpl)));
  const snapshot = { sources: [], failures: [] };
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      snapshot.sources.push(describe(sources[index], result.value));
    } else {
      snapshot.failures.push({ id: sources[index].id, reason: result.reason.message });
    }
  });
  return snapshot;
}

/** The sources of a snapshot whose purpose is in the given list, all of them when the list is empty. Pure. */
export function selectSources(snapshot, purposes = []) {
  return purposes.length === 0 ? snapshot.sources : snapshot.sources.filter((s) => purposes.includes(s.purpose));
}
