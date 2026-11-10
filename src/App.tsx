import React, { useState } from 'react';
import { IndianRupee, MessageCircle, Sparkles, BookOpen, Store, CheckCircle } from 'lucide-react';
import { KiranaVoiceBilling } from './components/KiranaVoiceBilling';
import { RateListModal } from './components/RateListModal';

export default function App() {
  const [isRateModalOpen, setIsRateModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#0A0D14] text-stone-100 font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0E121B]/95 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-950/60 font-black text-lg">
              📙
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base md:text-lg text-white tracking-tight">
                  बोलके बिल
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                  ⚡ Gnani.ai Prisma STT
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-medium">
                Hinglish Voice Billing & Khata for Kirana Stores
              </p>
            </div>
          </div>

          {/* Action buttons: Rate list & WhatsApp quick helper */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-lg border border-stone-700 transition-colors cursor-pointer"
              title="Configure Kirana item rates"
            >
              <IndianRupee className="w-3.5 h-3.5 text-orange-400" />
              <span>रेट लिस्ट (Rates)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main App Content - Pure Kirana Voice Billing & Khata Ledger */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <KiranaVoiceBilling
          initialPrompt="2 kilo aata, 3 kilo cheeni, Sharma ji ke khaate me likh do"
          onOpenRateList={() => setIsRateModalOpen(true)}
        />
      </main>

      {/* Rate List Modal */}
      <RateListModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-12 border-t border-stone-800/80 bg-[#0B0E16] py-6 text-stone-500 text-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-orange-500 font-bold">बोलके बिल 📙</span>
            <span>— Indian Kirana Voice Billing, WhatsApp Invoicing & Bahi-Khata</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-stone-400 justify-center">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Gnani.ai Prisma STT Active
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <MessageCircle className="w-3 h-3 fill-current" />
              WhatsApp Enabled
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
