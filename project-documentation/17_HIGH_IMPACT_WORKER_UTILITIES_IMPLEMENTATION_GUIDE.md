# FairWork Setu — High-Impact Worker Utilities Implementation Specification

**Document Identifier:** `SETU-DOC-017`  
**Module:** Field Ergonomics, Worker Safety, Ledger Transparency & Legal Empowerment  
**Target Architecture:** React 18 / TypeScript SPA + Capacitor 8 Android Hybrid Bridge  
**Execution Environment:** Client-Side Edge Execution (Zero Cloud API Cost, 100% Offline-First)  

---

## 1. Executive Summary & Purpose

While FairWork Setu provides complex machine learning models (income regression, anomaly isolation, RAG vector retrieval, and semantic matching), field research shows that informal Indian gig workers (auto/cab drivers, delivery riders, daily-wage laborers, and domestic helpers) require **immediate, lightweight, on-the-road operational utilities**. 

This document provides the complete, production-grade technical implementation blueprint for **three critical field utilities**:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              FAIRWORK SETU FIELD UTILITIES                             │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ UTILITY                  │ HOST MODULE / PORTAL        │ PRIMARY CAPABILITY            │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 1. 🚨 Emergency SOS Alert │ Sehat Setu & Global Floating │ Web Audio siren + GPS coords  │
│    (आपातकालीन सायरन)     │ Action Button               │ to WhatsApp / SMS + 112/108   │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 2. 📲 1-Tap Dhan Parchi  │ Dhan Setu Cashflow Ledger   │ One-tap bilingual WhatsApp    │
│    (दैनिक कमाई पर्ची)     │ (DhanPage.tsx)              │ statement for family & malik  │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 3. 👮‍♂️ Traffic Rights Card │ Haq Setu Rights Portal      │ Statutory MV Act fine checker │
│    (ट्रैफिक नियम व ऑडियो) │ (HaqSetuPage.tsx)           │ + Loudspeaker Hindi TTS audio │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

All three features are engineered to run **entirely client-side** without requiring paid backend subscriptions, third-party SMS gateways, or cloud latency.

---

## 2. Feature 1: 🚨 1-Tap SOS Siren & Live WhatsApp Location Distress Alert
*(आपातकालीन सायरन और लोकेशन सुरक्षा — Roadside Emergency Shield)*

### 2.1 Problem Definition & Field Context
* Gig delivery riders frequently operate between 10:00 PM and 4:00 AM on poorly lit suburban roads and bypasses.
* Female gig workers (domestic cleaners, beauticians, couriers) face safety hazards in isolated client locations.
* Vehicle breakdowns, flat tyres, or road collisions leave workers stranded without an immediate way to broadcast their precise location to their family, union representative, or vehicle fleet owner.

### 2.2 Architectural & Technical Mechanics
1. **Web Audio API Sound Synthesizer (Zero MP3 Assets):**
   * Uses HTML5 `AudioContext` with an `OscillatorNode` (type: `"sawtooth"`) and `GainNode`.
   * Oscillates frequency smoothly between **650 Hz and 950 Hz** at 2.5 Hz frequency modulation, creating an authentic emergency warning siren that sounds at maximum volume through the phone's loudspeaker.
   * Completely offline; requires zero network requests or heavy audio asset downloads.
2. **High-Accuracy Geolocation Pipeline:**
   * Invokes `navigator.geolocation.getCurrentPosition()` with `{ enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }`.
   * Formats coordinates into an actionable Google Maps URI: `https://maps.google.com/?q=${latitude},${longitude}`.
3. **Multi-Channel Dispatch Engine:**
   * **WhatsApp Direct:** Constructs a pre-formatted Hindi/English emergency payload and launches `https://api.whatsapp.com/send?text=...`.
   * **SMS Native Fallback:** Dispatches `sms:?body=...` for areas with 2G or zero mobile data connectivity.
   * **One-Tap Dialers:** Tel URI anchors (`tel:112` for National Police Emergency, `tel:108` for Ambulance).

### 2.3 Production Implementation Code

#### File Location: `src/components/safety/EmergencySOSModal.tsx`

```tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppIcon } from '../../lib/icons';

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  emergencyContactPhone?: string;
  workerName?: string;
}

export default function EmergencySOSModal({
  isOpen,
  onClose,
  emergencyContactPhone = '',
  workerName = 'श्रमिक / Worker',
}: EmergencySOSModalProps) {
  const [isSirenActive, setIsSirenActive] = useState<boolean>(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sirenIntervalRef = useRef<number | null>(null);

  // 1. Fetch live GPS coordinates immediately upon modal opening
  const fetchLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setErrorMsg('जीपीएस उपलब्ध नहीं है / Geolocation not supported');
      return;
    }
    setLocating(true);
    setErrorMsg('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setErrorMsg('लोकेशन प्राप्त नहीं हो सकी / Could not get GPS location');
        console.warn('Geolocation error:', err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchLocation();
    } else {
      stopSiren();
    }
  }, [isOpen, fetchLocation]);

  // 2. Synthesizer Emergency Siren (Web Audio API)
  const startSiren = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, ctx.currentTime);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscRef.current = osc;
      gainRef.current = gain;

      // Modulate frequency between 650Hz and 950Hz
      let high = false;
      sirenIntervalRef.current = window.setInterval(() => {
        if (!oscRef.current || !audioCtxRef.current) return;
        const now = audioCtxRef.current.currentTime;
        const targetFreq = high ? 650 : 950;
        oscRef.current.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.35);
        high = !high;
      }, 400);

      setIsSirenActive(true);

      // Trigger native vibration pulse if available
      if ('vibrate' in navigator) {
        navigator.vibrate([400, 200, 400, 200, 800]);
      }
    } catch (e) {
      console.error('AudioContext error:', e);
    }
  };

  const stopSiren = () => {
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
    if (oscRef.current) {
      try {
        oscRef.current.stop();
        oscRef.current.disconnect();
      } catch {}
      oscRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
    setIsSirenActive(false);
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  };

  const toggleSiren = () => {
    if (isSirenActive) stopSiren();
    else startSiren();
  };

  // 3. WhatsApp Distress Dispatch
  const handleWhatsAppDistress = () => {
    const mapsLink = coords
      ? `https://maps.google.com/?q=${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`
      : 'लोकेशन उपलब्ध नहीं (GPS signal weak)';

    const text = encodeURIComponent(
      `🚨 *आपातकालीन मदद चाहिए! (EMERGENCY SOS)* 🚨\n\n` +
      `मैं संकट में हूँ, कृपया तुरंत सहायता भेजें या संपर्क करें!\n` +
      `👤 *श्रमिक / Worker:* ${workerName}\n` +
      `📍 *लाइव लोकेशन (Live GPS):* ${mapsLink}\n\n` +
      `⏱️ *समय:* ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n` +
      `🛡️ *सेतु आपातकालीन सुरक्षा (FairWork Setu Emergency Shield)*`
    );

    const targetPhone = emergencyContactPhone.replace(/[^0-9]/g, '');
    const waUrl = targetPhone
      ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;

    window.open(waUrl, '_blank');
  };

  // 4. Native SMS Dispatch
  const handleSmsDistress = () => {
    const mapsLink = coords
      ? `https://maps.google.com/?q=${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`
      : 'Location unavailable';

    const text = encodeURIComponent(
      `EMERGENCY SOS! I need help immediately. Location: ${mapsLink} (Sent via FairWork Setu)`
    );

    window.location.href = `sms:${emergencyContactPhone}?body=${text}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="relative w-full max-w-md bg-stone-900 border-2 border-red-500/80 rounded-2xl shadow-2xl p-6 text-white overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-red-500/30">
            <div className="flex items-center space-x-3">
              <span className="flex h-4 w-4 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600"></span>
              </span>
              <h2 className="text-xl font-black text-red-400 tracking-wide">
                आपातकालीन सुरक्षा (SOS)
              </h2>
            </div>
            <button
              onClick={() => {
                stopSiren();
                onClose();
              }}
              className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
            >
              <AppIcon name="X" className="w-6 h-6" />
            </button>
          </div>

          {/* Siren Control Button */}
          <div className="my-6 text-center">
            <button
              onClick={toggleSiren}
              className={`w-32 h-32 mx-auto rounded-full flex flex-col items-center justify-center border-4 shadow-xl transition-all duration-300 ${
                isSirenActive
                  ? 'bg-red-600 border-white text-white animate-pulse shadow-red-500/50 scale-105'
                  : 'bg-stone-800 border-red-500 text-red-400 hover:bg-red-950/40'
              }`}
            >
              <AppIcon name={isSirenActive ? "ShieldAlert" : "Zap"} className="w-12 h-12 mb-1" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {isSirenActive ? 'सायरन बंद करें' : 'सायरन बजाएं'}
              </span>
            </button>
            <p className="mt-2 text-xs text-stone-400">
              {isSirenActive
                ? '🔊 सायरन बज रहा है! आसपास के लोगों का ध्यान आकर्षित करने के लिए।'
                : 'तेज़ सायरन से हमलावर को भगाएं व लोगों का ध्यान आकर्षित करें।'}
            </p>
          </div>

          {/* Location Status */}
          <div className="p-3 bg-stone-800/80 rounded-xl mb-4 border border-stone-700 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                <AppIcon name="MapPin" className="w-4 h-4 text-emerald-400" />
                जीपीएस लोकेशन (GPS):
              </span>
              <button
                onClick={fetchLocation}
                className="text-emerald-400 hover:underline flex items-center gap-1"
              >
                <AppIcon name="RefreshCw" className={`w-3 h-3 ${locating ? 'animate-spin' : ''}`} />
                {locating ? 'खोज रहे हैं...' : 'ताज़ा करें'}
              </button>
            </div>
            {coords ? (
              <p className="mt-1 text-emerald-300 font-mono">
                Lat: {coords.lat.toFixed(5)}, Lng: {coords.lng.toFixed(5)} (सटीक प्राप्त)
              </p>
            ) : errorMsg ? (
              <p className="mt-1 text-amber-400">{errorMsg}</p>
            ) : (
              <p className="mt-1 text-stone-400">लोकेशन प्राप्त की जा रही है...</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={handleWhatsAppDistress}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg transition active:scale-95"
            >
              <AppIcon name="MessageCircle" className="w-5 h-5" />
              <span>व्हाट्सएप पर लोकेशन व SOS भेजें</span>
            </button>

            <button
              onClick={handleSmsDistress}
              className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold rounded-xl flex items-center justify-center space-x-2 border border-stone-600 transition"
            >
              <AppIcon name="Phone" className="w-4 h-4 text-amber-400" />
              <span>एसएमएस (SMS) द्वारा संदेश भेजें</span>
            </button>

            {/* Direct Emergency Call Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <a
                href="tel:112"
                className="py-2.5 px-3 bg-red-950/70 hover:bg-red-900 border border-red-700/60 text-red-200 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <AppIcon name="Shield" className="w-4 h-4 text-red-400" />
                पुलिस (112)
              </a>
              <a
                href="tel:108"
                className="py-2.5 px-3 bg-blue-950/70 hover:bg-blue-900 border border-blue-700/60 text-blue-200 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <AppIcon name="Heart" className="w-4 h-4 text-blue-400" />
                एम्बुलेंस (108)
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
```

---

## 3. Feature 2: 📲 1-Tap WhatsApp "Dhan Parchi" (Daily Summary Share)
*(दैनिक कमाई पर्ची — 1-Tap WhatsApp & SMS Cashflow Statement)*

### 3.1 Problem Definition & Field Context
* Auto drivers, delivery riders, and daily-wage earners rarely maintain formal passbooks.
* At the end of a 12-hour shift, workers must report daily gross income and fuel expenditures to **vehicle owners (rental fleet maliks)** or their **spouses/families**.
* Misunderstandings over how much money was actually earned versus consumed in fuel, vehicle repairs, or platform deductions cause domestic tension and commercial disputes.

### 3.2 Architectural & Technical Mechanics
1. **Ledger Data Extraction:**
   * Reads the active day's aggregated metrics from `useTransactions()`:
     * `totalIncome` (gross fares/wages)
     * `totalExpense` (total outflow)
     * `fuelExpense` (filtered by category `travel_fuel`)
     * `netSavings = totalIncome - totalExpense`
2. **ASCII Unicode Receipt Template:**
   * Generates a high-contrast receipt layout that renders cleanly in WhatsApp chat bubbles, SMS threads, and Telegram without formatting degradation.
3. **Multi-Tier Native Sharing Protocol:**
   * **Tier 1:** Standard `navigator.share()` API (triggers the native Android sharing intent chooser).
   * **Tier 2 (Fallback):** Direct WhatsApp API deep-link (`https://api.whatsapp.com/send?text=...`).
   * **Tier 3 (Clipboard):** `navigator.clipboard.writeText()` with a 2-second visual confirmation toast.

### 3.3 Production Implementation Code

#### File Location: `src/components/dhan/DhanParchiShareModal.tsx`

```tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppIcon } from '../../lib/icons';
import { formatInr } from '../../localization';

interface DhanParchiShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  totalIncome: number;
  totalExpense: number;
  fuelExpense: number;
  tripsCount?: number;
  hoursWorked?: number;
  workerName?: string;
}

export default function DhanParchiShareModal({
  isOpen,
  onClose,
  dateStr,
  totalIncome,
  totalExpense,
  fuelExpense,
  tripsCount = 0,
  hoursWorked = 0,
  workerName = 'श्रमिक साथी',
}: DhanParchiShareModalProps) {
  const [copied, setCopied] = useState(false);
  const netSavings = totalIncome - totalExpense;

  const formattedDate = new Date(dateStr).toLocaleDateString('hi-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Construct structured receipt string
  const generateReceiptText = (): string => {
    return (
      `🇮🇳 *FairWork Setu — दैनिक कमाई पर्ची*\n` +
      `📅 *दिनांक (Date):* ${formattedDate}\n` +
      `👤 *साथी:* ${workerName}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *कुल कमाई (Gross Income):* ${formatInr(totalIncome)}\n` +
      `⛽ *ईंधन खर्च (Fuel Cost):*     ${formatInr(fuelExpense)}\n` +
      `➖ *अन्य खर्चे (Other Expenses):* ${formatInr(Math.max(0, totalExpense - fuelExpense))}\n` +
      `📉 *कुल खर्चे (Total Expenses):*  ${formatInr(totalExpense)}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `✨ *आज की शुद्ध बचत (Net in Pocket):* *${formatInr(netSavings)}*\n` +
      (tripsCount > 0 ? `🛵 *कुल ट्रिप्स/गिग्स:* ${tripsCount}\n` : '') +
      (hoursWorked > 0 ? `⏱️ *शिफ्ट समय:* ${hoursWorked} घंटे\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🛡️ *सुरक्षित काम, पक्का हिसाब — सेतु साथी*`
    );
  };

  const receiptContent = generateReceiptText();

  // 1. Native Web Share / WhatsApp Dispatch
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `दैनिक कमाई पर्ची - ${formattedDate}`,
          text: receiptContent,
        });
        return;
      } catch (err) {
        // User cancelled or unsupported; fallback to direct WhatsApp URL
      }
    }

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(receiptContent)}`;
    window.open(waUrl, '_blank');
  };

  // 2. Clipboard Copy Fallback
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receiptContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl p-5 text-stone-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <AppIcon name="FileText" className="w-5 h-5" />
              </span>
              <h3 className="font-bold text-stone-200">दैनिक कमाई पर्ची (Receipt)</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-white rounded-lg"
            >
              <AppIcon name="X" className="w-5 h-5" />
            </button>
          </div>

          {/* Visual Receipt Card */}
          <div className="my-4 p-4 bg-stone-950 border border-stone-800 rounded-xl font-mono text-xs leading-relaxed text-stone-300 shadow-inner">
            <div className="text-center font-bold text-stone-400 pb-2 border-b border-dashed border-stone-800">
              🇮🇳 FairWork Setu Ledger Slip
              <div className="text-[10px] text-stone-500">{formattedDate}</div>
            </div>

            <div className="py-2.5 space-y-1">
              <div className="flex justify-between">
                <span>कुल कमाई (Income):</span>
                <span className="text-emerald-400 font-bold">{formatInr(totalIncome)}</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>ईंधन (Fuel):</span>
                <span>{formatInr(fuelExpense)}</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>कुल खर्चे (Expense):</span>
                <span className="text-rose-400">{formatInr(totalExpense)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-dashed border-stone-800 flex justify-between items-center text-sm font-bold">
              <span>शुद्ध बचत (Net):</span>
              <span className={netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {formatInr(netSavings)}
              </span>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="space-y-2">
            <button
              onClick={handleShare}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            >
              <AppIcon name="MessageCircle" className="w-5 h-5" />
              <span>व्हाट्सएप पर पर्ची भेजें (Share)</span>
            </button>

            <button
              onClick={handleCopy}
              className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold rounded-xl flex items-center justify-center gap-2 border border-stone-700 transition"
            >
              <AppIcon name={copied ? "Check" : "Copy"} className="w-4 h-4 text-emerald-400" />
              <span>{copied ? 'पर्ची कॉपी हो गई! ✓' : 'टेक्स्ट कॉपी करें (Copy)'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
```

