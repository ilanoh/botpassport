import { promises as dns } from 'node:dns';
import { BlockList, isIP } from 'node:net';
import { parseCidr } from './parse.js';

const familyName = (family) => (family === 4 ? 'ipv4' : 'ipv6');

function blockListOf(prefixes) {
  const list = new BlockList();
  for (const { address, bits, family } of prefixes.map(parseCidr)) {
    list.addSubnet(address, bits, familyName(family));
  }
  return list;
}

/** A matcher over a snapshot: `sourcesOf(ip)` gives the sources whose published lists hold the address. */
export function buildMatcher(sources) {
  const lists = sources.map((source) => ({ source, list: blockListOf(source.prefixes) }));
  return {
    sourcesOf(ip) {
      const family = isIP(ip);
      if (!family) {
        throw new Error(`${ip} is not an IP address`);
      }
      return lists.filter(({ list }) => list.check(ip, familyName(family))).map(({ source }) => source);
    },
  };
}

/**
 * Forward confirmed reverse DNS, the check Google, Microsoft, Apple and Common Crawl document: the address
 * resolves to a hostname under one of the operator's suffixes, and that hostname resolves back to the address.
 * Resolves to the hostname, or null.
 */
export async function verifyReverseDns(ip, suffixes, resolver = dns) {
  const hostnames = await resolver.reverse(ip).catch(() => []);
  for (const hostname of hostnames) {
    if (!suffixes.some((suffix) => hostname.endsWith(suffix))) {
      continue;
    }
    const addresses = await resolver.lookup(hostname, { all: true }).catch(() => []);
    if (addresses.some(({ address }) => address === ip)) {
      return hostname;
    }
  }
  return null;
}
