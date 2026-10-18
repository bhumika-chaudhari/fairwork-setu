import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { feedback } from '../lib/feedback';

interface SoundToggleProps {
    className?: string;
    size?: 'sm' | 'md';
}

export default function SoundToggle({ className = '', size = 'md' }: SoundToggleProps = {}) {
    const [muted, setMuted] = useState(() => feedback.isMuted);

    useEffect(() => {
        const unsubscribe = feedback.subscribe((isMuted) => {
            setMuted(isMuted);
        });
        return unsubscribe;
    }, []);

    const handleToggle = () => {
        const nextState = feedback.toggleMute();
        setMuted(nextState);
        if (!nextState) {
            // Play a quick chime to confirm audio is active
            feedback.playTap();
        }
    };

    const sizeClass = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';

    return (
        <motion.button
            type="button"
            onClick={handleToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            title={muted ? 'Unmute sounds' : 'Mute sounds'}
            aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
            className={`relative flex ${sizeClass} items-center justify-center rounded-full bg-white/75 backdrop-blur-md border border-[#F4EBDD] text-deepEmerald shadow-xs transition-colors hover:bg-white hover:border-[#E5953E]/40 ${className}`}
        >
            <div className="relative flex items-center justify-center h-4 w-4">
                {/* Speaker cone */}
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" fillOpacity="0.15" />

                    {/* Sound waves when active */}
                    {!muted && (
                        <>
                            <motion.path
                                d="M15.54 8.46a5 5 0 0 1 0 7.07"
                                initial={{ opacity: 0, pathLength: 0 }}
                                animate={{ opacity: 1, pathLength: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            />
                            <motion.path
                                d="M19.07 4.93a10 10 0 0 1 0 14.14"
                                initial={{ opacity: 0, pathLength: 0 }}
                                animate={{ opacity: 1, pathLength: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25, delay: 0.05 }}
                            />
                        </>
                    )}

                    {/* Strikethrough line when muted */}
                    {muted && (
                        <motion.line
                            x1="23"
                            y1="1"
                            x2="1"
                            y2="23"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.2 }}
                            stroke="currentColor"
                            className="text-red-500"
                        />
                    )}
                </svg>
            </div>
        </motion.button>
    );
}