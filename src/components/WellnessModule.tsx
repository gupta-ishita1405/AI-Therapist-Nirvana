import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Wind, Play, Pause, RotateCcw, 
  Volume2, VolumeX, Save, Sparkles, 
  ShieldCheck, Activity, Trash2, Circle, Eye, Palette
} from "lucide-react";

interface WellnessModuleProps {
  token: string;
  onActivityLogged: (id: string, points: number) => void;
}

interface Stone {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

export default function WellnessModule({ token, onActivityLogged }: WellnessModuleProps) {
  const [activeGame, setActiveGame] = useState<"breathing" | "zen_garden" | "ocean" | "bubble_pop" | "color_harmony">("breathing");
  const [selectedStoneType, setSelectedStoneType] = useState<string>("basalt");

  // ============ AUDIO CONTEXT ============
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthOscRef = useRef<OscillatorNode | null>(null);
  const synthGainRef = useRef<GainNode | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  const initAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      } catch (e) {
        console.warn("AudioContext not supported");
      }
    }
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume().catch(e => console.warn("Could not resume audio", e));
    }
  }, []);

  const stopSynthesizer = useCallback(() => {
    if (synthGainRef.current && audioCtxRef.current) {
      try {
        synthGainRef.current.gain.exponentialRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 0.3);
        setTimeout(() => {
          if (synthOscRef.current) {
            try {
              synthOscRef.current.stop();
              synthOscRef.current.disconnect();
            } catch (e) {
              console.warn("Oscillator already stopped");
            }
            synthOscRef.current = null;
          }
        }, 400);
      } catch (e) {
        console.warn("Error stopping synthesizer", e);
      }
    }
  }, []);

  const playSynthesizer = useCallback((frequency: number, type: OscillatorType = "sine", volume = 0.05) => {
    try {
      if (!soundOn) return;
      initAudioCtx();
      if (!audioCtxRef.current) return;

      stopSynthesizer();

      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, audioCtxRef.current.currentTime);
      gain.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
      gain.gain.linearRampToValueAtTime(volume, audioCtxRef.current.currentTime + 0.1);
      
      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);
      osc.start();
      
      synthOscRef.current = osc;
      synthGainRef.current = gain;
    } catch (e) {
      console.warn("Audio playback blocked or failed");
    }
  }, [soundOn, initAudioCtx, stopSynthesizer]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopSynthesizer();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(e => console.warn("Could not close AudioContext", e));
      }
    };
  }, [stopSynthesizer]);

  // ============ BREATHING GAME ============
  const breathingProtocols = useMemo(() => ({
    box: {
      name: "Box Protocol",
      cycles: [
        { action: "Inhale", duration: 4, size: 1.6, freq: 396 },
        { action: "Hold", duration: 4, size: 1.6, freq: 220 },
        { action: "Exhale", duration: 4, size: 1.0, freq: 285 },
        { action: "Hold", duration: 4, size: 1.0, freq: 110 }
      ],
      prompt: "Tactical composure balancing (4s cycles)",
      actId: "act_box_breath"
    },
    deep: {
      name: "Deep Abdominal",
      cycles: [
        { action: "Inhale", duration: 5, size: 1.8, freq: 369 },
        { action: "Exhale", duration: 5, size: 1.0, freq: 147 }
      ],
      prompt: "Restorative core respiratory waves",
      actId: "act_deep_breath"
    }
  }), []);

  const [breathMode, setBreathMode] = useState<"box" | "deep">("box");
  const [breathActive, setBreathActive] = useState(false);
  const [breathPhaseIdx, setBreathPhaseIdx] = useState(0);
  const [breathSecondsLeft, setBreathSecondsLeft] = useState(4);
  
  const currentProtocol = breathingProtocols[breathMode];
  const currentPhase = currentProtocol.cycles[breathPhaseIdx];

  // Trigger sound on phase change
  useEffect(() => {
    if (breathActive) {
      playSynthesizer(currentPhase.freq);
    }
  }, [breathActive, breathPhaseIdx, currentPhase.freq, playSynthesizer]);

  // Breathing timer with proper closure
  useEffect(() => {
    if (!breathActive) {
      setBreathSecondsLeft(currentPhase.duration);
      return;
    }

    const timer = setInterval(() => {
      setBreathSecondsLeft(prev => {
        if (prev <= 1) {
          setBreathPhaseIdx(prevIdx => {
            const nextIdx = (prevIdx + 1) % currentProtocol.cycles.length;
            // Log activity only on cycle completion
            if (nextIdx === 0) {
              onActivityLogged(currentProtocol.actId, 25);
            }
            return nextIdx;
          });
          return currentProtocol.cycles[0].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [breathActive, currentProtocol, onActivityLogged]);

  const handleResetBreath = useCallback(() => {
    setBreathActive(false);
    setBreathPhaseIdx(0);
    setBreathSecondsLeft(currentProtocol.cycles[0].duration);
    stopSynthesizer();
  }, [currentProtocol, stopSynthesizer]);

  // ============ ZEN GARDEN GAME ============
  const stoneTemplates = useMemo(() => [
    { id: "basalt", name: "Basalt", emoji: "🪨" },
    { id: "jade", name: "Jade", emoji: "💎" },
    { id: "lotus", name: "Lotus", emoji: "🪷" }
  ], []);

  const [placedStones, setPlacedStones] = useState<Stone[]>([]);
  const sandCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  // Draw ripples on canvas
  useEffect(() => {
    if (activeGame !== "zen_garden" || !sandCanvasRef.current) return;

    const ctx = sandCanvasRef.current.getContext("2d");
    if (!ctx) return;

    const canvas = sandCanvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    
    // Set actual resolution
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    
    // Clear and redraw
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    ctx.strokeStyle = "rgba(147, 197, 114, 0.15)";

    placedStones.forEach(s => {
      for (let r = 20; r < 80; r += 20) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }, [placedStones, activeGame]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = sandCanvasRef.current?.getBoundingClientRect();
    if (!rect || !sandCanvasRef.current) return;

    const dpr = window.devicePixelRatio || 1;
    const x = (e.clientX - rect.left) / dpr;
    const y = (e.clientY - rect.top) / dpr;

    const selectedStone = stoneTemplates.find(s => s.id === selectedStoneType);
    if (selectedStone) {
      setPlacedStones(prev => [...prev, {
        id: Date.now(),
        x,
        y,
        emoji: selectedStone.emoji
      }]);
      playSynthesizer(400);
    }
  }, [selectedStoneType, stoneTemplates, playSynthesizer]);

  const handleRakeSand = useCallback(() => {
    setPlacedStones([]);
    playSynthesizer(200);
  }, [playSynthesizer]);

  const handleCaptureStillness = useCallback(async () => {
    try {
      onActivityLogged("zen", 100);
      // Optionally save to localStorage
      localStorage.setItem("nirvana_zen_capture", JSON.stringify({
        stones: placedStones,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error("Failed to capture stillness", error);
    }
  }, [placedStones, onActivityLogged]);

  // ============ OCEAN GAME ============
  const [oceanTimer, setOceanTimer] = useState(0);
  const oceanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeGame !== "ocean") {
      if (oceanIntervalRef.current) clearInterval(oceanIntervalRef.current);
      setOceanTimer(0);
      return;
    }

    oceanIntervalRef.current = setInterval(() => {
      setOceanTimer(prev => {
        if (prev >= 300) {
          // 5 minutes reached
          onActivityLogged("ocean", 50);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      if (oceanIntervalRef.current) clearInterval(oceanIntervalRef.current);
    };
  }, [activeGame, onActivityLogged]);

  const oceanMinutes = Math.floor(oceanTimer / 60);
  const oceanSeconds = oceanTimer % 60;

  // ============ BUBBLE POP GAME ============
  interface Bubble {
    id: number;
    x: number;
    y: number;
    size: number;
  }
  
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [bubbleScore, setBubbleScore] = useState(0);
  const bubbleContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeGame !== "bubble_pop") return;
    
    const interval = setInterval(() => {
      const id = Date.now() + Math.random();

      setBubbles(prev => [...prev, {
        id,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        size: Math.random() * 30 + 20
      }]);

      // Auto-remove bubble after 3 seconds if not clicked
      setTimeout(() => {
        setBubbles(prev => prev.filter(b => b.id !== id));
      }, 3000);
    }, 800);

    return () => clearInterval(interval);
  }, [activeGame]);

  const popBubble = useCallback((id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    setBubbleScore(prev => prev + 1);
    playSynthesizer(500);
  }, [playSynthesizer]);

  const resetBubbles = useCallback(() => {
    setBubbles([]);
    setBubbleScore(0);
    playSynthesizer(300);
  }, [playSynthesizer]);

  // ============ COLOR HARMONY GAME ============
  const colors = ["#93C572", "#FF6B6B", "#4ECDC4", "#FFE66D", "#A78BFA", "#FB7185"];
  const [colorScore, setColorScore] = useState(0);
  const [colorGrid, setColorGrid] = useState<string[]>([]);

  useEffect(() => {
    if (activeGame === "color_harmony" && colorGrid.length === 0) {
      setColorGrid(Array.from({ length: 12 }, () => colors[Math.floor(Math.random() * colors.length)]));
    }
  }, [activeGame, colorGrid.length, colors]);

  const clickColor = useCallback((index: number) => {
    setColorGrid(prev => {
      const newGrid = [...prev];
      newGrid[index] = colors[Math.floor(Math.random() * colors.length)];
      return newGrid;
    });
    setColorScore(prev => prev + 1);
    playSynthesizer(440);
  }, [colors, playSynthesizer]);

  const resetColors = useCallback(() => {
    setColorGrid(Array.from({ length: 12 }, () => colors[Math.floor(Math.random() * colors.length)]));
    setColorScore(0);
    playSynthesizer(330);
  }, [colors, playSynthesizer]);

  // ============ PATTERN MATCH GAME ============
  const [patternSequence, setPatternSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [patternLevel, setPatternLevel] = useState(1);
  const [patternWait, setPatternWait] = useState(false);
  const patternLights = [
    "bg-red-400", "bg-blue-400", "bg-yellow-400", "bg-green-400"
  ];

  const startPattern = useCallback(() => {
    const newSequence = [...patternSequence, Math.floor(Math.random() * 4)];
    setPatternSequence(newSequence);
    setUserSequence([]);
    playPatternSequence(newSequence);
  }, [patternSequence]);

  const playPatternSequence = useCallback(async (sequence: number[]) => {
    setPatternWait(true);
    for (let i = 0; i < sequence.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      playSynthesizer(300 + sequence[i] * 100);
    }
    setPatternWait(false);
  }, [playSynthesizer]);

  const clickPatternLight = useCallback((index: number) => {
    if (patternWait) return;
    
    playSynthesizer(300 + index * 100);
    const newUserSeq = [...userSequence, index];
    setUserSequence(newUserSeq);

    if (patternSequence[newUserSeq.length - 1] !== index) {
      playSynthesizer(100);
      setTimeout(() => startPattern(), 500);
      return;
    }

    if (newUserSeq.length === patternSequence.length) {
      setPatternLevel(prev => prev + 1);
      onActivityLogged("pattern_match", 10);
      setTimeout(() => startPattern(), 800);
    }
  }, [userSequence, patternSequence, patternWait, playSynthesizer, startPattern, onActivityLogged]);

  const resetPattern = useCallback(() => {
    setPatternSequence([]);
    setUserSequence([]);
    setPatternLevel(1);
    playSynthesizer(330);
  }, [playSynthesizer]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#93C572] mb-2 block">Tactile Therapy</span>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Wellness Simulations</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-[1.25rem]">
          {[
            { id: "breathing", label: "Breathing", icon: Wind },
            { id: "zen_garden", label: "Zen Garden", icon: Sparkles },
            { id: "ocean", label: "Ocean", icon: Activity },
            { id: "bubble_pop", label: "Bubbles", icon: Circle },
            { id: "color_harmony", label: "Colors", icon: Palette }
          ].map((game) => (
            <button
              key={game.id}
              onClick={() => {
                setActiveGame(game.id as any);
                stopSynthesizer();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeGame === game.id ? "bg-white text-[#93C572] shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <game.icon className="w-3.5 h-3.5" />
              {game.label}
            </button>
          ))}
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <button
            onClick={() => setSoundOn(!soundOn)}
            className={`p-2 rounded-xl transition-colors ${soundOn ? 'text-[#93C572]' : 'text-slate-400'}`}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Simulation Stage */}
      <div className="bg-white rounded-4xl border border-slate-100 shadow-sm p-8 min-h-125 flex flex-col relative overflow-hidden">
        
        {/* BREATHING */}
        {activeGame === "breathing" && (
          <div className="grid lg:grid-cols-2 gap-12 items-center flex-1">
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-[#93C572] uppercase tracking-widest">Respiratory Calibration</div>
                <h3 className="text-2xl font-semibold text-slate-800">{currentProtocol.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{currentProtocol.prompt}</p>
              </div>

              <div className="space-y-3">
                {Object.entries(breathingProtocols).map(([key, proto]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setBreathMode(key as any);
                      handleResetBreath();
                    }}
                    className={`flex items-center justify-between w-full p-4 rounded-2xl border transition-all ${
                      breathMode === key ? 'border-[#93C572] bg-[#93C572]/5 text-[#7AA55C]' : 'border-slate-50 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-sm font-bold">{proto.name}</span>
                    <div className={`w-2 h-2 rounded-full ${breathMode === key ? 'bg-[#93C572] animate-pulse' : 'bg-slate-200'}`} />
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setBreathActive(!breathActive)}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  {breathActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  {breathActive ? "Pause Protocol" : "Initialize Cycle"}
                </button>
                <button 
                  onClick={handleResetBreath}
                  className="p-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 hover:bg-slate-100"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center relative">
              <motion.div 
                animate={{ scale: breathActive ? currentPhase.size : 1 }}
                transition={{ duration: currentPhase.duration, ease: "easeInOut" }}
                className="w-64 h-64 rounded-full bg-[#93C572]/10 border border-[#93C572]/20 flex items-center justify-center relative shadow-2xl shadow-[#93C572]/10"
              >
                <div className="w-40 h-40 rounded-full bg-white shadow-inner flex flex-col items-center justify-center text-center border border-slate-50">
                  <span className="text-[10px] font-bold text-[#93C572] uppercase tracking-widest mb-1">{breathActive ? currentPhase.action : "Standby"}</span>
                  <span className="text-3xl font-bold text-slate-800 tracking-tighter">{breathActive ? breathSecondsLeft : "00"}</span>
                </div>
              </motion.div>
              <div className="mt-12 text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Sync physiology to visual expansion</div>
            </div>
          </div>
        )}

        {/* ZEN GARDEN */}
        {activeGame === "zen_garden" && (
          <div className="flex-1 flex flex-col space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[10px] font-bold text-[#93C572] uppercase tracking-widest">Neural Landscape</div>
                <h3 className="text-2xl font-semibold text-slate-800">Zen Sand Canvas</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleRakeSand}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Rake Sand
                </button>
                <button 
                  onClick={handleCaptureStillness}
                  className="px-6 py-2 bg-[#93C572] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#93C572]/20 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Capture
                </button>
              </div>
            </div>

            <div className="p-2 bg-slate-50 rounded-2xl flex gap-2 w-fit border border-slate-100">
              {stoneTemplates.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedStoneType(s.id);
                    playSynthesizer(300);
                  }}
                  className={`p-3 rounded-xl border transition-all text-xl ${
                    selectedStoneType === s.id
                      ? 'bg-[#93C572]/10 border-[#93C572]'
                      : 'bg-white border-slate-100 hover:border-[#93C572]'
                  }`}
                  title={s.name}
                >
                  {s.emoji}
                </button>
              ))}
            </div>

            <div 
              ref={canvasContainerRef}
              className="flex-1 bg-[#FDFDFB] rounded-4xl border-8 border-white relative shadow-inner cursor-crosshair overflow-hidden"
            >
              <canvas 
                ref={sandCanvasRef}
                className="absolute inset-0 w-full h-full cursor-crosshair"
                onClick={handleCanvasClick}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                <Sparkles className="w-64 h-64" />
              </div>
              {placedStones.map(s => (
                <div
                  key={s.id}
                  className="absolute text-3xl select-none pointer-events-none"
                  style={{
                    left: `${(s.x / (sandCanvasRef.current?.offsetWidth || 1)) * 100}%`,
                    top: `${(s.y / (sandCanvasRef.current?.offsetHeight || 1)) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {s.emoji}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OCEAN TIDE */}
        {activeGame === "ocean" && (
          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-12">
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-[#93C572] uppercase tracking-widest">Neural Oscillation</div>
              <h3 className="text-3xl font-semibold text-slate-800 italic font-serif">Oceanic Resonance</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium">Coordinate your heart rate with the barometric ebb and flow.</p>
            </div>

            <div className="w-full max-w-3xl h-64 bg-slate-900 rounded-3xl relative overflow-hidden flex items-center justify-center shadow-2xl">
              <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 800 200" preserveAspectRatio="none">
                <motion.path 
                  animate={{ d: ["M0 100 Q 200 50 400 100 T 800 100 L 800 200 L 0 200 Z", "M0 100 Q 200 150 400 100 T 800 100 L 800 200 L 0 200 Z"] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  fill="#93C572"
                />
              </svg>
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center animate-pulse backdrop-blur-md">
                  <Wind className="w-8 h-8 text-[#93C572]" />
                </div>
                <div className="text-[10px] font-bold text-white uppercase tracking-[0.4em]">Inhale Stability</div>
              </div>
            </div>

            <div className="flex gap-12">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-800 tracking-tighter">{String(oceanMinutes).padStart(2, '0')}:{String(oceanSeconds).padStart(2, '0')}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Focus Duration</div>
              </div>
              <div className="text-center border-l border-slate-100 pl-12">
                <div className="text-2xl font-bold text-[#93C572] tracking-tighter">+{Math.floor(oceanTimer / 6)}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Resilience XP</div>
              </div>
            </div>

            <button
              onClick={() => {
                if (oceanTimer > 0) {
                  onActivityLogged("ocean", Math.floor(oceanTimer / 6));
                }
                setOceanTimer(0);
              }}
              className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-[#93C572] hover:text-white transition-all"
            >
              End Ocean Focus
            </button>
          </div>
        )}

        {/* BUBBLE POP */}
        {activeGame === "bubble_pop" && (
  <div className="flex-1 flex flex-col space-y-6">

    <div className="flex justify-between items-end">
      <div>
        <div className="text-[10px] font-bold text-[#93C572] uppercase tracking-widest">
          Release Tension
        </div>
        <h3 className="text-2xl font-semibold text-slate-800">
          Bubble Pop
        </h3>
      </div>

      <div className="text-right">
        <div className="text-3xl font-bold text-[#93C572]">
          {bubbleScore}
        </div>
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          Bubbles Popped
        </div>
      </div>
    </div>

    <div
      className="
        relative
        h-[500px]
        overflow-hidden
        rounded-4xl
        border-8
        border-blue-100
        bg-gradient-to-br
        from-sky-50
        via-blue-50
        to-cyan-100
        shadow-inner
      "
    >
      {bubbles.map((bubble) => (
        <motion.button
          key={bubble.id}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.85 }}
          onClick={() => popBubble(bubble.id)}
          className="absolute rounded-full cursor-pointer"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.x}%`,
            top: `${bubble.y}%`,
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(96,165,250,0.6))",
            border: "3px solid rgba(59,130,246,0.5)",
            boxShadow: "0 0 20px rgba(59,130,246,0.25)"
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: "18%",
              height: "18%",
              top: "20%",
              left: "25%",
              background: "rgba(255,255,255,0.9)"
            }}
          />
        </motion.button>
      ))}

      <div className="absolute top-4 left-4 bg-white/90 px-3 py-2 rounded-xl shadow text-sm font-semibold">
        Active Bubbles: {bubbles.length}
      </div>
    </div>

    <button
      onClick={resetBubbles}
      className="
        w-full
        py-3
        bg-[#93C572]
        text-white
        rounded-2xl
        font-bold
        text-sm
        hover:bg-[#7AA55C]
        transition-all
      "
    >
      Reset Game
    </button>

  </div>
)}

        {/* COLOR HARMONY */}
        {activeGame === "color_harmony" && (
          <div className="flex-1 flex flex-col space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[10px] font-bold text-[#93C572] uppercase tracking-widest">Chromatic Flow</div>
                <h3 className="text-2xl font-semibold text-slate-800">Color Harmony</h3>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#93C572]">{colorScore}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Clicks</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 flex-1">
              {colorGrid.map((color, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => clickColor(index)}
                  className="rounded-2xl shadow-lg hover:shadow-xl transition-all border-4 border-white"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <button 
              onClick={resetColors}
              className="w-full py-3 bg-[#93C572] text-white rounded-2xl font-bold text-sm hover:bg-[#7AA55C] transition-all"
            >
              Reset Colors
            </button>
          </div>
        )}

        </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between p-6 bg-[#93C572]/5 rounded-4xl border border-[#93C572]/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm text-[#93C572]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-medium text-[#7AA55C] leading-relaxed">
            Tactile games trigger <strong>alpha-wave</strong> brain states, reducing immediate cortisol levels by up to 20% during active focus.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <Activity className="w-3.5 h-3.5" /> Simulation Active
        </div>
      </div>
    </div>
  )
}
