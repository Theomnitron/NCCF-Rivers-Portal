import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageCircle,
  Phone,
  Copy,
  Check,
  X,
  ExternalLink,
  Headphones,
} from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';

export const DeveloperSupportFab: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const devPhoneFormatted = APP_CONFIG.developerSupport.phoneFormatted;
  const devPhoneRaw = APP_CONFIG.developerSupport.phoneRaw;
  const defaultWhatsAppMsg = encodeURIComponent(
    'Hello! I would love to make an enquiry about the NCCF Rivers State Portal:\n\n'
  );

  const whatsappUrl = `https://wa.me/${devPhoneRaw}?text=${defaultWhatsAppMsg}`;
  const telUrl = `tel:+${devPhoneRaw}`;

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`+${devPhoneRaw}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close when clicking or tapping outside the popover card
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 select-none">
      <div className="relative">
        {/* Floating Action Button (FAB) - Slowly Bouncing */}
        <AnimatePresence mode="wait">
          {!isOpen && (
            <motion.button
              key="fab-button"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                y: [0, -6, 0],
              }}
              transition={{
                scale: { duration: 0.18 },
                opacity: { duration: 0.18 },
                y: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
              }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(true)}
              className="relative flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/20 border border-emerald-400/30 backdrop-blur-md cursor-pointer transition-colors"
              title="For Inquiries & Complaints"
              id="developer-support-fab-btn"
            >
              <MessageCircle className="w-6 h-6 text-white" />
              <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-300" />
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Compact Popover Card anchored strictly to bottom-right */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="fab-card"
              ref={cardRef}
              initial={{ opacity: 0, y: 12, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.92 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute bottom-0 right-0 w-72 sm:w-80 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-zinc-800 shadow-2xl p-3.5 text-zinc-900 dark:text-zinc-100 overflow-hidden origin-bottom-right"
              id="developer-support-modal"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-zinc-800/80">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-zinc-900 dark:text-white leading-none">
                      For Inquiries & Complaints
                    </h3>
                    <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">
                      Welfare & Tech Team — NCCF Rivers
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Close window"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Description */}
              <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mb-2.5 leading-relaxed">
                Want to make an Enquiry or lay a Complaint?
                Speak directly with the Welfare-Tech Team:
              </p>

              {/* Quick Actions */}
              <div className="space-y-2">
                {/* WhatsApp Direct Chat */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-between shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat on WhatsApp</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
                </a>

                {/* Phone Call & Copy */}
                <div className="flex items-center space-x-1.5">
                  <a
                    href={telUrl}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-between transition-colors"
                    title="Call Line"
                  >
                    <div className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-mono text-[11px]">{devPhoneFormatted}</span>
                    </div>
                  </a>

                  <button
                    onClick={handleCopyPhone}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                    title="Copy Phone Number"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
