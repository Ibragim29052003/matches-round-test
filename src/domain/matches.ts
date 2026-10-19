export type Team = { id: string; name: string; city: string };

export type Match = {
  id: string;
  startsAt: string | null;
  // Открытый набор: новый статус сервера не должен скрывать матч.
  status: string;
  minute?: number;
  home: Team;
  away: Team;
  score: { home: number; away: number } | null;
};

export type MatchesResponse = { round: number; matches: Match[] };
export type MatchFilter = 'all' | 'upcoming' | 'finished';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isTeam(value: unknown): value is Team {
  return isObject(value) && isText(value.id) && isText(value.name) && isText(value.city);
}

function isMatch(value: unknown): value is Match {
  if (!isObject(value)) return false;
  return (
    isText(value.id) &&
    (value.startsAt === null || typeof value.startsAt === 'string') &&
    isText(value.status) &&
    (value.minute === undefined || isNonNegativeInteger(value.minute)) &&
    isTeam(value.home) &&
    isTeam(value.away) &&
    (value.score === null ||
      (isObject(value.score) &&
        isNonNegativeInteger(value.score.home) &&
        isNonNegativeInteger(value.score.away)))
  );
}

export function parseMatches(value: unknown): MatchesResponse {
  if (
    !isObject(value) ||
    !isNonNegativeInteger(value.round) ||
    !Array.isArray(value.matches) ||
    !value.matches.every(isMatch)
  ) {
    throw new Error('Сервер вернул некорректные данные матчей.');
  }
  const ids = new Set(value.matches.map((match) => match.id));
  if (ids.size !== value.matches.length) {
    throw new Error('Сервер вернул матчи с повторяющимися идентификаторами.');
  }
  return { round: value.round, matches: value.matches };
}

export function filterMatches(matches: Match[], filter: MatchFilter): Match[] {
  return matches.filter((match) => {
    if (filter === 'finished') return match.status === 'finished';
    if (filter === 'upcoming') {
      return match.status === 'scheduled' || match.status === 'postponed';
    }
    return true;
  });
}

export function getStatusLabel(match: Match): string {
  switch (match.status) {
    case 'scheduled': return 'Предстоит';
    case 'finished': return 'Завершён';
    case 'postponed': return 'Перенесён';
    case 'live': return match.minute === undefined ? 'Идёт' : `Идёт · ${match.minute}′`;
    default: return 'Статус неизвестен';
  }
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
});

export function formatStartTime(startsAt: string | null): string {
  if (startsAt === null) return 'Дата уточняется';
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return 'Дата уточняется';
  // Без timeZone Intl использует часовой пояс устройства.
  return dateFormatter.format(date);
}
