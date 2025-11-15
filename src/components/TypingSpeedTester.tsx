import React, { useEffect, useRef, useState } from "react";
import {
  Trophy,
  Target,
  Zap,
  BookOpen,
  History,
  Timer,
  Crown,
  Flame,
  ChevronRight,
  X,
  Star,
  Sparkles,
  Activity,
  Calendar,
  RotateCcw
} from "lucide-react";

/* -------------------- Global declaration for window.storage -------------------- */
/* Adjust if your real storage API differs */
declare global {
  interface Window {
    storage: {
      get: (key: string) => Promise<{ value: string | null } | null>;
      set: (key: string, value: string) => Promise<void>;
    };
  }
}

/* -------------------- Interfaces -------------------- */

interface PracticeMode {
  id: string;
  name: string;
  fullName: string;
  duration: number;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface Lesson {
  id: number;
  name: string;
  keys: string;
  text: string;
  icon: string;
  color: string;
}

interface TestResult {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  errors: number;
  mode: string;
  date: string;
  timestamp: number;
}

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
}

interface TypingSpeedTesterProps {
  user: { email?: string } | null;
  onLogout: () => void;
}

/* -------------------- Data -------------------- */

const quotesDatabase: string[] = [
  "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "Innovation distinguishes between a leader and a follower.",
  "Your time is limited, so don't waste it living someone else's life.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "Believe you can and you're halfway there.",
  "It does not matter how slowly you go as long as you do not stop.",
  "Everything you've ever wanted is on the other side of fear.",
  "Perfection is not attainable, but if we chase perfection we can catch excellence.",
  "The only impossible journey is the one you never begin.",
  "In the middle of difficulty lies opportunity.",
  "The best time to plant a tree was twenty years ago. The second best time is now.",
  "Life is what happens when you're busy making other plans.",
  "The greatest glory in living lies not in never falling, but in rising every time we fall.",
  "The way to get started is to quit talking and begin doing.",
  "Don't watch the clock; do what it does. Keep going.",
  "The future depends on what you do today.",
  "It is during our darkest moments that we must focus to see the light.",
  "You must be the change you wish to see in the world.",
  "Do not go where the path may lead, go instead where there is no path and leave a trail."
];

const practiceModes: PracticeMode[] = [
  {
    id: "time15",
    name: "15s",
    fullName: "15 seconds",
    duration: 15,
    icon: Zap,
    color: "from-yellow-500 to-orange-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30"
  },
  {
    id: "time30",
    name: "30s",
    fullName: "30 seconds",
    duration: 30,
    icon: Timer,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30"
  },
  {
    id: "time60",
    name: "1m",
    fullName: "1 minute",
    duration: 60,
    icon: Target,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30"
  },
  {
    id: "time120",
    name: "2m",
    fullName: "2 minutes",
    duration: 120,
    icon: Crown,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30"
  }
];

const lessons: Lesson[] = [
  {
    id: 1,
    name: "Home Row",
    keys: "asdfjkl;",
    text: "aaa sss ddd fff jjj kkk lll ;;; asdf jkl; sad lad fad jak las",
    icon: "🏠",
    color: "from-blue-400 to-blue-600"
  },
  {
    id: 2,
    name: "Top Row",
    keys: "qwertyuiop",
    text: "qqq www eee rrr ttt yyy uuu iii ooo ppp qwer tyui op quit rope tire",
    icon: "⬆️",
    color: "from-green-400 to-green-600"
  },
  {
    id: 3,
    name: "Bottom Row",
    keys: "zxcvbnm",
    text: "zzz xxx ccc vvv bbb nnn mmm zxcv bnm zoo box can van ban man",
    icon: "⬇️",
    color: "from-purple-400 to-purple-600"
  },
  {
    id: 4,
    name: "Numbers",
    keys: "1234567890",
    text: "111 222 333 444 555 666 777 888 999 000 123 456 789 1234 5678",
    icon: "🔢",
    color: "from-orange-400 to-orange-600"
  },
  {
    id: 5,
    name: "Symbols",
    keys: "!@#$%^&*()",
    text: "!!! @@@ ### $$$ %%% ^^^ &&& *** ((( ))) !@# $%^ &*( hello! world@",
    icon: "✨",
    color: "from-pink-400 to-pink-600"
  },
  {
    id: 6,
    name: "All Keys",
    keys: "full",
    text: "The quick brown fox jumps over the lazy dog near the riverbank today.",
    icon: "🎯",
    color: "from-red-400 to-red-600"
  }
];

