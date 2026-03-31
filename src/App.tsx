import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  Megaphone, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Trash2, 
  PartyPopper,
  CheckCircle2
} from 'lucide-react';
import { LESSONS, FlashcardItem } from './data';
import { HandwritingCanvas } from './components/HandwritingCanvas';

export default function App() {
  const [currentLesson, setCurrentLesson] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lineWidth, setLineWidth] = useState(6);
  
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      synthRef.current?.cancel();
    };
  }, []);

  const currentData = LESSONS[currentLesson] || [];
  const currentItem = currentData[currentIndex];

  const speak = useCallback((text: string, rate: number = 0.8) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    utterance.rate = rate;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
    return utterance;
  }, []);

  const stopAutoPlay = useCallback(() => {
    setIsAutoPlaying(false);
    if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    synthRef.current?.cancel();
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < currentData.length - 1) {
      setCurrentIndex(prev => prev + 1);
      window.dispatchEvent(new CustomEvent('clear-canvas'));
    } else {
      setIsFinished(true);
      stopAutoPlay();
    }
  }, [currentIndex, currentData.length, stopAutoPlay]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      window.dispatchEvent(new CustomEvent('clear-canvas'));
    }
  }, [currentIndex]);

  const startAutoPlaySequence = useCallback(() => {
    if (!isAutoPlaying) return;

    // 1. Speak character
    speak(currentItem.char);

    // 2. After a delay, speak mnemonic
    autoPlayTimerRef.current = setTimeout(() => {
      if (!isAutoPlaying) return;
      const mnemonicUtterance = speak(currentItem.text, 0.85);
      
      if (mnemonicUtterance) {
        mnemonicUtterance.onend = () => {
          setIsSpeaking(false);
          if (!isAutoPlaying) return;
          
          // 3. After mnemonic, go to next or finish
          autoPlayTimerRef.current = setTimeout(() => {
            if (!isAutoPlaying) return;
            if (currentIndex < currentData.length - 1) {
              handleNext();
            } else {
              setIsFinished(true);
              stopAutoPlay();
            }
          }, 1000);
        };
      }
    }, 1500);
  }, [currentItem, isAutoPlaying, currentIndex, currentData.length, handleNext, speak, stopAutoPlay]);

  useEffect(() => {
    if (isAutoPlaying) {
      startAutoPlaySequence();
    }
  }, [currentIndex, isAutoPlaying, startAutoPlaySequence]);

  const toggleAutoPlay = () => {
    if (isAutoPlaying) {
      stopAutoPlay();
    } else {
      setIsAutoPlaying(true);
    }
  };

  const resetLesson = () => {
    setCurrentIndex(0);
    setIsFinished(false);
    stopAutoPlay();
    window.dispatchEvent(new CustomEvent('clear-canvas'));
  };

  const nextLesson = () => {
    const nextL = currentLesson < 6 ? currentLesson + 1 : 1;
    setCurrentLesson(nextL);
    resetLesson();
  };

  if (isFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card w-full max-w-md p-8 rounded-3xl border border-border-main shadow-2xl text-center space-y-6"
        >
          <div className="flex justify-center">
            <div className="bg-brand-red-light p-6 rounded-full">
              <PartyPopper className="w-16 h-16 text-brand-red" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-serif font-black text-text-main">太棒了！全數通關！</h1>
            <p className="text-text-muted">第 {currentLesson} 課，共 {currentData.length} 個字</p>
          </div>
          
          <div className="flex gap-4 justify-center">
            <div className="bg-bg border border-border-main rounded-2xl p-4 flex-1">
              <div className="text-3xl font-serif font-black text-brand-red">{currentData.length}</div>
              <div className="text-xs text-text-muted">個漢字</div>
            </div>
            <div className="bg-bg border border-border-main rounded-2xl p-4 flex-1">
              <CheckCircle2 className="w-8 h-8 text-brand-green mx-auto mb-1" />
              <div className="text-xs text-text-muted">全部完成</div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={nextLesson}
              className="w-full py-4 bg-brand-blue text-white rounded-2xl font-bold shadow-lg shadow-brand-blue/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              下一課 <ChevronRight className="w-5 h-5" />
            </button>
            <button 
              onClick={resetLesson}
              className="w-full py-4 bg-white border border-border-main text-text-muted rounded-2xl font-bold hover:bg-bg transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> 再練習一次
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-5xl mx-auto p-4 gap-4">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <h1 className="text-xl font-serif font-black text-brand-red hidden sm:block">聽覺破關字卡</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={currentLesson}
            onChange={(e) => {
              setCurrentLesson(Number(e.target.value));
              setCurrentIndex(0);
              stopAutoPlay();
            }}
            className="bg-white border-2 border-border-main rounded-xl px-4 py-2 font-bold text-sm focus:outline-none focus:border-brand-blue transition-colors cursor-pointer"
          >
            {[1, 2, 3, 4, 5, 6].map(l => (
              <option key={l} value={l}>第 {l} 課</option>
            ))}
          </select>
          <div className="bg-white border-2 border-border-main rounded-xl px-4 py-2 font-bold text-sm text-text-muted whitespace-nowrap">
            {currentIndex + 1} / {currentData.length}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-border-main rounded-full overflow-hidden">
        <motion.div 
          initial={false}
          animate={{ width: `${((currentIndex + 1) / currentData.length) * 100}%` }}
          className="h-full bg-gradient-to-r from-brand-red to-brand-amber"
        />
      </div>

      {/* Main Content Grid */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
        {/* Left Panel: Flashcard & Controls */}
        <div className="flex flex-col gap-4 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${currentLesson}-${currentIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 bg-white rounded-3xl border border-border-main shadow-xl p-6 flex flex-col items-center text-center gap-4 min-h-0"
            >
              <div className={`relative w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-[#fff8f2] to-[#ffeee4] border-[3px] border-[#f5b89a] rounded-2xl flex items-center justify-center shrink-0 transition-all ${isSpeaking ? 'speaking-glow' : ''}`}>
                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#e85d3a 1px, transparent 1px), linear-gradient(90deg, #e85d3a 1px, transparent 1px)', backgroundSize: '50% 50%' }} />
                <span className="text-7xl sm:text-8xl font-serif font-black relative z-10 select-none">
                  {currentItem.char}
                </span>
              </div>
              
              <div className="text-2xl font-bold text-brand-red">
                {currentItem.pinyin}
              </div>
              
              <div className="w-12 h-1 bg-border-main rounded-full shrink-0" />
              
              <div className="w-full bg-brand-blue-light border border-blue-200 rounded-2xl p-4 flex-1 flex flex-col justify-center">
                <div className="text-[10px] font-bold text-brand-blue uppercase tracking-widest mb-1">🔑 口訣</div>
                <p className="text-lg font-serif font-semibold text-[#1e3a5f] leading-relaxed">
                  {currentItem.text}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <button 
              onClick={() => speak(currentItem.char)}
              className="py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-600/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Volume2 className="w-5 h-5" /> 讀字音
            </button>
            <button 
              onClick={() => speak(currentItem.text, 0.85)}
              className="py-3 bg-brand-amber text-white rounded-xl font-bold shadow-lg shadow-brand-amber/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Megaphone className="w-5 h-5" /> 聽口訣
            </button>
          </div>

          <button 
            onClick={toggleAutoPlay}
            className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
              isAutoPlaying 
              ? 'bg-red-500 text-white shadow-red-500/20' 
              : 'bg-brand-green text-white shadow-brand-green/20'
            }`}
          >
            {isAutoPlaying ? <><Pause className="w-5 h-5" /> 停止播放</> : <><Play className="w-5 h-5" /> 自動播放</>}
          </button>

          <div className="grid grid-cols-3 gap-3 shrink-0">
            <button 
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="py-3 bg-white border border-border-main text-text-muted rounded-xl font-bold hover:bg-bg disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> 上一個
            </button>
            <button 
              onClick={handleNext}
              className="py-3 bg-brand-blue text-white rounded-xl font-bold shadow-lg shadow-brand-blue/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              下一個 <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={resetLesson}
              className="py-3 bg-white border border-border-main text-text-muted rounded-xl font-bold hover:bg-bg transition-all flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-4 h-4" /> 重來
            </button>
          </div>
        </div>

        {/* Right Panel: Handwriting */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <h2 className="text-sm font-bold text-text-muted">✏️ 手寫練習（田字格）</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-text-muted uppercase">粗細</span>
              {[6, 13, 22].map(size => (
                <button 
                  key={size}
                  onClick={() => setLineWidth(size)}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                    lineWidth === size ? 'border-brand-blue bg-brand-blue-light' : 'border-border-main bg-white'
                  }`}
                >
                  <div className="bg-text-main rounded-full" style={{ width: size/2, height: size/2 }} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-[300px]">
            <HandwritingCanvas lineWidth={lineWidth} />
          </div>

          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('clear-canvas'))}
            className="w-full py-3 bg-white border border-red-200 text-red-500 rounded-xl font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" /> 清除畫布
          </button>
        </div>
      </main>
    </div>
  );
}
