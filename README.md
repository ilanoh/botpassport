# botpassport: allowlist AI crawlers and search engine bots by their official IP ranges

[![npm](https://img.shields.io/npm/v/botpassport)](https://www.npmjs.com/package/botpassport)
[![license](https://img.shields.io/github/license/ilanoh/botpassport)](LICENSE)
[![lists refreshed daily](https://github.com/ilanoh/botpassport/actions/workflows/refresh.yml/badge.svg)](https://github.com/ilanoh/botpassport/actions/workflows/refresh.yml)

**Never ban GPTBot, ClaudeBot, PerplexityBot or Googlebot again: one daily refreshed list of the IP ranges that
OpenAI, Anthropic, Perplexity, Google, Microsoft, Apple, Amazon, Mistral, DuckDuckGo and Common Crawl publish for
their crawlers, ready for CrowdSec, nginx, Caddy and nftables.**

[Lists](dist) · [npm](https://www.npmjs.com/package/botpassport) · [Sources](#sources) · [FAQ](#faq)

A site that wants to be cited in ChatGPT, Claude, Perplexity or Google AI Overviews (generative engine
optimisation, GEO) has to let their crawlers read it. The same site runs a firewall or CrowdSec that bans
scanners by behaviour or by user agent, and one wrong ban keeps an AI answer engine away for months without a
warning. botpassport takes the addresses each operator vouches for, from the operator's own published list, so a
ban never reaches them. It never trusts a user agent, which anyone can fake.

## Try it in one minute

```bash
npx botpassport check 216.73.216.12
# 216.73.216.12 is in the list of Anthropic (ClaudeBot, Claude-User, Claude-SearchBot), https://claude.com/crawling/bots.json

npx botpassport check 66.249.66.1 --dns
# also confirmed by forward confirmed reverse DNS: crawl-66-249-66-1.googlebot.com

curl -fsSL https://raw.githubusercontent.com/ilanoh/botpassport/main/dist/botpassport.txt | head
```

## Allowlist AI crawlers in CrowdSec

`crowdsec-sync` keeps a CrowdSec allowlist (CrowdSec 1.6.8 or later) equal to the published lists, so no
scenario, blocklist or manual decision bans an announced crawler:

```bash
sudo npx botpassport crowdsec-sync --dry-run
sudo npx botpassport crowdsec-sync            # allowlist "botpassport", or --name another
cscli allowlists check 216.73.216.12          # is allowlisted by item 216.73.216.0/22 from botpassport
```

Each item carries `botpassport:<source>` as its description. A run removes only the stale items of a source it
fetched, so a list that is briefly unreachable keeps its addresses, and items you added by hand are never
touched. A second run with unchanged lists changes nothing. Run it daily from a systemd timer or cron.

## Allowlist AI crawlers in nginx, Caddy or nftables

The [`dist/`](dist) folder is rebuilt every day by a GitHub Action and committed only when a list changed:

| File | For |
| --- | --- |
| [`dist/botpassport.txt`](dist/botpassport.txt) | one prefix per line, IPv4 then IPv6 |
| [`dist/botpassport.json`](dist/botpassport.json) | every source with its prefixes, operator, crawlers and purpose |
| [`dist/botpassport-nginx.conf`](dist/botpassport-nginx.conf) | `allow` lines for nginx |
| [`dist/botpassport.caddy`](dist/botpassport.caddy) | a Caddy snippet defining the `@botpassport` matcher |
| [`dist/botpassport.nft`](dist/botpassport.nft) | nftables sets `botpassport_v4` and `botpassport_v6` |

The formats were checked with `nginx -t`, `caddy validate` and `nft -c`. Or build the files yourself:

```bash
npx botpassport export caddy --out /etc/caddy/botpassport.caddy
npx botpassport export nginx --purpose ai-search,ai-user --out /etc/nginx/botpassport.conf
npx botpassport export nftables --out /etc/nftables.d/botpassport.nft
```

Caddy, sending crawlers straight to the app while every other visitor passes your guard first:

```caddy
import /etc/caddy/botpassport.caddy

example.com {
	import botpassport
	handle @botpassport {
		reverse_proxy localhost:3000
	}
	handle {
		# your rate limit, challenge or ban rules
		reverse_proxy localhost:3000
	}
}
```

## Sources

Every list comes from the operator's own documentation. botpassport adds no address of its own.

| Operator | Crawlers | Purpose | Official list |
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

Purposes: `search` indexes for a search engine, `ai-search` indexes for an AI answer engine, `ai-user` fetches a
page because a person asked an assistant about it, `ai-training` collects pages to train models, `ads` checks ad
landing pages. `--purpose` keeps only the ones you name.

Left out on purpose: Google's `user-triggered-fetchers.json` covers Google Cloud hosts that any Google Cloud
customer can run code on, and Meta publishes no address list for `meta-externalagent`.

## How it works

1. `update` fetches every list at once, retrying a failed list twice, and validates each prefix.
2. A list that fails is reported and left out of that run; `crowdsec-sync` then keeps its previous items, and the
   daily `dist/` build keeps its previous prefixes.
3. `check --dns` adds forward confirmed reverse DNS for the operators that document it (Google, Microsoft, Apple,
   Common Crawl): the address resolves to a hostname under the operator's domain, which resolves back to the
   address. It catches a crawler on a new address its operator has not listed yet.
4. A snapshot holds no fetch time, so two runs on the same lists give the same bytes.

Node.js 22 or later, no runtime dependency.

## Library

```js
import { buildSnapshot, buildMatcher, exportAs, verifyReverseDns } from 'botpassport';

const { sources, failures } = await buildSnapshot();
const matcher = buildMatcher(sources);
matcher.sourcesOf('216.73.216.12');        // [{ operator: 'Anthropic', userAgents: [...], purpose, url, ... }]
exportAs('nginx', sources);                // the nginx allow lines
await verifyReverseDns('66.249.66.1', ['.googlebot.com']); // 'crawl-66-249-66-1.googlebot.com'
```

## Compared with other approaches

| Approach | What it gives | Where botpassport differs |
| --- | --- | --- |
| [ai.robots.txt](https://github.com/ai-robots-txt/ai.robots.txt) | a list of AI crawler user agents, for robots.txt and server rules | botpassport identifies crawlers by the addresses their operators publish, which a scanner cannot fake |
| CrowdSec `crowdsecurity/whitelist-good-actors` | reverse DNS whitelists for search engines | botpassport adds the AI operators, which publish address lists without reverse DNS |
| Allowing by user agent | one rule | any scanner can send `GPTBot` as its user agent |
| Copying the lists by hand | the same data, once | the lists change: OpenAI regenerated its 367 ChatGPT-User prefixes on 25 November 2026 |

## FAQ

**How do I allowlist GPTBot and ChatGPT-User?** `npx botpassport export nginx` writes the `allow` lines for every
published crawler, OpenAI's GPTBot, OAI-SearchBot and ChatGPT-User included. The `openai-*` entries of
`dist/botpassport.json` hold OpenAI's ranges alone.

**What are ClaudeBot's IP addresses?** Anthropic publishes one list for ClaudeBot, Claude-User and
Claude-SearchBot at https://claude.com/crawling/bots.json. `npx botpassport check <ip>` tells you if an address is
in it.

**How do I verify that a request really comes from Googlebot?** Google publishes its ranges and documents reverse
DNS. `npx botpassport check <ip> --dns` checks both.

**Does CrowdSec ban AI crawlers?** It can. Its HTTP scenarios judge behaviour and user agents, and an AI crawler
that requests many pages fast or many removed paths can trip one. `crowdsec-sync` puts every published crawler
address in an allowlist that CrowdSec honours before it bans.

**Will this let scanners in?** Only addresses an operator vouches for are allowlisted. A scanner that sends a
crawler's user agent from its own address is not on any list.

**What happens when OpenAI or Anthropic add new addresses?** The daily refresh picks them up. Run
`crowdsec-sync` or download `dist/` daily.

**Can I block AI training crawlers and allow AI search?** Yes: `--purpose ai-search,ai-user,search` leaves out
`ai-training`. Blocking also belongs in robots.txt, which the operators document as their opt out.

**Does it work behind Cloudflare?** Behind a proxy your server sees the proxy's address. Restore the visitor's
address first (Caddy `trusted_proxies`, nginx `real_ip_header CF-Connecting-IP`), then match it.

**Why is Meta's crawler missing?** Meta publishes user agents for `meta-externalagent` but no address list.

**Which Node.js version does it need?** Node.js 22 or later. It has no runtime dependency.

## Adding a crawler

Add an entry to [`src/sources.js`](src/sources.js) with the operator's documentation page and the URL of the list
it publishes. A list in the `{"prefixes": [{"ipv4Prefix": ...}, {"ipv6Prefix": ...}]}` format needs nothing
else. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

MIT. Built by [La Boétie](https://laboetie.io/open-source).
