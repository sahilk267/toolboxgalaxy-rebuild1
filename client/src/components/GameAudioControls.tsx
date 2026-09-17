// Orbital Workbench: shared, explicit game-audio controls; browser-local preference never bypasses autoplay policy.
import { OrbitAudio } from "@/game/audio";
import { Music2, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

export default function GameAudioControls({ audio, music = false }: { audio: React.MutableRefObject<OrbitAudio>; music?: boolean }) {
  const [soundOn, setSoundOn] = useState(() => audio.current.isEnabled());
  const [musicOn, setMusicOn] = useState(() => audio.current.isMusicEnabled());
  const toggleSound = async () => { const next = !soundOn; setSoundOn(next); setSoundOn(await audio.current.setEnabled(next)); };
  const toggleMusic = async () => { const next = !musicOn; setMusicOn(next); setSoundOn(true); setMusicOn(await audio.current.setMusicEnabled(next)); setSoundOn(audio.current.isEnabled()); };
  return <div className="game-audio-controls"><button type="button" onClick={toggleSound} className={`sound-toggle ${soundOn ? "sound-toggle--on" : ""}`} aria-pressed={soundOn} aria-label={soundOn ? "Turn game sound off for all Games Bay routes" : "Turn game sound on for all Games Bay routes"}>{soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />} SOUND {soundOn ? "ON" : "OFF"}</button>{music && <button type="button" onClick={toggleMusic} className={`sound-toggle sound-toggle--music ${musicOn ? "sound-toggle--on" : ""}`} aria-pressed={musicOn} aria-label={musicOn ? "Turn optional Logic Lab music off" : "Turn optional Logic Lab music on"}><Music2 size={15} /> MUSIC {musicOn ? "ON" : "OFF"}</button>}</div>;
}
