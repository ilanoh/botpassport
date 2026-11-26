#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { syncAllowlist } from './crowdsec.js';
import { exportAs, FORMAT_NAMES } from './export.js';
import { buildMatcher, verifyReverseDns } from './match.js';
import { buildSnapshot, selectSources } from './snapshot.js';
import { PURPOSES } from './sources.js';

const USAGE = `botpassport: the crawler addresses their operators publish.

  botpassport update [--out botpassport.json]          fetch every official list into one snapshot
  botpassport export <${FORMAT_NAMES.join('|')}> [--out file]  write the prefixes for a server or firewall
  botpassport check <ip> [--dns]                       which published crawler an address belongs to
  botpassport crowdsec-sync [--name botpassport] [--dry-run]   keep a CrowdSec allowlist equal to the lists

  --snapshot file   read a snapshot from \`update\` instead of fetching the lists
  --purpose list    only these purposes, comma separated: ${PURPOSES.join(', ')}`;

const OPTIONS = {
  out: { type: 'string' },
  snapshot: { type: 'string' },
  purpose: { type: 'string' },
  name: { type: 'string', default: 'botpassport' },
  'dry-run': { type: 'boolean', default: false },
  dns: { type: 'boolean', default: false },
  help: { type: 'boolean', short: 'h', default: false },
};

function purposesOf(text) {
  const purposes = text ? text.split(',').map((p) => p.trim()).filter(Boolean) : [];
  const unknown = purposes.filter((p) => !PURPOSES.includes(p));
  if (unknown.length) {
    throw new Error(`unknown purpose ${unknown.join(', ')}, expected ${PURPOSES.join(', ')}`);
  }
  return purposes;
}

async function loadSnapshot(file) {
  const snapshot = file ? JSON.parse(await readFile(file, 'utf8')) : await buildSnapshot();
  for (const failure of snapshot.failures ?? []) {
    console.error(`botpassport: skipped ${failure.reason}`);
  }
  return snapshot;
}

async function output(text, file) {
  if (file) {
    await writeFile(file, text);
  } else {
    process.stdout.write(text);
  }
}

async function update({ out }) {
  const snapshot = await buildSnapshot();
  snapshot.failures.forEach((failure) => console.error(`botpassport: failed ${failure.reason}`));
  if (snapshot.sources.length === 0) {
    throw new Error('no list could be fetched');
  }
  await output(`${JSON.stringify(snapshot, null, 2)}\n`, out ?? 'botpassport.json');
  const count = snapshot.sources.reduce((sum, source) => sum + source.prefixes.length, 0);
  console.error(`botpassport: ${snapshot.sources.length} sources, ${count} prefixes`);
}

async function check(ip, values) {
  const sources = selectSources(await loadSnapshot(values.snapshot), purposesOf(values.purpose));
  const listed = buildMatcher(sources).sourcesOf(ip);
  for (const source of listed) {
    console.log(`${ip} is in the list of ${source.operator} (${source.userAgents.join(', ')}), ${source.url}`);
  }
  const confirmed = values.dns ? await checkDns(ip, sources) : [];
  if (listed.length === 0 && confirmed.length === 0) {
    console.log(`${ip} is in no published crawler list`);
    process.exitCode = 1;
  }
}

async function checkDns(ip, sources) {
  const confirmed = [];
  for (const source of sources.filter((s) => s.reverseDns.length)) {
    const hostname = await verifyReverseDns(ip, source.reverseDns);
    if (hostname) {
      console.log(`${ip} is ${hostname}, confirmed by reverse DNS for ${source.operator}`);
      confirmed.push(source);
    }
  }
  return confirmed;
}

const COMMANDS = {
  update: (args, values) => update(values),
  export: async ([format], values) => {
    const sources = selectSources(await loadSnapshot(values.snapshot), purposesOf(values.purpose));
    await output(exportAs(format, sources), values.out);
  },
  check: ([ip], values) => check(ip, values),
  'crowdsec-sync': async (args, values) => {
    const sources = selectSources(await loadSnapshot(values.snapshot), purposesOf(values.purpose));
    const result = await syncAllowlist({ name: values.name, sources, dryRun: values['dry-run'] });
    console.log(`${result.name}: ${result.added} added, ${result.removed} removed${result.dryRun ? ' (dry run)' : ''}`);
  },
};

async function main() {
  const { values, positionals } = parseArgs({ options: OPTIONS, allowPositionals: true });
  const [command, ...args] = positionals;
  if (values.help || !COMMANDS[command]) {
    console.log(USAGE);
    process.exitCode = values.help ? 0 : 2;
    return;
  }
  await COMMANDS[command](args, values);
}

// A reader that stops early, such as `| head`, closes the pipe: that ends the output, it is not a failure.
process.stdout.on('error', (error) => {
  if (error.code !== 'EPIPE') {
    throw error;
  }
  process.exit(0);
});

main().catch((error) => {
  console.error(`botpassport: ${error.message}`);
  process.exitCode = 1;
});
