import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MatchCard } from '../components/MatchCard';
import { UpdatedAgo } from '../components/UpdatedAgo';
import { filterMatches, type MatchFilter } from '../domain/matches';
import { useFavorites } from '../hooks/useFavorites';
import { useMatches } from '../hooks/useMatches';

const filters: { value: MatchFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'upcoming', label: 'Предстоящие' },
  { value: 'finished', label: 'Завершённые' },
];

export function MatchesScreen() {
  const { data, loading, error, updatedAt, refresh } = useMatches();
  const { favorites, isFavorite, toggle } = useFavorites();
  const [filter, setFilter] = useState<MatchFilter>('all');
  const visibleMatches = filterMatches(data?.matches ?? [], filter);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text accessibilityRole="header" style={styles.title}>Матчи тура</Text>
          <Text style={styles.subtitle}>{data ? `Тур ${data.round} · ` : ''}Время устройства</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: loading }}
          disabled={loading}
          onPress={() => void refresh()}
          style={[styles.button, loading && styles.disabled]}
        >
          <Text style={styles.buttonText}>{loading && data ? 'Обновляем…' : 'Обновить'}</Text>
        </Pressable>
      </View>
      <View style={styles.filters}>
        {filters.map((item) => (
          <Pressable
            key={item.value}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === item.value }}
            onPress={() => setFilter(item.value)}
            style={[styles.filter, filter === item.value && styles.selectedFilter]}
          >
            <Text style={[styles.filterText, filter === item.value && styles.selectedText]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {updatedAt && <View style={styles.updated}><UpdatedAgo since={updatedAt} /></View>}
      {error && (
        <View accessibilityRole="alert" style={styles.error}>
          <Text style={styles.errorTitle}>{data ? 'Не удалось обновить матчи' : 'Не удалось загрузить матчи'}</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          {data && <Text style={styles.errorMessage}>Показаны последние загруженные данные.</Text>}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: loading }}
            disabled={loading}
            onPress={() => void refresh()}
            style={styles.retry}
          >
            <Text style={styles.retryText}>Повторить</Text>
          </Pressable>
        </View>
      )}
      {loading && !data ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color="#1d4ed8" accessibilityLabel="Загрузка матчей" />
          <Text style={styles.emptyText}>Загружаем матчи…</Text>
        </View>
      ) : data ? (
        <FlatList
          data={visibleMatches}
          keyExtractor={(match) => match.id}
          extraData={favorites}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Separator}
          renderItem={({ item }) => (
            <MatchCard match={item} favorite={isFavorite(item.id)} onToggleFavorite={() => toggle(item.id)} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{data.matches.length === 0 ? 'Матчей пока нет' : 'В этой категории матчей нет'}</Text>
              <Text style={styles.emptyText}>{data.matches.length === 0
                ? 'Обновите список чуть позже.' : 'Выберите другой фильтр или обновите список.'}</Text>
            </View>
          }
        />
      ) : null}
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { fontSize: 26, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 6 },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#1d4ed8' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  disabled: { opacity: 0.6 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 24, marginBottom: 16 },
  filter: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#e2e8f0' },
  selectedFilter: { backgroundColor: '#0f172a' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  selectedText: { color: '#fff' },
  updated: { marginBottom: 16 },
  list: { flexGrow: 1, paddingBottom: 24 },
  separator: { height: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', textAlign: 'center' },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  error: { backgroundColor: '#fff1f2', padding: 16, borderRadius: 12, marginBottom: 16, gap: 8 },
  errorTitle: { fontSize: 16, fontWeight: '600', color: '#9f1239' },
  errorMessage: { fontSize: 14, color: '#9f1239' },
  retry: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#9f1239' },
  retryText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
