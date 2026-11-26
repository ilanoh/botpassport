# AGENTS.md

botpassport merges the crawler IP lists that search engines and AI operators publish. Read `README.md` first.

## Layout

| Path | Role |
| --- | --- |
| `src/sources.js` | the registry: one entry per published list, with its operator, crawlers, purpose, docs and list URL |
| `src/parse.js` | pure parsers of the two list formats (`prefixes` JSON, `html`) and of a CIDR |
| `src/snapshot.js` | fetches every list with retries into a snapshot; a failed list goes to `failures` |
| `src/match.js` | address matching with `node:net` BlockList, and forward confirmed reverse DNS |
| `src/export.js` | pure exports: txt, json, nginx, caddy, nftables |
| `src/crowdsec.js` | the CrowdSec allowlist sync: a pure plan, then `cscli allowlists` calls |
| `src/cli.js` | the `botpassport` command |
| `scripts/build-dist.js` | writes `dist/`, keeping the previous prefixes of a list that failed |
| `dist/` | generated daily by `.github/workflows/refresh.yml`; never edit by hand |

## Commands

```bash
npm install          # eslint only, for development
npm test             # node --test
npm run lint         # eslint
node src/cli.js update --out .tmp/snapshot.json
node scripts/build-dist.js
```

## Rules

1. An address enters the list only from the operator's own published list. Never add an address by hand, never
   trust a user agent, and cite the operator's documentation page in `docs`.
2. No runtime dependency: Node.js 22 standard library only.
3. Functions stay small and pure where they can; network and `cscli` calls stay at the edges.
4. `dist/` must stay reproducible: the snapshot holds no fetch time.
5. Style: 2 spaces, single quotes, semicolons, trailing commas, lines up to 120 characters, `eqeqeq`, braces always.
