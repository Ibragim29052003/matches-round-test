import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  active: boolean;
  onPress: () => void;
  matchLabel: string;
};

// Звёздочка «в избранное».
export function FavoriteButton({ active, onPress, matchLabel }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={`${active ? 'Убрать из избранного' : 'Добавить в избранное'}: ${matchLabel}`}
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.star, active && styles.active]}>{active ? '★' : '☆'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  star: {
    fontSize: 22,
    color: '#9ca3af',
  },
  active: {
    color: '#ef3124',
  },
});
