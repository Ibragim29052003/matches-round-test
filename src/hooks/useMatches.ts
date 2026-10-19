import { useCallback, useEffect, useRef, useState } from 'react';
import { MATCHES_URL } from '../config';
import { parseMatches, type MatchesResponse } from '../domain/matches';

type State = {
  data: MatchesResponse | null;
  loading: boolean;
  error: string | null;
  updatedAt: Date | null;
};

export function useMatches() {
  const [state, setState] = useState<State>({
    data: null, loading: true, error: null, updatedAt: null,
  });
  const activeRequest = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setState((current) => ({ ...current, loading: true, error: null }));

    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);

    try {
      const response = await fetch(MATCHES_URL, {
        signal: controller.signal,
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Сервер недоступен (HTTP ${response.status}).`);
      const payload: unknown = await response.json();
      const data = parseMatches(payload);
      // Старый ответ не должен перезаписать новый; после unmount тоже не обновляем.
      if (activeRequest.current !== controller || controller.signal.aborted) return;
      setState({ data, loading: false, error: null, updatedAt: new Date() });
    } catch (error) {
      if (activeRequest.current !== controller) return;
      if (controller.signal.aborted && !timedOut) return;
      const message = timedOut
        ? 'Сервер не ответил за 15 секунд.'
        : error instanceof SyntaxError
          ? 'Сервер вернул некорректный JSON.'
          : error instanceof Error && error.message.startsWith('Сервер')
            ? error.message
            : 'Не удалось загрузить матчи. Проверьте подключение к интернету.';
      // При неудачном обновлении оставляем прошлые данные и время успеха.
      setState((current) => ({ ...current, loading: false, error: message }));
    } finally {
      clearTimeout(timeout);
      if (activeRequest.current === controller) activeRequest.current = null;
    }
  }, []);

  useEffect(() => {
    void refresh();
    return () => {
      activeRequest.current?.abort();
      activeRequest.current = null;
    };
  }, [refresh]);

  return { ...state, refresh };
}
