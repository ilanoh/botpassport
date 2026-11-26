import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

/**
 * Keeps a CrowdSec allowlist (cscli allowlists, CrowdSec 1.6.8 and later) equal to the published lists, so
 * CrowdSec never bans a crawler address its operator announced. Each item carries `botpassport:<source id>` as
 * its description. A source that failed to fetch keeps its items: only the items of a source fetched this run
 * can be removed, and items another tool added, without that description, are never touched.
 */

const MARK = 'botpassport:';
const CHUNK = 200;

/** What to add and remove so the allowlist matches the sources. Pure. */
export function planSync(currentItems, sources) {
  const desired = new Map();
  for (const source of sources) {
    for (const cidr of source.prefixes) {
      if (!desired.has(cidr)) {
        desired.set(cidr, source.id);
      }
    }
  }
  const fetched = new Set(sources.map((source) => source.id));
  const current = new Set(currentItems.map((item) => item.value));
  const add = [...desired].filter(([cidr]) => !current.has(cidr)).map(([cidr, id]) => ({ value: cidr, id }));
  const remove = currentItems
    .filter((item) => item.description?.startsWith(MARK) && fetched.has(item.description.slice(MARK.length)))
    .filter((item) => !desired.has(item.value))
    .map((item) => item.value);
  return { add, remove };
}

const chunks = (values) => Array.from({ length: Math.ceil(values.length / CHUNK) }, (_, i) =>
  values.slice(i * CHUNK, (i + 1) * CHUNK));

function cscliRunner(cscli = 'cscli') {
  const run = promisify(execFile);
  return async (args) => (await run(cscli, args, { maxBuffer: 64 * 2 ** 20 })).stdout;
}

async function currentItems(run, name, dryRun) {
  const lists = JSON.parse(await run(['allowlists', 'list', '-o', 'json']));
  if (!lists.some((list) => list.name === name)) {
    if (!dryRun) {
      await run(['allowlists', 'create', name, '-d', 'Crawler addresses their operators publish (botpassport)']);
    }
    return [];
  }
  return JSON.parse(await run(['allowlists', 'inspect', name, '-o', 'json'])).items ?? [];
}

async function addItems(run, name, items) {
  const bySource = Map.groupBy(items, (item) => item.id);
  for (const [id, sourceItems] of bySource) {
    for (const values of chunks(sourceItems.map((item) => item.value))) {
      await run(['allowlists', 'add', name, ...values, '-d', `${MARK}${id}`]);
    }
  }
}

/** Applies the plan to the allowlist `name`, creating it when missing. Resolves to the counts it changed. */
export async function syncAllowlist({ name = 'botpassport', sources, run = cscliRunner(), dryRun = false }) {
  const plan = planSync(await currentItems(run, name, dryRun), sources);
  if (!dryRun) {
    await addItems(run, name, plan.add);
    for (const values of chunks(plan.remove)) {
      await run(['allowlists', 'remove', name, ...values]);
    }
  }
  return { name, added: plan.add.length, removed: plan.remove.length, dryRun };
}