const achievements = [
  { name: "Speed Demon", requirement: "60+ WPM", icon: "⚡", achieved: false },
  { name: "Perfect Typist", requirement: "100% Accuracy", icon: "🎯", achieved: false },
  { name: "Marathon Runner", requirement: "Complete 2min test", icon: "🏃", achieved: false },
  { name: "Consistent", requirement: "3 day streak", icon: "🔥", achieved: false }
];

/* -------------------- Component -------------------- */

export default function TypingSpeedTester({
  user,
  onLogout
}: TypingSpeedTesterProps) {
  const [mode, setMode] = useState<string>("menu");
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const [currentText, setCurrentText] = useState<string>("");
  const [userInput, setUserInput] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const [errors, setErrors] = useState<number>(0);
  const [wpm, setWpm] = useState<number>(0);
  const [rawWpm, setRawWpm] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);

  const [isComplete, setIsComplete] = useState<boolean>(false);

  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [showStats, setShowStats] = useState<boolean>(false);

  const [capsLockOn, setCapsLockOn] = useState<boolean>(false);
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  const [particles, setParticles] = useState<Particle[]>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<number | null>(null);

  /* -------------------- Effects -------------------- */

  useEffect(() => {
    loadHistory();
    loadStreak();
    // focus hidden input so keydown works immediately
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  useEffect(() => {
    if (startTime && !isComplete && timeLeft !== null) {
      const id = window.setInterval(() => {
        setTimeLeft((prevTime) => {
          if (typeof prevTime === "number" && prevTime <= 1) {
            clearInterval(id);
            finishTest();
            return 0;
          }
          return (prevTime ?? 0) - 1;
        });
      }, 1000);
      timerRef.current = id;
      return () => clearInterval(id);
    }
    return;
  }, [startTime, timeLeft, isComplete]);

  /* -------------------- Storage helpers -------------------- */

  const loadHistory = async () => {
    try {
      const result = await window.storage.get("typing-history-v2");
      if (result && result.value) {
        setTestHistory(JSON.parse(result.value) as TestResult[]);
      }
    } catch (err) {
      // ignore
    }
  };

  const loadStreak = async () => {
    try {
      const result = await window.storage.get("typing-streak");
      if (result && result.value) {
        const data = JSON.parse(result.value);
        const lastDate = new Date(data.lastDate).toDateString();
        const today = new Date().toDateString();
        if (lastDate === today) {
          setStreak(data.streak);
        } else if (new Date(data.lastDate).getTime() + 86400000 >= Date.now()) {
          setStreak(data.streak);
        } else {
          setStreak(0);
        }
      }
    } catch (err) {
      // ignore
    }
  };

  const updateStreak = async () => {
    try {
      const result = await window.storage.get("typing-streak");
      let newStreak = 1;
      if (result && result.value) {
        const data = JSON.parse(result.value);
        const lastDate = new Date(data.lastDate).toDateString();
        const today = new Date().toDateString();
        if (lastDate !== today) {
          newStreak = data.streak + 1;
        } else {
          newStreak = data.streak;
        }
      }
      await window.storage.set(
        "typing-streak",
        JSON.stringify({ streak: newStreak, lastDate: new Date() })
      );
      setStreak(newStreak);
    } catch (err) {
      // ignore
    }
  };

  const saveResult = async (result: TestResult) => {
    const newHistory = [result, ...testHistory].slice(0, 50);
    setTestHistory(newHistory);
    try {
      await window.storage.set("typing-history-v2", JSON.stringify(newHistory));
      updateStreak();
    } catch (err) {
      // ignore
    }
  };

  /* -------------------- Test flow -------------------- */

  const startPractice = (practiceMode: PracticeMode) => {
    const randomQuote =
      quotesDatabase[Math.floor(Math.random() * quotesDatabase.length)];
    setCurrentText(randomQuote);
    setSelectedMode(practiceMode);
    setSelectedLesson(null);
    setTimeLeft(practiceMode.duration);
    resetTestState();
    setMode("test");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const startLesson = (lesson: Lesson) => {
    setCurrentText(lesson.text);
    setSelectedLesson(lesson);
    setSelectedMode(null);
    setTimeLeft(null);
    resetTestState();
    setMode("lesson");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const resetTestState = () => {
    setUserInput("");
    setCurrentIndex(0);
    setStartTime(null);
    setEndTime(null);
    setErrors(0);
    setWpm(0);
    setRawWpm(0);
    setAccuracy(100);
    setIsComplete(false);
  };

  /* -------------------- Key handling & stats -------------------- */

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    try {
      setCapsLockOn(e.getModifierState("CapsLock"));
    } catch {
      // some browsers may not support getModifierState on this event
    }

    if (e.key === "Escape") {
      backToMenu();
      return;
    }

    if (isComplete) return;

    if (!startTime && e.key.length === 1) {
      setStartTime(Date.now());
    }

    // guard currentText index presence
    const currentChar = currentText.charAt(currentIndex);

    if (e.key === currentChar && e.key.length === 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setUserInput((prev) => prev + e.key);

      if (newIndex === currentText.length) {
        finishTest(newIndex, errors);
        return;
      } else {
        calculateStats(newIndex, errors);
      }
    } else if (e.key.length === 1) {
      const newErrors = errors + 1;
      setErrors(newErrors);
      calculateStats(currentIndex, newErrors);
    }
  };

  const calculateStats = (idx: number, errs: number) => {
    if (!startTime) return;

    const timeElapsed = (Date.now() - startTime) / 1000 / 60;
    const wordsTyped = idx / 5;
    const rawWordsTyped = (idx + errs) / 5;

    const currentWpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
    const currentRawWpm =
      timeElapsed > 0 ? Math.round(rawWordsTyped / timeElapsed) : 0;
    const acc = idx + errs > 0 ? Math.round((idx / (idx + errs)) * 100) : 100;

    setWpm(currentWpm);
    setRawWpm(currentRawWpm);
    setAccuracy(acc);
  };

  const finishTest = (finalIndex?: number, finalErrors?: number) => {
    if (isComplete) return;

    setIsComplete(true);
    const end = Date.now();
    setEndTime(end);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const idx = finalIndex !== undefined ? finalIndex : currentIndex;
    const errs = finalErrors !== undefined ? finalErrors : errors;

    const timeElapsed = startTime ? (end - startTime) / 1000 / 60 : 0.00001;

    const finalWpm = timeElapsed > 0 ? Math.round((idx / 5) / timeElapsed) : 0;
    const finalRawWpm =
      timeElapsed > 0 ? Math.round(((idx + errs) / 5) / timeElapsed) : 0;
    const finalAcc = idx + errs > 0 ? Math.round((idx / (idx + errs)) * 100) : 100;

    setWpm(finalWpm);
    setRawWpm(finalRawWpm);
    setAccuracy(finalAcc);

    const result: TestResult = {
      wpm: finalWpm,
      rawWpm: finalRawWpm,
      accuracy: finalAcc,
      errors: errs,
      mode: selectedMode ? selectedMode.fullName : `Lesson: ${selectedLesson?.name ?? "Custom"}`,
      date: new Date().toLocaleString(),
      timestamp: end
    };

    saveResult(result);
    createConfetti();
  };

  const createConfetti = () => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1 + Math.random() * 2
      });
    }
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 3000);
  };

  const backToMenu = () => {
    setMode("menu");
    setSelectedMode(null);
    setSelectedLesson(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const restart = () => {
    if (selectedMode) {
      startPractice(selectedMode);
    } else if (selectedLesson) {
      startLesson(selectedLesson);
    }
  };

  /* -------------------- Helpers -------------------- */

  const getCharClass = (index: number) => {
    if (index < currentIndex) {
      return "text-green-400";
    } else if (index === currentIndex) {
      return "text-white bg-yellow-400/30 border-b-2 border-yellow-400";
    } else {
      return "text-gray-500";
    }
  };

  const getBestWpm = () => {
    if (testHistory.length === 0) return 0;
    return Math.max(...testHistory.map((t) => t.wpm));
  };

  const getAvgWpm = () => {
    if (testHistory.length === 0) return 0;
    const sum = testHistory.reduce((acc, t) => acc + t.wpm, 0);
    return Math.round(sum / testHistory.length);
  };

  const getAvgAccuracy = () => {
    if (testHistory.length === 0) return 100;
    const sum = testHistory.reduce((acc, t) => acc + t.accuracy, 0);
    return Math.round(sum / testHistory.length);
  };

  const getTotalTests = () => testHistory.length;

  const getProgressToday = () => {
    const today = new Date().toDateString();
    return testHistory.filter((t) => new Date(t.timestamp).toDateString() === today).length;
  };

  /* -------------------- Render -------------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Menu Screen */}
      {mode === "menu" && (
        <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          {/* User Info & Logout Button */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
            <span className="text-gray-400 text-sm hidden sm:block">Welcome, {user?.email}</span>
            <button
              onClick={onLogout}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-sm text-red-400 transition-all hover:text-red-300"
            >
              Logout
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-8 sm:mb-12 relative">
            <div className="inline-block relative group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative flex items-center justify-center gap-2 sm:gap-3 mb-3 px-8 py-4 bg-gray-900 rounded-3xl">
                <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400 animate-pulse" />
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">TypeSpeed Pro</h1>
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400 animate-pulse" style={{ animationDelay: "0.5s" }} />
              </div>
            </div>
            <p className="text-gray-400 text-base sm:text-lg animate-fade-in">Master your keyboard, one keystroke at a time</p>
          </div>

          {/* Quick Stats Dashboard */}
          {testHistory.length > 0 ? (
            <div className="mb-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="group bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur border border-yellow-500/30 rounded-2xl p-4 sm:p-6 hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 to-orange-400/0 group-hover:from-yellow-400/10 group-hover:to-orange-400/10 transition-all duration-300" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                      <span className="text-xs text-yellow-400/70">RECORD</span>
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-1">{getBestWpm()}</div>
                    <div className="text-xs sm:text-sm text-gray-400">Best WPM</div>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur border border-green-500/30 rounded-2xl p-4 sm:p-6 hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 to-emerald-400/0 group-hover:from-green-400/10 group-hover:to-emerald-400/10 transition-all duration-300" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                      <span className="text-xs text-green-400/70">AVERAGE</span>
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold text-green-400 mb-1">{getAvgWpm()}</div>
                    <div className="text-xs sm:text-sm text-gray-400">Avg WPM</div>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur border border-blue-500/30 rounded-2xl p-4 sm:p-6 hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-cyan-400/0 group-hover:from-blue-400/10 group-hover:to-cyan-400/10 transition-all duration-300" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                      <span className="text-xs text-blue-400/70">PRECISION</span>
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold text-blue-400 mb-1">{getAvgAccuracy()}%</div>
                    <div className="text-xs sm:text-sm text-gray-400">Accuracy</div>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur border border-orange-500/30 rounded-2xl p-4 sm:p-6 hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400/0 to-red-400/0 group-hover:from-orange-400/10 group-hover:to-red-400/10 transition-all duration-300" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <Flame className={`w-5 h-5 sm:w-6 sm:h-6 text-orange-400 ${streak > 0 ? "animate-pulse" : ""}`} />
                      <span className="text-xs text-orange-400/70">STREAK</span>
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold text-orange-400 mb-1">{streak}</div>
                    <div className="text-xs sm:text-sm text-gray-400">Days</div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6 bg-gray-800/50 border border-gray-700 rounded-2xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <span className="text-sm sm:text-base font-medium">Today's Progress</span>
                  </div>
                  <span className="text-sm text-gray-400">{getProgressToday()} / 5 tests</span>
                </div>
                <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min((getProgressToday() / 5) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-8 text-center">
              <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold mb-2">Start Your Journey!</h3>
              <p className="text-gray-400">Complete your first test to unlock statistics and track your progress</p>
            </div>
          )}

          {/* Practice Modes */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Timer className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                Quick Tests
              </h2>
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-yellow-400/30" style={{ animation: `pulse 2s infinite ${i * 0.2}s` }} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {practiceModes.map((pm) => {
                const Icon = pm.icon;
                return (
                  <button
                    key={pm.id}
                    onClick={() => startPractice(pm)}
                    onMouseEnter={() => setHoveredMode(pm.id)}
                    onMouseLeave={() => setHoveredMode(null)}
                    className={`group relative bg-gradient-to-br ${pm.bgColor} backdrop-blur border ${pm.borderColor} rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${pm.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <Icon className={`w-8 h-8 transition-all duration-300 ${hoveredMode === pm.id ? "scale-125 rotate-12" : ""}`} />
                        <div className={`text-2xl font-bold transition-all duration-300 ${hoveredMode === pm.id ? "scale-110" : ""}`}>{pm.name}</div>
                      </div>
                      <div className="text-sm text-gray-400 group-hover:text-white transition-colors">Quick Challenge</div>
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lessons */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                Skill Builder
              </h2>
              <Star className="w-6 h-6 text-yellow-400 animate-spin" style={{ animationDuration: "3s" }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => startLesson(lesson)}
                  className={`group relative bg-gray-800/50 hover:bg-gradient-to-r hover:${lesson.color} border border-gray-700 hover:border-transparent rounded-2xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden`}
                >
                  <div className="absolute top-4 right-4 text-4xl opacity-20 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300">
                    {lesson.icon}
                  </div>
                  <div className="relative z-10">
                    <div className="text-lg sm:text-xl font-bold group-hover:text-white mb-2">{lesson.name}</div>
                    <div className="text-xs sm:text-sm text-gray-400 group-hover:text-white/80 font-mono mb-3">{lesson.keys}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-white/70">
                      <span>Practice now</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent History */}
          {testHistory.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <History className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                  Recent Activity
                </h2>
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="group flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg transition-all"
                >
                  <span className="text-purple-400 text-xs sm:text-sm font-medium">{showStats ? "Show Less" : "View All"}</span>
                  <ChevronRight className={`w-4 h-4 text-purple-400 transition-transform ${showStats ? "rotate-90" : ""}`} />
                </button>
              </div>
              <div className="space-y-3">
                {testHistory.slice(0, showStats ? 20 : 5).map((test, idx) => (
                  <div key={idx} className="group bg-gray-800/30 hover:bg-gray-800/60 border border-gray-700 hover:border-gray-600 rounded-xl p-4 transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${test.wpm >= 60 ? "bg-green-400" : "bg-yellow-400"} animate-pulse`} />
                          <div className="font-medium text-gray-300 text-sm sm:text-base truncate">{test.mode}</div>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">{test.date}</div>
                      </div>
                      <div className="flex gap-4 sm:gap-6">
                        <div className="text-center">
                          <div className="text-xl sm:text-2xl font-bold text-yellow-400">{test.wpm}</div>
                          <div className="text-xs text-gray-500">WPM</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl sm:text-2xl font-bold text-green-400">{test.accuracy}%</div>
                          <div className="text-xs text-gray-500">ACC</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl sm:text-2xl font-bold text-red-400">{test.errors}</div>
                          <div className="text-xs text-gray-500">ERR</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Test/Lesson Screen */}
      {(mode === "test" || mode === "lesson") && (
        <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <button onClick={backToMenu} className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-gray-800">
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Exit</span>
            </button>
            <div className="flex gap-4">
              <button onClick={restart} className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 border border-yellow-500/30 rounded-lg transition-all text-sm sm:text-base">
                <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                <span>Restart</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <div className="relative bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 to-orange-400/20 group-hover:from-yellow-400/10 group-hover:to-orange-400/30 transition-all" />
              <div className="relative">
                <div className="text-xs sm:text-sm text-gray-400 mb-1">WPM</div>
                <div className="text-3xl sm:text-4xl font-bold text-yellow-400">{wpm}</div>
              </div>
            </div>
            <div className="relative bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 to-emerald-400/20 group-hover:from-green-400/10 group-hover:to-emerald-400/30 transition-all" />
              <div className="relative">
                <div className="text-xs sm:text-sm text-gray-400 mb-1">Accuracy</div>
                <div className="text-3xl sm:text-4xl font-bold text-green-400">{accuracy}%</div>
              </div>
            </div>
            <div className="relative bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-xl p-4 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-red-400/0 to-pink-400/20 group-hover:from-red-400/10 group-hover:to-pink-400/30 transition-all" />
              <div className="relative">
                <div className="text-xs sm:text-sm text-gray-400 mb-1">Errors</div>
                <div className="text-3xl sm:text-4xl font-bold text-red-400">{errors}</div>
              </div>
            </div>
            <div className="relative bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 to-cyan-400/20 group-hover:from-blue-400/10 group-hover:to-cyan-400/30 transition-all" />
              <div className="relative">
                <div className="text-xs sm:text-sm text-gray-400 mb-1">{timeLeft !== null ? "Time" : "Progress"}</div>
                <div className="text-3xl sm:text-4xl font-bold text-blue-400">{timeLeft !== null ? `${timeLeft}s` : `${Math.round((currentIndex / Math.max(1, currentText.length)) * 100)}%`}</div>
              </div>
            </div>
          </div>

          {/* Caps Lock Warning */}
          {capsLockOn && (
            <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3 mb-4 text-center text-yellow-400 animate-pulse">⚠️ Caps Lock is ON</div>
          )}

          {/* Text Display */}
          <div className="relative bg-gray-800/50 border-2 border-gray-700 rounded-2xl p-6 sm:p-8 mb-6 min-h-[150px] sm:min-h-[200px] flex items-center overflow-x-auto group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative text-xl sm:text-2xl lg:text-3xl leading-relaxed font-mono select-none break-words">
              {currentText.split("").map((char, idx) => (
                <span key={idx} className={`${getCharClass(idx)} transition-all duration-100 px-0.5`}>{char === " " ? "\u00A0" : char}</span>
              ))}
            </div>
          </div>

          {/* Hidden Input */}
          <input
            ref={inputRef}
            type="text"
            value=""
            onKeyDown={handleKeyPress}
            className="opacity-0 absolute pointer-events-none"
            autoFocus
          />

          {/* Instructions */}
          {!startTime && !isComplete && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500/10 border border-purple-500/30 rounded-full text-gray-400 animate-bounce">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>Start typing to begin...</span>
              </div>
            </div>
          )}

          {/* Completion Screen */}
          {isComplete && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
              {/* Confetti Particles */}
              {particles.map((p) => (
                <div
                  key={p.id}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-fall"
                  style={{
                    left: `${p.x}%`,
                    animationDelay: `${p.delay}s`,
                    animationDuration: `${p.duration}s`
                  }}
                />
              ))}

              <div className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-2 border-yellow-500/50 rounded-3xl p-8 sm:p-12 max-w-2xl w-full shadow-2xl animate-scale-in">
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400 rounded-full blur-2xl opacity-50 animate-pulse" />
                    <Trophy className="relative w-24 h-24 sm:w-32 sm:h-32 text-yellow-400 animate-bounce" />
                  </div>
                </div>

                <div className="text-center mt-16">
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent animate-gradient">Amazing Work!</h2>
                  <p className="text-gray-400 mb-8">You've completed the test. Here are your results:</p>

                  <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8">
                    <div className="relative group bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 to-orange-400/0 group-hover:from-yellow-400/20 group-hover:to-orange-400/20 transition-all" />
                      <div className="relative">
                        <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                        <div className="text-5xl sm:text-6xl font-bold text-yellow-400 mb-2">{wpm}</div>
                        <div className="text-sm text-gray-400">Words Per Minute</div>
                        <div className="text-xs text-gray-500 mt-1">Raw: {rawWpm} WPM</div>
                      </div>
                    </div>
                    <div className="relative group bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 to-emerald-400/0 group-hover:from-green-400/20 group-hover:to-emerald-400/20 transition-all" />
                      <div className="relative">
                        <Target className="w-8 h-8 text-green-400 mx-auto mb-3" />
                        <div className="text-5xl sm:text-6xl font-bold text-green-400 mb-2">{accuracy}%</div>
                        <div className="text-sm text-gray-400">Accuracy</div>
                        <div className="text-xs text-gray-500 mt-1">{errors} errors</div>
                      </div>
                    </div>
                  </div>

                  {wpm >= 60 && (
                    <div className="mb-6 bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 animate-fade-in">
                      <div className="flex items-center justify-center gap-2 text-purple-400">
                        <Star className="w-5 h-5 animate-spin" style={{ animationDuration: "3s" }} />
                        <span className="font-bold">Achievement Unlocked: Speed Demon!</span>
                        <Star className="w-5 h-5 animate-spin" style={{ animationDuration: "3s", animationDirection: "reverse" }} />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                    <button onClick={restart} className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-xl font-bold text-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-yellow-500/50">
                      <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                      Try Again
                    </button>
                    <button onClick={backToMenu} className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-lg transition-all duration-200 hover:scale-105">
                      Back to Menu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes gradient { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes fall { 0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(360deg); opacity: 0; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-scale-in { animation: scale-in 0.5s ease-out; }
        .animate-gradient { background-size: 200% 200%; animation: gradient 3s ease infinite; }
        .animate-fall { animation: fall linear forwards; }
      `}</style>
    </div>
  );
}