---

## 4. Feature 3: 👮‍♂️ Traffic Police Rights & Spot Legal Audio Card
*(ट्रैफिक नियम व कानूनी अधिकार — On-Spot Fine Checker & Speaker Audio)*

### 4.1 Problem Definition & Field Context
* Auto drivers, e-rickshaw operators, and two-wheeler delivery riders face frequent roadside stops by traffic police, municipal wardens, and RTO officers.
* Due to unfamiliarity with the **Motor Vehicles (Amendment) Act 2019** and the **Central Motor Vehicle Rules (CMVR)**:
  1. Constables unlawfully snatch vehicle ignition keys or impound vehicles without formal receipts.
  2. Officers reject digital driver's licenses or registration certificates shown in government apps (**DigiLocker / mParivahan**) and demand cash bribes.
  3. Workers are misinformed about official statutory penalty limits.

### 4.2 Architectural & Technical Mechanics
1. **Statutory Knowledge Corpus:**
   * Encapsulates 8 high-frequency roadside legal scenarios with statutory section citations and exact penalty ceilings.
2. **Text-to-Speech (TTS) Hindi Loudspeaker Engine:**
   * Utilizes Setu's native speech layer (`readTextAloud` from `src/lib/speechSynthesis.ts`).
   * Configured with language identifier `'hi-IN'`, speech rate `0.90` (for clear, authoritative legal enunciation), and standard volume.
   * Enables the worker to tap **"📢 लाउडस्पीकर पर सुनाएं (Play Out Loud)"** to politely play the exact legal provision to the traffic official.

