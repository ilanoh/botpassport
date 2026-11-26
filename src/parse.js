import { isIP } from 'node:net';

/** A CIDR prefix as `{ address, bits, family }`, or null when the text is not a valid one. Pure. */
export function parseCidr(text) {
  const [address, bitsText, extra] = String(text).trim().split('/');
  const family = isIP(address);
  if (!family || extra !== undefined) {
    return null;
  }
  const maxBits = family === 4 ? 32 : 128;
  const bits = bitsText === undefined ? maxBits : Number(bitsText);
  if (!Number.isInteger(bits) || bits < 0 || bits > maxBits || (bitsText !== undefined && !/^\d+$/.test(bitsText))) {
    return null;
  }
  return { address, bits, family };
}

const formatCidr = ({ address, bits }) => `${address}/${bits}`;

function unique(cidrs) {
  return [...new Set(cidrs.map(formatCidr))].sort();
}

/** The prefixes of a `{"prefixes": [{"ipv4Prefix"}, {"ipv6Prefix"}]}` list, sorted and unique. Pure. */
export function parsePrefixesJson(text) {
  const body = JSON.parse(text);
  if (!Array.isArray(body?.prefixes)) {
    throw new Error('the list has no "prefixes" array');
  }
  const cidrs = body.prefixes.map((entry) => entry.ipv4Prefix ?? entry.ipv6Prefix).map(parseCidr);
  if (cidrs.some((cidr) => cidr === null)) {
    throw new Error('the list holds a prefix that is not a valid CIDR');
  }
  return { prefixes: unique(cidrs), creationTime: body.creationTime ?? null };
}

const IPV4_IN_TEXT = /(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?(?![\d.])/g;

/** The IPv4 addresses and prefixes written in the text of an HTML page, sorted and unique. Pure. */
export function parseHtmlAddresses(text) {
  const cidrs = (String(text).match(IPV4_IN_TEXT) ?? []).map(parseCidr).filter(Boolean);
  if (cidrs.length === 0) {
    throw new Error('the page lists no address');
  }
  return { prefixes: unique(cidrs), creationTime: null };
}

export const PARSERS = { prefixes: parsePrefixesJson, html: parseHtmlAddresses };
