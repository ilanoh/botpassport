# botpassport

The IP addresses that search engines and AI crawlers publish for their bots, merged into one list for your
firewall, CrowdSec, nginx, Caddy or nftables, and refreshed every day.

A site that wants to appear in AI answers (generative engine optimisation, GEO) must let ChatGPT, Claude,
Perplexity, Gemini and the search engines read it. A site behind a firewall bans scanners, often by user agent or
by behaviour, and one wrong ban keeps an AI answer engine away for months without a warning. botpassport gives
the addresses each operator vouches for, so a ban never reaches them, and it never trusts a user agent, which
anyone can fake.

## Sources

Every list comes from the operator's own documentation. botpassport adds no address of its own.

| Operator | Crawlers | Purpose | List |
| --- | --- | --- | --- |
| OpenAI | GPTBot | ai-training | https://openai.com/gptbot.json |
| OpenAI | OAI-SearchBot | ai-search | https://openai.com/searchbot.json |
| OpenAI | ChatGPT-User | ai-user | https://openai.com/chatgpt-user.json |
| OpenAI | OAI-AdsBot | ads | https://openai.com/adsbot.json |
| Anthropic | ClaudeBot, Claude-User, Claude-SearchBot | ai-search | https://claude.com/crawling/bots.json |
| Perplexity | PerplexityBot | ai-search | https://www.perplexity.ai/perplexitybot.json |
| Perplexity | Perplexity-User | ai-user | https://www.perplexity.ai/perplexity-user.json |
| Google | Googlebot and the common crawlers | search | https://developers.google.com/static/crawling/ipranges/common-crawlers.json |
| Google | AdsBot-Google, Mediapartners-Google | ads | https://developers.google.com/static/crawling/ipranges/special-crawlers.json |
| Google | user-triggered fetchers | ai-user | https://developers.google.com/static/crawling/ipranges/user-triggered-fetchers-google.json |
| Google | user-triggered agents | ai-user | https://developers.google.com/static/crawling/ipranges/user-triggered-agents.json |
| Microsoft | bingbot | search | https://www.bing.com/toolbox/bingbot.json |
| Apple | Applebot | search | https://search.developer.apple.com/applebot.json |
| Mistral AI | MistralAI-User | ai-user | https://mistral.ai/mistralai-user-ips.json |
| Mistral AI | MistralAI-Index | ai-search | https://mistral.ai/mistralai-index-ips.json |
| DuckDuckGo | DuckAssistBot | ai-search | https://duckduckgo.com/duckassistbot.json |
| Amazon | Amazonbot | ai-training | https://developer.amazon.com/amazonbot/ip-addresses/ |
| Amazon | Amzn-SearchBot | ai-search | https://developer.amazon.com/amazonbot/searchbot-ip-addresses/ |
| Amazon | Amzn-User | ai-user | https://developer.amazon.com/amazonbot/live-ip-addresses/ |
| Common Crawl | CCBot | ai-training | https://index.commoncrawl.org/ccbot.json |

Two lists are left out on purpose. Google's `user-triggered-fetchers.json` covers Google Cloud hosts that any
Google Cloud customer can run code on. Meta publishes no address list for `meta-externalagent`. An operator that
moves its crawlers to new addresses before it updates its list is covered by reverse DNS where it documents one:
Google, Microsoft, Apple and Common Crawl (`botpassport check <ip> --dns`).

## Use the published files

A GitHub Action fetches every list each day and commits the result to [`dist/`](dist) when a list changed. No
install is needed:

| File | For |
| --- | --- |
| [`dist/botpassport.json`](dist/botpassport.json) | every source with its prefixes, operator, crawlers and purpose |
| [`dist/botpassport.txt`](dist/botpassport.txt) | one prefix per line |
| [`dist/botpassport-nginx.conf`](dist/botpassport-nginx.conf) | `allow` lines for nginx |
| [`dist/botpassport.caddy`](dist/botpassport.caddy) | a Caddy snippet with the `@botpassport` matcher |
| [`dist/botpassport.nft`](dist/botpassport.nft) | nftables sets `botpassport_v4` and `botpassport_v6` |

```bash
curl -fsSL https://raw.githubusercontent.com/ilanoh/botpassport/main/dist/botpassport.txt
```

## Command line

Node.js 22 or later, no dependency.

```bash
npx botpassport update                       # every list into botpassport.json
npx botpassport export caddy --out botpassport.caddy
npx botpassport export txt --purpose ai-search,ai-user
npx botpassport check 216.73.216.12          # which crawler list holds an address
npx botpassport check 66.249.66.1 --dns      # also confirm it by forward confirmed reverse DNS
```

A source that cannot be fetched is reported and left out of the run, and the command fails only when no list
could be fetched.

## CrowdSec

`crowdsec-sync` keeps a CrowdSec allowlist (CrowdSec 1.6.8 or later) equal to the lists, so no local scenario and
no blocklist bans an announced crawler:

```bash
sudo npx botpassport crowdsec-sync --dry-run
sudo npx botpassport crowdsec-sync              # allowlist "botpassport", or --name another
cscli allowlists check 216.73.216.12
```

Each item carries `botpassport:<source>` as its description. A run removes only the stale items of a source it
fetched, so a list that is briefly unreachable keeps its addresses, and items added by hand are never touched.
Run it daily, from a systemd timer or cron.

## Library

```js
import { buildSnapshot, buildMatcher, exportAs } from 'botpassport';

const snapshot = await buildSnapshot();
const matcher = buildMatcher(snapshot.sources);
matcher.sourcesOf('216.73.216.12'); // [{ operator: 'Anthropic', userAgents: [...], ... }]
exportAs('nginx', snapshot.sources);
```

## Adding a crawler

Add an entry to [`src/sources.js`](src/sources.js) with the operator's documentation page and the URL of the list
it publishes. A list in the `{"prefixes": [{"ipv4Prefix": ...}, {"ipv6Prefix": ...}]}` format needs nothing else.

## Licence

MIT
