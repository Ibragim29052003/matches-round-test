// В шаблоне OWNER/REPO не заменены: используем данные исходного задания.
// Переменная окружения позволяет проверить ошибки и пустой ответ на тестовом API.
export const MATCHES_URL =
  process.env.EXPO_PUBLIC_MATCHES_URL ??
  'https://raw.githubusercontent.com/Interlabs22/test-app/main/data/matches.json';
