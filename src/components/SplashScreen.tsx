import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoBackdrop from './landing/VideoBackdrop';

interface SplashScreenProps {
  onDone: () => void;
}

const getSlogan = () => {
  const lang = navigator.language?.toLowerCase() || '';
  return lang.startsWith('es') ? '¡Sigue la ruta!' : 'Follow the route!';
};

const SplashScreen: React.FC<SplashScreenProps> = ({ onDone }) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 2800);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 38%, rgba(255,214,10,.12), transparent 60%), linear-gradient(135deg, #0a0b0d 0%, #111317 100%)',
        }}
      >
        {/* Logo animado (reveal 3D) */}
        <motion.div
          className="mb-6 h-32 w-32 overflow-hidden rounded-3xl shadow-2xl ring-1 ring-brand-yellow/20"
          initial={{ scale: 0.4, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <VideoBackdrop src="/assets/video/logoanim.mp4" poster="/assets/video/logoanim-poster.jpg" />
        </motion.div>

        {/* App name */}
        <motion.h1
          className="text-4xl font-extrabold text-white mb-3 tracking-wide"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Urban Drive
        </motion.h1>

        {/* Slogan */}
        <motion.p
          className="text-lg text-white/70 font-medium tracking-widest uppercase"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5 }}
        >
          {getSlogan()}
        </motion.p>

        {/* Loading dots */}
        <motion.div
          className="mt-14 flex space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-white/60"
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.1, delay: i * 0.18, repeat: Infinity }}
            />
          ))}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;
