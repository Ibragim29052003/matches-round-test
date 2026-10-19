import { StyleSheet, Text, View } from 'react-native';
import { formatStartTime, getStatusLabel, type Match } from '../domain/matches';
import { FavoriteButton } from './FavoriteButton';

type Props = { match: Match; favorite: boolean; onToggleFavorite: () => void };

export function MatchCard({ match, favorite, onToggleFavorite }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={[styles.status, match.status === 'live' && styles.live]}>
          {getStatusLabel(match)}
        </Text>
        <FavoriteButton
          active={favorite}
          onPress={onToggleFavorite}
          matchLabel={`${match.home.name} — ${match.away.name}`}
        />
      </View>
      <View style={styles.teams}>
        <View style={styles.team}>
          <Text style={styles.name}>{match.home.name}</Text>
          <Text style={styles.city}>{match.home.city} · хозяева</Text>
        </View>
        <Text style={styles.score} accessibilityLabel={match.score
          ? `Счёт ${match.score.home}:${match.score.away}` : 'Счёта пока нет'}>
          {match.score ? `${match.score.home} : ${match.score.away}` : '—'}
        </Text>
        <View style={[styles.team, styles.away]}>
          <Text style={[styles.name, styles.alignRight]}>{match.away.name}</Text>
          <Text style={[styles.city, styles.alignRight]}>{match.away.city} · гости</Text>
        </View>
      </View>
      <Text style={styles.date}>{formatStartTime(match.startsAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  status: { fontSize: 13, fontWeight: '600', color: '#475569' },
  live: { color: '#b91c1c' },
  teams: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  team: { flex: 1, minWidth: 0 },
  away: { alignItems: 'flex-end' },
  alignRight: { textAlign: 'right' },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  city: { fontSize: 12, color: '#64748b', marginTop: 5 },
  score: { fontSize: 22, fontWeight: '700', color: '#0f172a', fontVariant: ['tabular-nums'] },
  date: { fontSize: 13, color: '#475569', marginTop: 16 },
});
