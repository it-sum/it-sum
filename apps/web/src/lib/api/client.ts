import axios from 'axios';
import type { AnswerInput, AttemptResult, AutosaveAnswersRequest, LibraryQuery, LibraryResponse, ProgressUpdateResponse, StartAttemptResponse, StreamTicket, SubmitAttemptRequest } from '@it-sum/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';
const SESSION_KEY = 'it_sum_session';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const session = window.localStorage.getItem(SESSION_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session) as { accessToken?: string };
        if (parsed.accessToken) config.headers.Authorization = `Bearer ${parsed.accessToken}`;
      } catch {
        window.localStorage.removeItem(SESSION_KEY);
      }
    }
  }
  config.headers['X-Correlation-Id'] = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  return config;
});

export function isLiveApi() {
  return process.env.NEXT_PUBLIC_API_MODE === 'live';
}

export async function browseLibrary(query: LibraryQuery): Promise<LibraryResponse> {
  const { data } = await apiClient.get<LibraryResponse>('/library', { params: query });
  return data;
}

export async function issueStreamTicket(resourceId: string): Promise<StreamTicket> {
  const { data } = await apiClient.get<StreamTicket>(`/library/resources/${resourceId}/stream-ticket`);
  return data;
}

export function streamUrl(ticket: StreamTicket) {
  return ticket.url.startsWith('http') ? ticket.url : `${API_BASE_URL.replace(/\/api\/v1$/, '')}${ticket.url}`;
}

export async function syncProgress(payload: { resourceId: string; percent: number; lastPage?: number | null; lastSecond?: number | null; elapsedSeconds?: number }) {
  const { data } = await apiClient.post<ProgressUpdateResponse>('/progress', { ...payload, idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}` });
  return data;
}

export async function startQuiz(quizId: string) {
  const { data } = await apiClient.get<StartAttemptResponse>(`/quizzes/${quizId}`);
  return data;
}

export async function autosaveQuiz(attemptId: string, payload: AutosaveAnswersRequest) {
  return apiClient.post(`/quizzes/attempts/${attemptId}/autosave`, payload);
}

export async function submitQuiz(attemptId: string, payload: SubmitAttemptRequest) {
  const { data } = await apiClient.post<AttemptResult>(`/quizzes/attempts/${attemptId}/submit`, payload);
  return data;
}

export type { AnswerInput };
