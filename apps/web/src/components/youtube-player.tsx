'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, PlayCircle } from 'lucide-react';
import { Card, ProgressBar } from '@it-sum/ui';
import { useProgressStore } from '../lib/stores/progress-store';

declare global {
  interface Window {
    YT?: {
      Player: new (element: HTMLElement, options: { videoId: string; playerVars?: Record<string, number>; events?: { onReady?: (event: { target: YouTubeTarget }) => void; onStateChange?: (event: { data: number }) => void } }) => YouTubeTarget;
      PlayerState: { PLAYING: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubeTarget {
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  destroy: () => void;
}

interface YouTubePlayerProps {
  resourceId: string;
  videoId: string;
  title: string;
}

export function YouTubePlayer({ resourceId, videoId, title }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubeTarget | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const updateProgress = useProgressStore((state) => state.update);
  const saved = useProgressStore((state) => state.resources[resourceId]);
  const [duration, setDuration] = useState(0);
  const [seconds, setSeconds] = useState(saved?.lastSecond ?? 0);
  const [ready, setReady] = useState(false);
  const initialSecondRef = useRef(saved?.lastSecond ?? 0);

  useEffect(() => {
    let disposed = false;
    const createPlayer = () => {
      if (disposed || !containerRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: ({ target }) => {
            setReady(true);
            const total = target.getDuration();
            setDuration(total);
            const resumeAt = initialSecondRef.current;
            if (resumeAt > 3 && resumeAt < total - 3) target.seekTo(resumeAt, true);
          },
          onStateChange: ({ data }) => {
            if (window.YT && data === window.YT.PlayerState.PLAYING) {
              if (timerRef.current) clearInterval(timerRef.current);
              timerRef.current = setInterval(() => {
                const player = playerRef.current;
                if (!player) return;
                const current = player.getCurrentTime();
                const total = player.getDuration();
                setSeconds(current);
                updateProgress(resourceId, { lastSecond: current, percent: total ? Math.round((current / total) * 100) : 0, completed: total > 0 && current >= total - 5 });
              }, 5000);
            } else if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
          },
        },
      });
    };

    if (window.YT?.Player) createPlayer();
    else {
      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(script);
      }
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        createPlayer();
      };
    }

    return () => {
      disposed = true;
      if (timerRef.current) clearInterval(timerRef.current);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId, resourceId, updateProgress]);

  const percent = duration ? (seconds / duration) * 100 : 0;
  return <Card className="overflow-hidden"><div ref={containerRef} className="aspect-video w-full bg-surface-container" aria-label={title} />{!ready && <div className="flex items-center gap-2 px-4 py-3 text-sm text-on-surface-variant"><PlayCircle className="size-4" />Loading YouTube player…</div>}<div className="space-y-2 border-t border-outline-variant px-4 py-3"><div className="flex items-center justify-between text-sm"><span className="font-medium text-on-surface">{title}</span>{percent >= 95 && <span className="inline-flex items-center gap-1 text-primary"><CheckCircle2 className="size-4" />Completed</span>}</div><ProgressBar value={percent} label={`${title} progress`} /><p className="text-xs text-on-surface-variant">Your position is saved automatically every five seconds.</p></div></Card>;
}
