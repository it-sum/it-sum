'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ResourceProgressState {
  percent: number;
  lastPage: number | null;
  lastSecond: number | null;
  completed: boolean;
  updatedAt: string;
}

interface ProgressStore {
  resources: Record<string, ResourceProgressState>;
  update: (resourceId: string, patch: Partial<ResourceProgressState>) => void;
  get: (resourceId: string) => ResourceProgressState | undefined;
}

export const useProgressStore = create<ProgressStore>()(persist((set, get) => ({
  resources: {},
  update: (resourceId, patch) => set((state) => ({
    resources: {
      ...state.resources,
      [resourceId]: {
        percent: state.resources[resourceId]?.percent ?? 0,
        lastPage: state.resources[resourceId]?.lastPage ?? null,
        lastSecond: state.resources[resourceId]?.lastSecond ?? null,
        completed: state.resources[resourceId]?.completed ?? false,
        updatedAt: new Date().toISOString(),
        ...patch,
      },
    },
  })),
  get: (resourceId) => get().resources[resourceId],
}), { name: 'it-sum-progress-v1' }));
