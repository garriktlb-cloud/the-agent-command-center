import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface Props {
  title?: string;
  mediaUrl?: string | null;
  mediaType: "audio" | "video";
  durationSeconds: number;
  onProgress?: (positionSeconds: number, completed: boolean) => void;
}

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export default function MediaPlayerCard({ title, mediaUrl, mediaType, durationSeconds, onProgress }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);

  const el = () => (mediaType === "video" ? videoRef.current : audioRef.current);

  useEffect(() => {
    setPlaying(false);
    setPosition(0);
  }, [mediaUrl, mediaType]);

  const toggle = () => {
    const m = el();
    if (!m) return;
    if (m.paused) {
      m.play();
      setPlaying(true);
    } else {
      m.pause();
      setPlaying(false);
    }
  };

  const onTimeUpdate = () => {
    const m = el();
    if (!m) return;
    setPosition(m.currentTime);
    onProgress?.(m.currentTime, m.ended);
  };

  const onLoaded = () => {
    const m = el();
    if (m && Number.isFinite(m.duration)) setDuration(m.duration);
  };

  const pct = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div className="rounded-2xl bg-foreground text-background p-6 space-y-5 shadow-lg">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wider text-background/60 font-mono">Now Playing</p>
        <h2 className="font-heading font-semibold text-xl">{title || "Select an episode"}</h2>
      </div>

      {mediaType === "video" && mediaUrl ? (
        <video
          ref={videoRef}
          src={mediaUrl}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoaded}
          onEnded={() => setPlaying(false)}
          className="w-full rounded-lg bg-black aspect-video"
          controls
        />
      ) : mediaType === "audio" && mediaUrl ? (
        <audio
          ref={audioRef}
          src={mediaUrl}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoaded}
          onEnded={() => setPlaying(false)}
          className="hidden"
        />
      ) : null}

      {mediaType === "audio" && (
        <>
          <div className="h-1.5 rounded-full bg-background/15 overflow-hidden">
            <div
              className="h-full bg-background transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono text-background/70">{fmt(position)}</span>
            <Button
              onClick={toggle}
              disabled={!mediaUrl}
              size="lg"
              className="rounded-full w-14 h-14 p-0 bg-background text-foreground hover:bg-background/90"
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>
            <span className="text-sm font-mono text-background/70">{fmt(duration)}</span>
          </div>
        </>
      )}
    </div>
  );
}
