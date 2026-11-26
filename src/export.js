import { parseCidr } from './parse.js';

/** Every prefix of the given sources once, IPv4 first, each family sorted. Pure. */
export function allPrefixes(sources) {
  const unique = [...new Set(sources.flatMap((source) => source.prefixes))];
  const byFamily = (family) => unique.filter((cidr) => parseCidr(cidr).family === family).sort();
  return [...byFamily(4), ...byFamily(6)];
}

const header = (sources) =>
  `botpassport: ${sources.length} sources, https://github.com/ilanoh/botpassport. Generated, do not edit.`;

const FORMATS = {
  txt: (sources) => `${allPrefixes(sources).join('\n')}\n`,
  json: (sources) => `${JSON.stringify({ sources }, null, 2)}\n`,
  nginx: (sources) => `# ${header(sources)}\n${allPrefixes(sources).map((cidr) => `allow ${cidr};`).join('\n')}\n`,
  caddy: (sources) =>
    `# ${header(sources)}\n# Use: import botpassport.caddy, then the matcher @botpassport.\n` +
    `(botpassport) {\n\t@botpassport remote_ip ${allPrefixes(sources).join(' ')}\n}\n`,
  nftables: (sources) => {
    const set = (family, type) => {
      const cidrs = allPrefixes(sources).filter((cidr) => parseCidr(cidr).family === family);
      const elements = cidrs.length ? `\telements = {\n\t\t${cidrs.join(',\n\t\t')}\n\t}\n` : '';
      return `set botpassport_v${family} {\n\ttype ${type}\n\tflags interval\n\tauto-merge\n${elements}}\n`;
    };
    return `# ${header(sources)}\n${set(4, 'ipv4_addr')}${set(6, 'ipv6_addr')}`;
  },
};

export const FORMAT_NAMES = Object.keys(FORMATS);

/** The sources written in one of FORMAT_NAMES. Pure. */
export function exportAs(format, sources) {
  const render = FORMATS[format];
  if (!render) {
    throw new Error(`unknown format ${format}, expected one of ${FORMAT_NAMES.join(', ')}`);
  }
  return render(sources);
}
