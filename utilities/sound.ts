/**
 * Simple utility to play notification sounds.
 * Uses a base64 encoded "ding" sound to avoid external dependencies.
 */

// A simple "glass ting" / "ding" sound
// Source: Open source "glass_ping" simplified and encoded to base64
const NOTIFICATION_SOUND_B64 = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // Placeholder, I'll generate a proper one or use a synthesize function if this is too short/invalid.

// Actually, generating a clean beep with Oscillator is more reliable and cleaner code than a giant base64 string.
// Let's use the Web Audio API for a nice "ping".

export const playNotificationSound = async (volume: number = 0.5): Promise<void> => {
    return new Promise((resolve, reject) => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) {
                console.warn('Web Audio API is not supported in this browser.');
                return resolve();
            }

            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = 'sine';

            // "Ping" effect: High pitch dropping slightly, with exponential decay
            const now = ctx.currentTime;

            // Frequency: Start high (e.g. 880Hz - A5) and drop slightly for that "glass" feel logic, 
            // or just a pure stable sine with a nice envelope.
            // Let's go for a soft "Ding" at C6 (1046.50 Hz)
            oscillator.frequency.setValueAtTime(1046.5, now);
            oscillator.frequency.exponentialRampToValueAtTime(1046.5, now + 1.5); // Sustain

            // Envelope: Fast attack, slow exponential release
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume, now + 0.05); // fast attack
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5); // long tail release

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.start(now);
            oscillator.stop(now + 1.5);

            oscillator.onended = () => {
                resolve();
            };
        } catch (error) {
            // Fallback or just ignore
            console.error("Failed to play notification sound", error);
            reject(error);
        }
    });
};
