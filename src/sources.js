/**
 * The crawlers botpassport knows, each with the address list its operator publishes. Every entry points at the
 * operator's own documentation and list: botpassport never guesses an address and never trusts a user agent.
 *
 * purpose:
 *   search       indexes pages for a search engine
 *   ai-search    indexes pages for an AI answer engine
 *   ai-user      fetches a page because a person asked an assistant about it
 *   ai-training  collects pages to train models
 *   ads          checks the landing pages of ads
 * format:
 *   prefixes     JSON {"prefixes": [{"ipv4Prefix": "a.b.c.d/n"}, {"ipv6Prefix": "x::/n"}]}, the de facto standard
 *   html         an HTML page listing the addresses in its text
 * reverseDns: hostname suffixes the operator documents for forward confirmed reverse DNS, when it does.
 *
 * Left out on purpose: Google's user-triggered-fetchers.json covers Google Cloud hosts that any Google Cloud
 * customer can run code on, and Meta publishes no address list for meta-externalagent.
 */

const ANTHROPIC_DOCS = 'https://support.claude.com/en/articles/'
  + '8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler';

export const SOURCES = [
  {
    id: 'openai-gptbot',
    operator: 'OpenAI',
    userAgents: ['GPTBot'],
    purpose: 'ai-training',
    docs: 'https://developers.openai.com/api/docs/bots',
    url: 'https://openai.com/gptbot.json',
    format: 'prefixes',
  },
  {
    id: 'openai-searchbot',
    operator: 'OpenAI',
    userAgents: ['OAI-SearchBot'],
    purpose: 'ai-search',
    docs: 'https://developers.openai.com/api/docs/bots',
    url: 'https://openai.com/searchbot.json',
    format: 'prefixes',
  },
  {
    id: 'openai-chatgpt-user',
    operator: 'OpenAI',
    userAgents: ['ChatGPT-User'],
    purpose: 'ai-user',
    docs: 'https://developers.openai.com/api/docs/bots',
    url: 'https://openai.com/chatgpt-user.json',
    format: 'prefixes',
  },
  {
    id: 'openai-adsbot',
    operator: 'OpenAI',
    userAgents: ['OAI-AdsBot'],
    purpose: 'ads',
    docs: 'https://developers.openai.com/api/docs/bots',
    url: 'https://openai.com/adsbot.json',
    format: 'prefixes',
  },
  {
    id: 'anthropic',
    operator: 'Anthropic',
    userAgents: ['ClaudeBot', 'Claude-User', 'Claude-SearchBot'],
    purpose: 'ai-search',
    docs: ANTHROPIC_DOCS,
    url: 'https://claude.com/crawling/bots.json',
    format: 'prefixes',
  },
  {
    id: 'perplexity-bot',
    operator: 'Perplexity',
    userAgents: ['PerplexityBot'],
    purpose: 'ai-search',
    docs: 'https://docs.perplexity.ai/docs/resources/perplexity-crawlers',
    url: 'https://www.perplexity.ai/perplexitybot.json',
    format: 'prefixes',
  },
  {
    id: 'perplexity-user',
    operator: 'Perplexity',
    userAgents: ['Perplexity-User'],
    purpose: 'ai-user',
    docs: 'https://docs.perplexity.ai/docs/resources/perplexity-crawlers',
    url: 'https://www.perplexity.ai/perplexity-user.json',
    format: 'prefixes',
  },
  {
    id: 'google-common',
    operator: 'Google',
    userAgents: ['Googlebot', 'Googlebot-Image', 'Googlebot-Video', 'Googlebot-News', 'GoogleOther', 'Storebot-Google'],
    purpose: 'search',
    docs: 'https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests',
    url: 'https://developers.google.com/static/crawling/ipranges/common-crawlers.json',
    format: 'prefixes',
    reverseDns: ['.googlebot.com', '.google.com'],
  },
  {
    id: 'google-special',
    operator: 'Google',
    userAgents: ['AdsBot-Google', 'Mediapartners-Google'],
    purpose: 'ads',
    docs: 'https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests',
    url: 'https://developers.google.com/static/crawling/ipranges/special-crawlers.json',
    format: 'prefixes',
    reverseDns: ['.google.com'],
  },
  {
    id: 'google-user-triggered',
    operator: 'Google',
    userAgents: ['Google user-triggered fetchers'],
    purpose: 'ai-user',
    docs: 'https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests',
    url: 'https://developers.google.com/static/crawling/ipranges/user-triggered-fetchers-google.json',
    format: 'prefixes',
    reverseDns: ['.google.com'],
  },
  {
    id: 'google-user-triggered-agents',
    operator: 'Google',
    userAgents: ['Google user-triggered agents'],
    purpose: 'ai-user',
    docs: 'https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests',
    url: 'https://developers.google.com/static/crawling/ipranges/user-triggered-agents.json',
    format: 'prefixes',
  },
  {
    id: 'bing',
    operator: 'Microsoft',
    userAgents: ['bingbot'],
    purpose: 'search',
    docs: 'https://www.bing.com/webmasters/help/verify-bingbot-2195837f',
    url: 'https://www.bing.com/toolbox/bingbot.json',
    format: 'prefixes',
    reverseDns: ['.search.msn.com'],
  },
  {
    id: 'apple',
    operator: 'Apple',
    userAgents: ['Applebot'],
    purpose: 'search',
    docs: 'https://support.apple.com/en-us/119829',
    url: 'https://search.developer.apple.com/applebot.json',
    format: 'prefixes',
    reverseDns: ['.applebot.apple.com'],
  },
  {
    id: 'mistral-user',
    operator: 'Mistral AI',
    userAgents: ['MistralAI-User'],
    purpose: 'ai-user',
    docs: 'https://docs.mistral.ai/robots',
    url: 'https://mistral.ai/mistralai-user-ips.json',
    format: 'prefixes',
  },
  {
    id: 'mistral-index',
    operator: 'Mistral AI',
    userAgents: ['MistralAI-Index'],
    purpose: 'ai-search',
    docs: 'https://docs.mistral.ai/robots',
    url: 'https://mistral.ai/mistralai-index-ips.json',
    format: 'prefixes',
  },
  {
    id: 'duckduckgo-assist',
    operator: 'DuckDuckGo',
    userAgents: ['DuckAssistBot'],
    purpose: 'ai-search',
    docs: 'https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot',
    url: 'https://duckduckgo.com/duckassistbot.json',
    format: 'prefixes',
  },
  {
    id: 'amazon-bot',
    operator: 'Amazon',
    userAgents: ['Amazonbot'],
    purpose: 'ai-training',
    docs: 'https://developer.amazon.com/docs/amazonbot/amazonbot',
    url: 'https://developer.amazon.com/amazonbot/ip-addresses/',
    format: 'html',
  },
  {
    id: 'amazon-searchbot',
    operator: 'Amazon',
    userAgents: ['Amzn-SearchBot'],
    purpose: 'ai-search',
    docs: 'https://developer.amazon.com/docs/amazonbot/amazonbot',
    url: 'https://developer.amazon.com/amazonbot/searchbot-ip-addresses/',
    format: 'html',
  },
  {
    id: 'amazon-user',
    operator: 'Amazon',
    userAgents: ['Amzn-User'],
    purpose: 'ai-user',
    docs: 'https://developer.amazon.com/docs/amazonbot/amazonbot',
    url: 'https://developer.amazon.com/amazonbot/live-ip-addresses/',
    format: 'html',
  },
  {
    id: 'commoncrawl',
    operator: 'Common Crawl',
    userAgents: ['CCBot'],
    purpose: 'ai-training',
    docs: 'https://commoncrawl.org/ccbot',
    url: 'https://index.commoncrawl.org/ccbot.json',
    format: 'prefixes',
    reverseDns: ['.crawl.commoncrawl.org'],
  },
];

export const PURPOSES = ['search', 'ai-search', 'ai-user', 'ai-training', 'ads'];
