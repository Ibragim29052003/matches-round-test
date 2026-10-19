import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { filterMatches, formatStartTime, getStatusLabel, parseMatches } from '../src/domain/matches.ts';

const fixture = JSON.parse(readFileSync(new URL('../data/matches.json', import.meta.url), 'utf8'));
const { matches } = parseMatches(fixture);
const ids = (items) => items.map((item) => item.id);

test('all includes every match in API order, including live and postponed', () => {
  assert.deepEqual(ids(filterMatches(matches, 'all')), ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8']);
});

test('upcoming includes postponed without a date and excludes live/finished', () => {
  assert.deepEqual(ids(filterMatches(matches, 'upcoming')), ['m5', 'm6', 'm7', 'm8']);
});

test('finished depends on the server status, not on the start date', () => {
  assert.deepEqual(ids(filterMatches(matches, 'finished')), ['m1', 'm2', 'm3']);
});

test('unknown future status remains visible only in all and has a Russian fallback', () => {
  const match = { ...matches[0], status: 'cancelled' };
  assert.equal(filterMatches([match], 'all').length, 1);
  assert.equal(filterMatches([match], 'upcoming').length, 0);
  assert.equal(filterMatches([match], 'finished').length, 0);
  assert.equal(getStatusLabel(match), 'Статус неизвестен');
});

test('every filter supports an empty response', () => {
  for (const filter of ['all', 'upcoming', 'finished']) {
    assert.deepEqual(filterMatches([], filter), []);
  }
  assert.deepEqual(parseMatches({ round: 12, matches: [] }).matches, []);
});

test('a 0:0 score is preserved; missing score and postponed date stay null', () => {
  assert.deepEqual(matches[1].score, { home: 0, away: 0 });
  assert.equal(matches[6].score, null);
  assert.equal(matches[6].startsAt, null);
});

test('all known statuses have Russian labels, including live minute zero', () => {
  assert.equal(getStatusLabel(matches[0]), 'Завершён');
  assert.equal(getStatusLabel(matches[4]), 'Предстоит');
  assert.equal(getStatusLabel(matches[6]), 'Перенесён');
  assert.equal(getStatusLabel(matches[3]), 'Идёт · 67′');
  assert.equal(getStatusLabel({ ...matches[3], minute: 0 }), 'Идёт · 0′');
  assert.equal(getStatusLabel({ ...matches[3], minute: undefined }), 'Идёт');
});

test('null and invalid dates never become 1970 or Invalid Date', () => {
  assert.equal(formatStartTime(null), 'Дата уточняется');
  assert.equal(formatStartTime('not-a-date'), 'Дата уточняется');
});

for (const [zone, day, time] of [
  ['Europe/Moscow', '12', '02:30'],
  ['America/New_York', '11', '19:30'],
]) {
  test(`dates use device timezone and handle day rollover in ${zone}`, () => {
    const moduleUrl = new URL('../src/domain/matches.ts', import.meta.url).href;
    const result = spawnSync(process.execPath, [
      '--experimental-strip-types', '--input-type=module', '-e',
      `import { formatStartTime } from ${JSON.stringify(moduleUrl)};
       console.log(formatStartTime('2026-10-11T23:30:00Z'));`,
    ], { env: { ...process.env, TZ: zone }, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, new RegExp(`^${day} октября`));
    assert.ok(result.stdout.includes(time), result.stdout);
  });
}

for (const payload of [null, {}, { round: 12, matches: {} }, { round: '12', matches: [] },
  { round: 12, matches: [{ ...matches[0], score: { home: '0', away: 1 } }] },
  { round: 12, matches: [{ ...matches[0], home: null }] },
  { round: 12, matches: [{ ...matches[0], id: '' }] },
]) {
  test(`invalid API response is rejected: ${JSON.stringify(payload)}`, () => {
    assert.throws(() => parseMatches(payload), /некорректные данные/);
  });
}

test('duplicate IDs cannot merge cards or favorites', () => {
  assert.throws(() => parseMatches({ round: 12, matches: [matches[0], matches[0]] }), /повторяющимися/);
});

test('filtering does not mutate the server data', () => {
  const before = structuredClone(matches);
  filterMatches(matches, 'finished');
  filterMatches(matches, 'upcoming');
  assert.deepEqual(matches, before);
});
