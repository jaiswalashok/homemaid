"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Loader2,
  ChefHat,
  Mic,
  MicOff,
} from "lucide-react";
import { useLanguage, LANGUAGE_CODES } from "@/lib/language-context";
import { Recipe } from "@/lib/recipes";

interface FollowAlongModeProps {
  recipe: Recipe;
  open: boolean;
  onClose: () => void;
}

export default function FollowAlongMode({
  recipe,
  open,
  onClose,
}: FollowAlongModeProps) {
  const { language, t, langCode } = useLanguage();
  const [script, setScript] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [listening, setListening] = useState(false);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (open) {
      loadScript();
    }
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [open, recipe, language]);

  const loadScript = async () => {
    setLoading(true);
    const content = language === "Hindi" && recipe.hi ? recipe.hi : recipe.en;
    try {
      const res = await fetch("/api/gemini/follow-along", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe: content, language }),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to load script");
      }
      
      const data = await res.json();
      setScript(data.script);
      setCurrentStep(0);
    } catch (err) {
      console.error("Failed to load script:", err);
      // Fallback: build script from recipe steps
      const fallback = [
        `Let's cook ${content.title}!`,
        `You'll need: ${content.ingredients.map((i) => `${i.quantity} ${i.unit} ${i.item}`).join(", ")}`,
        ...content.steps.map(
          (s) => `Step ${s.stepNumber}: ${s.instruction}`
        ),
        `Your ${content.title} is ready! Enjoy!`,
      ];
      setScript(fallback);
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  const speak = useCallback(
    (text: string) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      utterance.rate = 0.9;
      utterance.pitch = 1;

      // Try to find a voice for the language
      const voices = window.speechSynthesis.getVoices();
      const langPrefix = langCode.split("-")[0];
      const voice = voices.find(
        (v) => v.lang.startsWith(langPrefix)
      );
      if (voice) utterance.voice = voice;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => {
        setSpeaking(false);
        setPaused(false);
      };
      utterance.onpause = () => setPaused(true);
      utterance.onresume = () => setPaused(false);

      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [langCode]
  );

  const speakCurrent = useCallback(() => {
    if (script[currentStep]) {
      speak(script[currentStep]);
    }
  }, [script, currentStep, speak]);

  const handleNext = () => {
    window.speechSynthesis.cancel();
    if (currentStep < script.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      setTimeout(() => speak(script[next]), 200);
    }
  };

  const handlePrev = () => {
    window.speechSynthesis.cancel();
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      setTimeout(() => speak(script[prev]), 200);
    }
  };

  const handlePlayPause = () => {
    if (speaking && !paused) {
      window.speechSynthesis.pause();
    } else if (paused) {
      window.speechSynthesis.resume();
    } else {
      speakCurrent();
    }
  };

  const toggleVoiceControl = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = langCode;
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      const command = last[0].transcript.toLowerCase().trim();

      if (
        command.includes("next") ||
        command.includes("अगला")
      ) {
        handleNext();
      } else if (
        command.includes("back") ||
        command.includes("previous") ||
        command.includes("पिछला")
      ) {
        handlePrev();
      } else if (
        command.includes("repeat") ||
        command.includes("again") ||
        command.includes("दोबारा")
      ) {
        speakCurrent();
      } else if (
        command.includes("stop") ||
        command.includes("pause") ||
        command.includes("रुक")
      ) {
        window.speechSynthesis.cancel();
      }
    };

    recognition.onend = () => {
      if (listening) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-orange-900 via-red-900 to-amber-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-orange-300" />
          <div>
            <h2 className="text-xl font-bold text-white">{language === "Hindi" && recipe.hi ? recipe.hi.title : recipe.en.title}</h2>
            <p className="text-orange-200 text-sm">{t("followAlong")}</p>
          </div>
        </div>
        <button
          onClick={() => {
            window.speechSynthesis.cancel();
            if (recognitionRef.current) recognitionRef.current.stop();
            onClose();
          }}
          className="text-white/60 hover:text-white transition-colors p-2"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-orange-300 animate-spin" />
            <p className="text-orange-200 text-lg">{t("processing")}</p>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="w-full max-w-2xl mb-8">
              <div className="flex items-center justify-between text-orange-200 text-sm mb-2">
                <span>
                  {currentStep + 1} / {script.length}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-orange-400 to-yellow-400 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${((currentStep + 1) / script.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Current instruction */}
            <div className="w-full max-w-2xl bg-white/10 backdrop-blur-sm rounded-3xl p-8 mb-8 min-h-[200px] flex items-center justify-center">
              <p className="text-white text-xl md:text-2xl leading-relaxed text-center font-medium">
                {script[currentStep]}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-all"
              >
                <SkipBack className="w-6 h-6" />
              </button>

              <button
                onClick={handlePlayPause}
                className="p-5 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:from-orange-600 hover:to-yellow-600 shadow-2xl shadow-orange-500/40 transition-all"
              >
                {speaking && !paused ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8" />
                )}
              </button>

              <button
                onClick={handleNext}
                disabled={currentStep === script.length - 1}
                className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-all"
              >
                <SkipForward className="w-6 h-6" />
              </button>

              <button
                onClick={() => speakCurrent()}
                className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                title="Repeat"
              >
                <Volume2 className="w-6 h-6" />
              </button>

              <button
                onClick={toggleVoiceControl}
                className={`p-3 rounded-full transition-all ${
                  listening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
                title="Voice control"
              >
                {listening ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </button>
            </div>

            {listening && (
              <p className="text-orange-200 text-sm mt-4 animate-pulse">
                🎤 Voice control active — say &quot;next&quot;, &quot;back&quot;,
                &quot;repeat&quot;, or &quot;stop&quot;
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
