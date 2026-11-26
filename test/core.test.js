import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildMatcher, exportAs, fetchSource, parseCidr, parseHtmlAddresses, parsePrefixesJson, planSync,
} from '../src/index.js';

const source = (id, prefixes) => ({
  id, operator: id, userAgents: [id], purpose: 'ai-search', reverseDns: [], prefixes,
});

test('a prefixes list is read, sorted and deduplicated, and a broken prefix fails the whole list', () => {
  const list = JSON.stringify({
    creationTime: '2026-11-25T00:00:00',
    prefixes: [{ ipv4Prefix: '20.0.0.0/24' }, { ipv6Prefix: '2600:1f28::/56' }, { ipv4Prefix: '20.0.0.0/24' }],
  });
  assert.deepEqual(parsePrefixesJson(list), {
    prefixes: ['20.0.0.0/24', '2600:1f28::/56'],
    creationTime: '2026-11-25T00:00:00',
  });
  assert.throws(() => parsePrefixesJson('{"prefixes":[{"ipv4Prefix":"20.0.0.0/33"}]}'), /not a valid CIDR/);
  assert.throws(() => parsePrefixesJson('{"items":[]}'), /no "prefixes" array/);
});

test('a CIDR is valid only with an address and whole bits in range', () => {
  assert.deepEqual(parseCidr('1.2.3.4'), { address: '1.2.3.4', bits: 32, family: 4 });
  assert.equal(parseCidr('1.2.3.4/'), null);
  assert.equal(parseCidr('1.2.3.4/8x'), null);
  assert.equal(parseCidr('300.2.3.4/8'), null);
  assert.equal(parseCidr('1.2.3.4/8/9'), null);
});

test('an HTML page gives the addresses written in it, and a page with none fails', () => {
  const page = '<td>52.70.240.171</td><td>3.224.220.0/24</td><span>v1.2.3.4.5</span>';
  assert.deepEqual(parseHtmlAddresses(page).prefixes, ['3.224.220.0/24', '52.70.240.171/32']);
  assert.throws(() => parseHtmlAddresses('<p>none</p>'), /no address/);
});

test('an address matches the sources whose prefixes hold it, IPv4 and IPv6', () => {
  const matcher = buildMatcher([source('a', ['20.0.0.0/24']), source('b', ['2600:1f28::/56', '20.0.0.7/32'])]);
  assert.deepEqual(matcher.sourcesOf('20.0.0.7').map((s) => s.id), ['a', 'b']);
  assert.deepEqual(matcher.sourcesOf('2600:1f28::1').map((s) => s.id), ['b']);
  assert.deepEqual(matcher.sourcesOf('20.0.1.1'), []);
  assert.throws(() => matcher.sourcesOf('nope'), /not an IP/);
});

test('a sync adds the missing prefixes, removes only stale items of fetched sources, and keeps foreign items', () => {
  const current = [
    { value: '1.1.1.0/24', description: 'botpassport:a' },
    { value: '9.9.9.0/24', description: 'botpassport:a' },
    { value: '8.8.8.0/24', description: 'botpassport:gone-this-run' },
    { value: '7.7.7.7/32', description: 'added by hand' },
  ];
  assert.deepEqual(planSync(current, [source('a', ['1.1.1.0/24', '2.2.2.0/24'])]), {
    add: [{ value: '2.2.2.0/24', id: 'a' }],
    remove: ['9.9.9.0/24'],
  });
});

test('nftables export writes both families and leaves out the elements of an empty one', () => {
  const text = exportAs('nftables', [source('a', ['20.0.0.0/24'])]);
  assert.match(text, /set botpassport_v4 \{[^}]*elements = \{\n\t\t20\.0\.0\.0\/24\n\t\}/);
  assert.match(text, /set botpassport_v6 \{\n\ttype ipv6_addr\n\tflags interval\n\tauto-merge\n\}/);
});

test('a failing list is fetched on its third attempt, and one that keeps failing names its source', async () => {
  const listSource = { id: 'x', url: 'https://example.test/x.json', format: 'prefixes' };
  let calls = 0;
  const flaky = async () => {
    calls += 1;
    if (calls < 3) {
      throw new Error('fetch failed');
    }
    return { ok: true, text: async () => '{"prefixes":[{"ipv4Prefix":"20.0.0.0/24"}]}' };
  };
  assert.deepEqual((await fetchSource(listSource, flaky, 0)).prefixes, ['20.0.0.0/24']);
  await assert.rejects(fetchSource(listSource, async () => ({ ok: false, status: 503 }), 0), /^Error: x: .* HTTP 503/);
});
