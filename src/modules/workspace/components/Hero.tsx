import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Cpu, Zap, Code, Database } from 'lucide-react';
import RobotAnimation from './RobotAnimation';

interface Particle {
  width: number;
  height: number;
  left: string;
  top: string;
  duration: number;
  delay: number;
}

const Hero: React.FC = () => {
  const [particles] = useState<Particle[]>(() => 
    [...Array(6)].map(() => ({
      width: Math.random() * 40 + 20,
      height: Math.random() * 40 + 20,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: Math.random() * 5 + 5,
      delay: Math.random() * 2,
    }))
  );

  return (
    <div className="relative w-full h-[140px] md:h-[160px] rounded-3xl overflow-hidden group isolate bg-slate-50 dark:bg-slate-950 shadow-xl shadow-indigo-100/50 dark:shadow-2xl dark:shadow-indigo-900/20 border border-indigo-100 dark:border-indigo-500/10 transition-colors duration-300">
      {/* 1. Background Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/80 via-slate-50 to-slate-50 dark:from-indigo-900/40 dark:via-slate-950 dark:to-slate-950 transition-colors duration-300" />
      
      {/* 2. Animated Grid & Particles (Dark Mode Only) */}
      <div className="absolute inset-0 opacity-0 dark:opacity-20 transition-opacity duration-300" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      
      {/* Floating Digital Particles */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute bg-indigo-500/10 dark:bg-indigo-500/20 backdrop-blur-sm border border-indigo-300/30 dark:border-indigo-400/30 rounded-lg"
          style={{
            width: p.width,
            height: p.height,
            left: p.left,
            top: p.top,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.1, 0.3, 0.1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        />
      ))}

      {/* 3. Content Layer */}
      <div className="relative h-full flex items-center justify-between px-8 md:px-12 py-3 z-10">
        {/* Left Side: Text Content */}
        <div className="max-w-2xl space-y-3 relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-1"
          >
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight drop-shadow-sm dark:drop-shadow-lg whitespace-nowrap">
              Welcome to Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 dark:from-indigo-400 dark:via-purple-400 dark:to-cyan-400 animate-gradient-x">AI Workspace</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base max-w-lg leading-relaxed font-medium drop-shadow-sm">
              Enhance your productivity with smart AI tools at your fingertips.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex gap-3 pt-1"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-white/5 border border-indigo-100 dark:border-white/10 backdrop-blur-md hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-default shadow-sm dark:shadow-none">
              <Sparkles size={14} className="text-cyan-600 dark:text-cyan-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Intelligent
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-white/5 border border-indigo-100 dark:border-white/10 backdrop-blur-md hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-default shadow-sm dark:shadow-none">
              <Zap size={14} className="text-yellow-600 dark:text-yellow-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Fast
              </span>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Animated AI Agent Icon */}
        <div className="hidden md:flex items-center justify-center w-[45%] h-full relative">
          <div className="relative z-10 flex items-center justify-center">
            <RobotAnimation scale={0.45} color="indigo" variant="sequence" />
            
            {/* Floating Tech Icons */}
            <motion.div 
              className="absolute -top-12 -right-4 p-3 bg-slate-800/80 backdrop-blur-md rounded-xl border border-indigo-500/30 shadow-lg shadow-indigo-500/20 z-30"
              animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
            >
              <Cpu size={24} className="text-indigo-400" />
            </motion.div>
            
            <motion.div 
              className="absolute top-1/2 -right-16 p-2.5 bg-slate-800/80 backdrop-blur-md rounded-xl border border-purple-500/30 shadow-lg shadow-purple-500/20 z-30"
              animate={{ x: [0, 10, 0], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            >
              <Database size={20} className="text-purple-400" />
            </motion.div>
    
            <motion.div 
              className="absolute -bottom-8 -left-12 p-3 bg-slate-800/80 backdrop-blur-md rounded-xl border border-cyan-500/30 shadow-lg shadow-cyan-500/20 z-30"
              animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, delay: 1.5 }}
            >
              <Code size={24} className="text-cyan-400" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
