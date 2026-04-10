import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type RobotVariant = 'idle' | 'blinking' | 'talking' | 'scanning' | 'glitch' | 'wave' | 'hover' | 'hologram' | 'charging' | 'alert' | 'sequence';

interface RobotAnimationProps {
  scale?: number;
  className?: string;
  color?: string; // e.g., 'indigo', 'cyan', 'fuchsia', 'orange', 'emerald'
  variant?: RobotVariant;
}

const RobotAnimation: React.FC<RobotAnimationProps> = ({ scale = 0.8, className = '', color = 'indigo', variant = 'sequence' }) => {
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'scanning' | 'talking'>('idle');

  // Sequence logic: idle -> scanning -> talking -> repeat
  useEffect(() => {
    if (variant !== 'sequence') return;

    const sequence = async () => {
      while (true) {
        setCurrentPhase('idle');
        await new Promise(resolve => setTimeout(resolve, 3000));
        setCurrentPhase('scanning');
        await new Promise(resolve => setTimeout(resolve, 4000));
        setCurrentPhase('talking');
        await new Promise(resolve => setTimeout(resolve, 4000));
      }
    };

    sequence();
  }, [variant]);
  
  // Color mapping for different parts
  const getColorStyles = (color: string) => {
    const styles: Record<string, { aura: string, eye: string, eyeShadow: string, chest: string, beam: string, metal: string }> = {
      'indigo': { 
        aura: 'bg-indigo-500/10 dark:bg-indigo-600/20', 
        eye: 'border-cyan-400', 
        eyeShadow: 'drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]',
        chest: 'bg-cyan-400',
        beam: 'bg-cyan-400/30',
        metal: 'from-slate-50 via-slate-200 to-slate-400'
      },
      'fuchsia': { 
        aura: 'bg-fuchsia-500/10 dark:bg-fuchsia-600/20', 
        eye: 'border-fuchsia-400', 
        eyeShadow: 'drop-shadow-[0_0_12px_rgba(232,121,249,0.9)]',
        chest: 'bg-fuchsia-400',
        beam: 'bg-fuchsia-400/30',
        metal: 'from-slate-50 via-slate-200 to-slate-400'
      },
      'emerald': { 
        aura: 'bg-emerald-500/10 dark:bg-emerald-600/20', 
        eye: 'border-emerald-400', 
        eyeShadow: 'drop-shadow-[0_0_12px_rgba(52,211,153,0.9)]',
        chest: 'bg-emerald-400',
        beam: 'bg-emerald-400/30',
        metal: 'from-slate-50 via-slate-200 to-slate-400'
      },
      'orange': { 
        aura: 'bg-orange-500/10 dark:bg-orange-600/20', 
        eye: 'border-orange-400', 
        eyeShadow: 'drop-shadow-[0_0_12px_rgba(251,146,60,0.9)]',
        chest: 'bg-orange-400',
        beam: 'bg-orange-400/30',
        metal: 'from-slate-50 via-slate-200 to-slate-400'
      },
      'blue': { 
        aura: 'bg-blue-500/10 dark:bg-blue-600/20', 
        eye: 'border-blue-400', 
        eyeShadow: 'drop-shadow-[0_0_12px_rgba(96,165,250,0.9)]',
        chest: 'bg-blue-400',
        beam: 'bg-blue-400/30',
        metal: 'from-slate-50 via-slate-200 to-slate-400'
      },
      'pink': { 
        aura: 'bg-pink-500/10 dark:bg-pink-600/20', 
        eye: 'border-pink-400', 
        eyeShadow: 'drop-shadow-[0_0_12px_rgba(244,114,182,0.9)]',
        chest: 'bg-pink-400',
        beam: 'bg-pink-400/30',
        metal: 'from-slate-50 via-slate-200 to-slate-400'
      },
    };
    return styles[color] || styles['indigo'];
  };

  const styles = getColorStyles(color);
  const baseSize = 320;
  const containerSize = baseSize * scale;

  // Animation Variants
  const getEyeAnimation = () => {
    if (currentPhase === 'scanning') {
      return { 
        scaleY: [1, 1.2, 1], 
        opacity: [0.7, 1, 0.7],
        transition: { duration: 1.5, repeat: Infinity } 
      };
    }
    return { scaleY: [1, 0.1, 1], transition: { duration: 0.3, repeat: Infinity, repeatDelay: 5 } };
  };

  const getMouthAnimation = () => {
    if (currentPhase === 'talking') {
      return { 
        height: [2, 10, 4, 12, 2], 
        width: [16, 20, 16, 24, 16],
        transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" } 
      };
    }
    return { height: 2, width: 16 };
  };

  const getBodyAnimation = () => {
    return { 
      y: [-15, 15, -15], 
      rotate: [-1, 1, -1],
      transition: { duration: 8, repeat: Infinity, ease: "easeInOut" } 
    };
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.05, y: -5 }}
      className={`hidden md:flex items-center justify-center relative ${className}`}
      style={{ width: containerSize, height: containerSize }}
    >
      {/* Glowing Aura */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute rounded-full blur-[80px] ${styles.aura}`}
        style={{ width: containerSize, height: containerSize }}
      />
      
      {/* Robot Composition */}
      <motion.div 
        animate={getBodyAnimation()}
        className="relative flex items-center justify-center"
        style={{ width: containerSize, height: containerSize }}
      >
        {/* Robot Character */}
        <div className="relative z-10 flex flex-col items-center" style={{ transform: `scale(${scale})`, width: baseSize, height: baseSize, justifyContent: 'center' }}>
          
          {/* Arms */}
          {/* Left Arm (Static/Subtle) */}
          <motion.div 
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-12 top-40 w-8 h-24 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 rounded-full shadow-lg origin-top z-0 border-l border-white/30"
          >
            {/* Shoulder Joint */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-10 bg-slate-400 rounded-full border border-slate-300 shadow-inner" />
          </motion.div>
          
          {/* Right Arm (Waving - Right Hand Only) */}
          <motion.div 
            animate={currentPhase === 'idle' ? { rotate: [-45, -75, -45] } : { rotate: [-5, 5, -5] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-12 top-40 w-8 h-24 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 rounded-full shadow-lg origin-top z-0 border-r border-white/30"
          >
            {/* Shoulder Joint */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-10 bg-slate-400 rounded-full border border-slate-300 shadow-inner" />
            
            {/* Hand part */}
            <motion.div 
              animate={currentPhase === 'idle' ? { rotate: [0, 20, 0] } : { rotate: 0 }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="absolute bottom-0 left-0 w-full h-8 bg-slate-400 rounded-full border-t border-slate-300 shadow-md" 
            />
          </motion.div>

          {/* Head */}
          <div className="relative w-48 h-36 bg-gradient-to-br from-slate-50 via-slate-200 to-slate-400 rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/60 flex items-center justify-center z-20">
            {/* Antenna */}
            <motion.div 
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 w-1.5 h-10 bg-slate-400 rounded-full origin-bottom"
            >
              <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${styles.chest} shadow-[0_0_10px_rgba(34,211,238,0.8)]`} />
            </motion.div>

            {/* Face Screen */}
            <div className="w-[92%] h-[88%] bg-slate-950 rounded-[2.8rem] relative overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center border border-slate-800/80">
               {/* Screen Gloss */}
               <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent_70%)]" />
               
               {/* Eyes */}
               <div className="flex gap-10 mb-5">
                 <motion.div 
                   animate={getEyeAnimation()}
                   className={`w-11 h-6 border-t-[7px] rounded-t-full ${styles.eye} ${styles.eyeShadow}`}
                 />
                 <motion.div 
                   animate={getEyeAnimation()}
                   className={`w-11 h-6 border-t-[7px] rounded-t-full ${styles.eye} ${styles.eyeShadow}`}
                 />
               </div>
               
               {/* Scanning Beam */}
               <AnimatePresence>
                 {currentPhase === 'scanning' && (
                   <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="absolute inset-0 pointer-events-none"
                   >
                     <motion.div
                       animate={{ y: [-40, 40, -40] }}
                       transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                       className={`absolute w-full h-1 ${styles.beam} blur-[2px] z-10`}
                     />
                     <motion.div
                       animate={{ opacity: [0.1, 0.3, 0.1] }}
                       transition={{ duration: 1, repeat: Infinity }}
                       className={`absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent`}
                     />
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* Mouth */}
               <motion.div 
                  animate={getMouthAnimation()}
                  className={`border-b-[4px] rounded-b-full opacity-90 ${styles.eye}`}
               />
            </div>

            {/* Ears/Antennas */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-20 bg-gradient-to-r from-slate-300 to-slate-100 rounded-2xl shadow-md -z-10 border-l border-slate-200" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-20 bg-gradient-to-l from-slate-300 to-slate-100 rounded-2xl shadow-md -z-10 border-r border-slate-200" />
          </div>

          {/* Neck */}
          <div className="w-12 h-4 bg-slate-400 -mt-1 z-10 shadow-inner" />

          {/* Body */}
          <div className="relative w-36 h-28 bg-gradient-to-b from-slate-100 to-slate-400 rounded-[2.5rem] shadow-2xl z-10 flex items-center justify-center border-t border-white/40">
             {/* Chest Core */}
             <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-700 shadow-inner overflow-hidden">
                <motion.div 
                  animate={{ 
                    scale: currentPhase === 'talking' ? [1, 1.2, 1] : [1, 1.1, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ duration: currentPhase === 'talking' ? 0.5 : 2, repeat: Infinity }}
                  className={`w-6 h-6 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.6)] ${styles.chest}`} 
                />
                {/* Core detail */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.4)_100%)]" />
             </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RobotAnimation;
