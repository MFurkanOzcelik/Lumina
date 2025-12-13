import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
      }}
      transition={{ duration: 0.5 }}
      className="text-6xl font-bold tracking-wider relative"
      style={{ color: 'var(--color-text)' }}
    >
      <motion.span
        animate={{ 
          textShadow: [
            '0 0 20px var(--color-accent)00',
            '0 0 20px var(--color-accent)30',
            '0 0 20px var(--color-accent)00',
          ]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        {formatTime(time)}
      </motion.span>
    </motion.div>
  );
};

