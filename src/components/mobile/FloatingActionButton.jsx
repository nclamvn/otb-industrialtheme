'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';

export default function FloatingActionButton({
  actions = [],
  icon: MainIcon = Plus,
  position = 'bottom-right',
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggle = useCallback(() => setIsExpanded((prev) => !prev), []);

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2',
  };

  return (
    <div className={`fixed z-50 ${positionClasses[position]}`}>
      {/* Action buttons */}
      <AnimatePresence>
        {isExpanded && (
          <div className="absolute bottom-16 right-0 flex flex-col-reverse gap-3 mb-2">
            {actions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-2"
              >
                <span className="px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap shadow-sm bg-white text-[#2C2417]">
                  {action.label}
                </span>
                <button
                  onClick={() => {
                    action.onClick?.();
                    setIsExpanded(false);
                  }}
                  className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-colors"
                  style={{ backgroundColor: action.color || '#1B6B45' }}
                >
                  {action.icon && <action.icon size={18} className="text-white" />}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={toggle}
        animate={{ rotate: isExpanded ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white"
        style={{
          backgroundColor: '#C4975A',
          boxShadow: '0 4px 20px rgba(196,151,90,0.35)',
        }}
      >
        {isExpanded ? <X size={24} /> : <MainIcon size={24} />}
      </motion.button>
    </div>
  );
}