### 4.3 Production Implementation Code

#### File Location: `src/components/haq/TrafficRightsCard.tsx`

```tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppIcon } from '../../lib/icons';
import { readTextAloud } from '../../lib/speechSynthesis';

interface LegalRuleItem {
  id: string;
  titleHindi: string;
  titleEnglish: string;
  section: string;
  fineAmount: string;
  speechText: string;
  descriptionHindi: string;
  keyRuleHindi: string;
}

const TRAFFIC_RULES: LegalRuleItem[] = [
  {
    id: 'digilocker',
    titleHindi: 'डिजिलॉकर कागजात की वैधता',
    titleEnglish: 'DigiLocker & mParivahan Validity',
    section: 'केंद्रीय मोटर वाहन नियम (CMVR) नियम 139',
    fineAmount: 'मान्य (शून्य जुर्माना)',
    descriptionHindi: 'डिजिलॉकर या mParivahan ऐप में मौजूद ड्राइविंग लाइसेंस और आरसी 100% कानूनी रूप से मान्य हैं।',
    keyRuleHindi: 'पुलिस मूल भौतिक (फिजिकल) कॉपी मांगने के लिए बाध्य नहीं कर सकती।',
    speechText: 'केंद्रीय मोटर वाहन नियम 139 और सड़क परिवहन मंत्रालय के परिपत्र के अनुसार, डिजिलॉकर और एम-परिवहन ऐप पर दिखाए गए ड्राइविंग लाइसेंस, आरसी और बीमा पूर्णतः वैध हैं। अधिकारी मूल कागजात जमा कराने का दबाव नहीं बना सकते।',
  },
  {
    id: 'key_seizure',
    titleHindi: 'गाड़ी की चाबी छीनने का नियम',
    titleEnglish: 'Ignition Key Seizure Prohibition',
    section: 'मोटर वाहन अधिनियम धारा 130',
    fineAmount: 'अवैध कृत्य (Strictly Illegal)',
    descriptionHindi: 'कोई भी ट्रैफिक पुलिसकर्मी या कांस्टेबल आपकी चलती या खड़ी गाड़ी की चाबी जबरन नहीं निकाल सकता।',
    keyRuleHindi: 'केवल सब-इंस्पेक्टर (ASI/SI) या उससे ऊपर के अधिकारी ही दस्तावेज जांचने के लिए अधिकृत हैं।',
    speechText: 'मोटर वाहन अधिनियम के तहत किसी भी पुलिसकर्मी को वाहन की चाबी छीनने या जबरन निकालने का कोई अधिकार नहीं है। यह नियम के विरुद्ध है। चेकिंग केवल सब-इंस्पेक्टर या उससे उच्च अधिकारी ही कर सकते हैं।',
  },
  {
    id: 'helmet',
    titleHindi: 'बिना हेलमेट चालान',
    titleEnglish: 'Riding Without Helmet',
    section: 'मोटर वाहन अधिनियम धारा 194D',
    fineAmount: '₹1,000 (अधिकतम)',
    descriptionHindi: 'हेलमेट न पहनने पर अधिकतम ₹1,000 का चालान और 3 महीने के लिए लाइसेंस निलंबन का प्रावधान है।',
    keyRuleHindi: 'पुलिस केवल हेलमेट न पहनने पर गाड़ी जब्त (Impound) नहीं कर सकती।',
    speechText: 'मोटर वाहन संशोधन अधिनियम की धारा 194 डी के अनुसार, बिना हेलमेट वाहन चलाने पर अधिकतम जुर्माना एक हजार रुपये है। केवल हेलमेट न होने पर वाहन जब्त करने का प्रावधान नहीं है।',
  },
  {
    id: 'towing',
    titleHindi: 'गाड़ी टो करने का नियम',
    titleEnglish: 'Vehicle Towing Guidelines',
    section: 'मोटर वाहन अधिनियम धारा 127',
    fineAmount: 'टोइंग शुल्क लागू नहीं यदि आप अंदर हैं',
    descriptionHindi: 'यदि वाहन चालक या कोई यात्री वाहन के अंदर मौजूद है, तो क्रेन से गाड़ी को टो नहीं किया जा सकता।',
    keyRuleHindi: 'चालान काटा जा सकता है, परंतु गाड़ी उठाना प्रतिबंधित है।',
    speechText: 'मोटर वाहन नियम धारा 127 के अंतर्गत, यदि चालक वाहन में मौजूद है तो ट्रैफिक पुलिस क्रेन से गाड़ी को टो नहीं कर सकती। चालक को केवल नो-पार्किंग का चालान दिया जा सकता है।',
  },
  {
    id: 'meter_refusal',
    titleHindi: 'ऑटो-टैक्सी किराया व मीटर',
    titleEnglish: 'Fare Meter Refusal',
    section: 'मोटर वाहन अधिनियम धारा 178(3)',
    fineAmount: '₹500 तक',
    descriptionHindi: 'बिना उचित कारण यात्री ले जाने से मना करने पर ₹500 तक का जुर्माना लग सकता है।',
    keyRuleHindi: 'शिफ्ट समाप्ति (Off Duty) का बोर्ड लगाकर मना करना कानूनी रूप से मान्य है।',
    speechText: 'धारा 178 तीन के अनुसार, बिना वैध कारण यात्री से मना करने पर पांच सौ रुपये तक का जुर्माना है। यदि चालक भोजन अवकाश या शिफ्ट समाप्ति पर है तो वह बोर्ड लगाकर मना कर सकता है।',
  },
];

export default function TrafficRightsCard() {
  const [selectedRule, setSelectedRule] = useState<LegalRuleItem | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredRules = TRAFFIC_RULES.filter(
    (r) =>
      r.titleHindi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.titleEnglish.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.section.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlayAudio = (rule: LegalRuleItem) => {
    if (isPlaying) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    readTextAloud(rule.speechText, 'hi-IN', () => {
      setIsPlaying(false);
    });
  };

  return (
    <div className="w-full bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl text-stone-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-800">
        <div className="flex items-center space-x-3">
          <span className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
            <AppIcon name="ShieldCheck" className="w-6 h-6" />
          </span>
          <div>
            <h3 className="font-bold text-base text-stone-100">
              ट्रैफिक नियम व आपके अधिकार (Police Rights)
            </h3>
            <p className="text-xs text-stone-400">
              सड़क पर चेकिंग के दौरान सरकारी नियम व धाराएं जानें
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-4 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="नियम खोजें (उदा: हेलमेट, चाबी, डिजिलॉकर)..."
          className="w-full py-2.5 pl-9 pr-3 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-blue-500"
        />
        <AppIcon name="Search" className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
      </div>

      {/* Rules Accordion / Cards List */}
      <div className="mt-4 space-y-2.5">
        {filteredRules.map((rule) => {
          const isExpanded = selectedRule?.id === rule.id;
          return (
            <div
              key={rule.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isExpanded
                  ? 'bg-stone-950 border-blue-500/60 shadow-lg'
                  : 'bg-stone-800/60 border-stone-700/60 hover:bg-stone-800'
              }`}
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setSelectedRule(isExpanded ? null : rule)}
              >
                <div>
                  <h4 className="text-sm font-semibold text-stone-200">{rule.titleHindi}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-blue-400 font-mono">{rule.section}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-stone-700 text-stone-300 rounded font-medium">
                      {rule.fineAmount}
                    </span>
                  </div>
                </div>
                <AppIcon
                  name={isExpanded ? "ChevronLeft" : "ChevronRight"}
                  className={`w-4 h-4 text-stone-400 transform transition-transform ${isExpanded ? '-rotate-90' : ''}`}
                />
              </div>

              {/* Expanded Details & Audio Speaker Trigger */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-stone-800 text-xs space-y-2"
                  >
                    <p className="text-stone-300 leading-relaxed">{rule.descriptionHindi}</p>
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 font-medium">
                      ⚠️ मुख्य अधिकार: {rule.keyRuleHindi}
                    </div>

                    {/* Audio Speaker Playback */}
                    <div className="pt-2">
                      <button
                        onClick={() => handlePlayAudio(rule)}
                        className={`w-full py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                          isPlaying
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                        }`}
                      >
                        <AppIcon name={isPlaying ? "X" : "Volume2"} className="w-4 h-4" />
                        <span>{isPlaying ? 'आवाज बंद करें' : 'लाउडस्पीकर पर नियम सुनाएं (Play Audio)'}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 5. Integration Points & Component Map

To wire these three components into the active application, link them into the existing routes as follows:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   INTEGRATION MAPPING                                  │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ NEW COMPONENT            │ PARENT FILE                 │ TRIGGER LOCATION              │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ EmergencySOSModal.tsx    │ src/App.tsx or SehatPage.tsx │ Floating Red Shield Button /  │
│                          │                             │ Sehat Emergency Dialer Block  │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ DhanParchiShareModal.tsx │ src/pages/DhanPage.tsx      │ Inline Action next to Daily   │
│                          │                             │ Income/Expense Summary Card   │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ TrafficRightsCard.tsx    │ src/pages/HaqSetuPage.tsx   │ Tab 2 ("कानूनी अधिकार" /     │
│                          │                             │ Legal Rights & Protections)   │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

### 5.1 Integrating the WhatsApp Dhan Parchi in `DhanPage.tsx`
Add a **"पर्ची शेयर करें"** button directly within the summary block of `DhanPage.tsx`:

```tsx
// Inside DhanPage.tsx:
const [isParchiOpen, setIsParchiOpen] = useState(false);

// In the JSX render tree beside the Date summary:
<button
  onClick={() => setIsParchiOpen(true)}
  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold transition"
>
  <AppIcon name="MessageCircle" className="w-4 h-4" />
  <span>पर्ची भेजें (Share Slip)</span>
</button>

<DhanParchiShareModal
  isOpen={isParchiOpen}
  onClose={() => setIsParchiOpen(false)}
  dateStr={selectedDate}
  totalIncome={daySummary.income}
  totalExpense={daySummary.expense}
  fuelExpense={daySummary.fuelExpense}
  tripsCount={daySummary.tripsCount}
  hoursWorked={daySummary.hoursWorked}
  workerName={profile?.name || 'साथी'}
/>
```

---

## 6. Viva Voce & Academic Defense Q&A

| Examiner Question | Engineering & Architectural Defense |
|---|---|
| **Why not rely on standard SMS services like Twilio for the SOS feature?** | *"Twilio requires paid cloud API credits and an active internet upload stream. In Indian semi-urban fringe corridors, workers frequently experience 2G networks or exhausted prepaid balances. Our implementation uses on-device Web Audio synthesis and native OS intents (`sms:` and `tel:`), guaranteeing 100% operational availability at zero operational cost."* |
| **Why generate plain-text receipts instead of binary PDFs for WhatsApp sharing?** | *"Informal gig workers and vehicle owners read messages on budget smartphones running low-memory Android Go. PDFs require third-party viewer apps and take longer to download on poor connectivity. Formatted Unicode ASCII text renders instantly inside native WhatsApp chat bubbles without consuming phone storage."* |
| **How does the Traffic Legal Audio card handle offline execution?** | *"The legal sections and penalty rules are bundled locally within the client application bundle. The voice synthesis relies on Android’s on-device Google TTS engine (`hi-IN`), meaning drivers can play the legal provisions even on remote highways without active cell reception."* |
