// Writes dist/: the snapshot and each export, from the lists fetched now. A source that fails keeps its entry of
// the previous dist/botpassport.json, so one unreachable list never empties the published files.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { exportAs } from '../src/export.js';
import { buildSnapshot } from '../src/snapshot.js';

const DIST = new URL('../dist/', import.meta.url);
const FILES = {
  'botpassport.txt': 'txt',
  'botpassport-nginx.conf': 'nginx',
  'botpassport.caddy': 'caddy',
  'botpassport.nft': 'nftables',
};

async function previousSources() {
  const text = await readFile(new URL('botpassport.json', DIST), 'utf8').catch(() => null);
  return text ? JSON.parse(text).sources : [];
}

const snapshot = await buildSnapshot();
const previous = await previousSources();
for (const failure of snapshot.failures) {
  const kept = previous.find((source) => source.id === failure.id);
  console.error(`failed ${failure.reason}${kept ? ', kept its previous prefixes' : ''}`);
  if (kept) {
    snapshot.sources.push(kept);
  }
}
if (snapshot.sources.length === 0) {
  throw new Error('no list could be fetched');
}
snapshot.sources.sort((a, b) => a.id.localeCompare(b.id));
await mkdir(DIST, { recursive: true });
await writeFile(new URL('botpassport.json', DIST), `${JSON.stringify({ sources: snapshot.sources }, null, 2)}\n`);
for (const [file, format] of Object.entries(FILES)) {
  await writeFile(new URL(file, DIST), exportAs(format, snapshot.sources));
}
console.error(`dist: ${snapshot.sources.length} sources`);
