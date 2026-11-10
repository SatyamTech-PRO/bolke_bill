import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Trash2,
  CheckCircle,
  Share2,
  Printer,
  Plus,
  Minus,
  UserCheck,
  AlertCircle,
  RefreshCw,
  X,
  FileText,
  IndianRupee,
  Sparkles,
  Phone,
  MessageCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BillItem, BillRecord, CustomerKhata } from '../types';

interface KiranaVoiceBillingProps {
  initialPrompt?: string;
  onOpenRateList?: () => void;
}

export const KiranaVoiceBilling: React.FC<KiranaVoiceBillingProps> = ({
  initialPrompt = '',
  onOpenRateList,
}) => {
  const [inputText, setInputText] = useState<string>(initialPrompt || '');
  const [transcript, setTranscript] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribingGnani, setIsTranscribingGnani] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [activeEngine, setActiveEngine] = useState<string>('Gnani.ai Prisma v3.0');
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  // Current working bill
  const [billItems, setBillItems] = useState<BillItem[]>([
    { id: '1', name: 'Atta', hindiName: 'आटा', quantity: 2, unit: 'kg', rate: 35, total: 70 },
    { id: '2', name: 'Sugar', hindiName: 'चीनी', quantity: 3, unit: 'kg', rate: 42, total: 126 },
  ]);
  const [customerName, setCustomerName] = useState<string>('Sharma ji');
  const [customerPhone, setCustomerPhone] = useState<string>('9876543210');
  const [isKhata, setIsKhata] = useState<boolean>(true);
  const [spokenSummary, setSpokenSummary] = useState<string>(
    'आपका बिल है: 2 किलो आटा, 3 किलो चीनी। कुल ₹196। शर्मा जी के खाते में जोड़ दिया।'
  );

  // Customer Khatas state
  const [khatas, setKhatas] = useState<CustomerKhata[]>([
    {
      id: 'khata-1',
      customerName: 'Sharma ji',
      phone: '9876543210',
      currentBalance: 196,
      lastUpdated: Date.now(),
      bills: [
        {
          id: 'bill-1',
          timestamp: Date.now() - 3600000,
          items: [
            { id: '1', name: 'Atta', hindiName: 'आटा', quantity: 2, unit: 'kg', rate: 35, total: 70 },
            { id: '2', name: 'Sugar', hindiName: 'चीनी', quantity: 3, unit: 'kg', rate: 42, total: 126 },
          ],
          grandTotal: 196,
          customerName: 'Sharma ji',
          isKhata: true,
          transcript: '2 kilo aata, 3 kilo cheeni, Sharma ji ke khaate me likh do',
          status: 'saved',
        },
      ],
    },
    {
      id: 'khata-2',
      customerName: 'Verma ji',
      phone: '9812345678',
      currentBalance: 450,
      lastUpdated: Date.now() - 86400000,
      bills: [
        {
          id: 'bill-2',
          timestamp: Date.now() - 86400000,
          items: [
            { id: '3', name: 'Mustard Oil', hindiName: 'सरसों तेल', quantity: 2, unit: 'L', rate: 155, total: 310 },
            { id: '4', name: 'Toor Dal', hindiName: 'तूर दाल', quantity: 1, unit: 'kg', rate: 140, total: 140 },
          ],
          grandTotal: 450,
          customerName: 'Verma ji',
          isKhata: true,
          transcript: '2 litre sarson tel, 1 kilo toor dal Verma ji khata',
          status: 'saved',
        },
      ],
    },
    {
      id: 'khata-3',
      customerName: 'Gupta ji',
      phone: '9900112233',
      currentBalance: 85,
      lastUpdated: Date.now() - 172800000,
      bills: [
        {
          id: 'bill-3',
          timestamp: Date.now() - 172800000,
          items: [
            { id: '5', name: 'Chai Patti', hindiName: 'चाय पत्ती', quantity: 1, unit: 'pack', rate: 55, total: 55 },
            { id: '6', name: 'Bread', hindiName: 'ब्रेड', quantity: 1, unit: 'packet', rate: 30, total: 30 },
          ],
          grandTotal: 85,
          customerName: 'Gupta ji',
          isKhata: true,
          transcript: '1 chai patti, 1 packet bread Gupta ji',
          status: 'saved',
        },
      ],
    },
  ]);

  // Modal states
  const [deleteKhataTarget, setDeleteKhataTarget] = useState<CustomerKhata | null>(null);
  const [viewKhataTarget, setViewKhataTarget] = useState<CustomerKhata | null>(null);
  const [showAddKhataModal, setShowAddKhataModal] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');

  // Audio references for Gnani MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (initialPrompt) {
      setInputText(initialPrompt);
    }
  }, [initialPrompt]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  const grandTotal = billItems.reduce((acc, item) => acc + (item.total || 0), 0);

  // START RECORDING with Gnani.ai Prisma STT capture
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });
        await processAudioWithGnani(audioBlob);

        // Stop all audio tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
      };

      mediaRecorder.start(250); // Slice chunks every 250ms
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      showToast('Recording... Bolo apna bill (Gnani.ai Prisma listening)', 'info');

      // Concurrent live interim transcript preview via Web Speech API
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const sr = new SpeechRecognition();
          sr.lang = 'hi-IN';
          sr.interimResults = true;
          sr.continuous = true;
          sr.onresult = (ev: any) => {
            let liveText = '';
            for (let i = ev.resultIndex; i < ev.results.length; ++i) {
              liveText += ev.results[i][0].transcript;
            }
            if (liveText.trim()) {
              setTranscript(liveText);
              setInputText(liveText);
            }
          };
          speechRecognitionRef.current = sr;
          sr.start();
        } catch (e) {
          // ignore
        }
      }
    } catch (err: any) {
      console.error('Mic access error:', err);
      setIsRecording(false);
      showToast('Microphone access blocked. You can type or use the quick sample chips.', 'error');
    }
  };

  // STOP RECORDING
  const stopRecording = () => {
    setIsRecording(false);
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Process captured audio with Gnani.ai Prisma STT endpoint
  const processAudioWithGnani = async (blob: Blob) => {
    setIsTranscribingGnani(true);
    showToast('Transcribing with Gnani.ai Prisma v3.0 STT...', 'info');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        if (!base64Audio) {
          setIsTranscribingGnani(false);
          return;
        }

        const res = await fetch('/api/transcribe-gnani', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: blob.type || 'audio/webm',
            languageCode: 'hi-IN',
          }),
        });

        const data = await res.json();
        setIsTranscribingGnani(false);

        if (data.success && data.transcript) {
          const cleanTranscript = data.transcript.trim();
          setTranscript(cleanTranscript);
          setInputText(cleanTranscript);
          setActiveEngine(data.engine || 'Gnani.ai Prisma STT');
          showToast(`⚡ Gnani Prisma: "${cleanTranscript}"`, 'success');
          parseBillText(cleanTranscript);
        } else if (inputText.trim()) {
          parseBillText(inputText);
        }
      };
    } catch (err: any) {
      console.error('Gnani STT error:', err);
      setIsTranscribingGnani(false);
      if (inputText.trim()) {
        parseBillText(inputText);
      }
    }
  };

  // Parse bill into items
  const parseBillText = async (textToParse: string) => {
    const text = textToParse.trim();
    if (!text) return;

    setIsParsing(true);
    setTranscript(text);

    try {
      const res = await fetch('/api/parse-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        const formattedItems = data.items.map((it: any, idx: number) => ({
          id: String(idx + 1),
          name: it.name || 'Item',
          hindiName: it.hindiName || '',
          quantity: it.quantity || 1,
          unit: it.unit || 'unit',
          rate: it.rate || 0,
          total: Number((it.quantity * it.rate).toFixed(2)),
        }));
        setBillItems(formattedItems);
        if (data.customerName) {
          setCustomerName(data.customerName);
          const existing = khatas.find(
            (k) => k.customerName.toLowerCase() === data.customerName.toLowerCase()
          );
          if (existing?.phone) setCustomerPhone(existing.phone);
        }
        setIsKhata(data.isKhata ?? false);
        setSpokenSummary(data.spokenSummaryHindi || '');
        showToast(`${formattedItems.length} items found. Total ₹${data.grandTotal}`, 'success');
      } else {
        fallbackClientParser(text);
      }
    } catch (error) {
      console.warn('Falling back to local smart parser:', error);
      fallbackClientParser(text);
    } finally {
      setIsParsing(false);
    }
  };

  // Client parser backup
  const fallbackClientParser = (text: string) => {
    const lower = text.toLowerCase();
    const items: BillItem[] = [];

    if (lower.includes('aata') || lower.includes('atta') || lower.includes('आटा')) {
      const match = lower.match(/(\d+(?:\.\d+)?)\s*(?:kilo|kg|किलो)?\s*(?:aata|atta|आटा)/);
      const qty = match ? parseFloat(match[1]) : 2;
      items.push({ id: '1', name: 'Atta', hindiName: 'आटा', quantity: qty, unit: 'kg', rate: 35, total: qty * 35 });
    }
    if (lower.includes('cheeni') || lower.includes('chini') || lower.includes('sugar') || lower.includes('चीनी')) {
      const match = lower.match(/(\d+(?:\.\d+)?)\s*(?:kilo|kg|किलो)?\s*(?:cheeni|chini|sugar|चीनी)/);
      const qty = match ? parseFloat(match[1]) : 3;
      items.push({ id: '2', name: 'Sugar', hindiName: 'चीनी', quantity: qty, unit: 'kg', rate: 42, total: qty * 42 });
    }
    if (lower.includes('parle') || lower.includes('biscuit')) {
      const match = lower.match(/(\d+(?:\.\d+)?)\s*(?:packet|pack)?\s*(?:parle|parle-g|biscuit)/);
      const qty = match ? parseFloat(match[1]) : 5;
      items.push({ id: '3', name: 'Parle-G', hindiName: 'पारले-जी', quantity: qty, unit: 'packet', rate: 10, total: qty * 10 });
    }
    if (lower.includes('tel') || lower.includes('oil') || lower.includes('sarson')) {
      const match = lower.match(/(\d+(?:\.\d+)?)\s*(?:litre|l|लीटर)?\s*(?:sarson\s*tel|tel|oil)/);
      const qty = match ? parseFloat(match[1]) : 1;
      items.push({ id: '4', name: 'Mustard Oil', hindiName: 'सरसों तेल', quantity: qty, unit: 'L', rate: 155, total: qty * 155 });
    }

    if (items.length === 0) {
      items.push(
        { id: '1', name: 'Atta', hindiName: 'आटा', quantity: 2, unit: 'kg', rate: 35, total: 70 },
        { id: '2', name: 'Sugar', hindiName: 'चीनी', quantity: 3, unit: 'kg', rate: 42, total: 126 }
      );
    }

    let detectedCustomer = 'Sharma ji';
    let isCredit = true;
    if (lower.includes('verma') || lower.includes('वर्मा')) detectedCustomer = 'Verma ji';
    if (lower.includes('gupta') || lower.includes('गुप्ता')) detectedCustomer = 'Gupta ji';

    const total = items.reduce((s, it) => s + it.total, 0);
    setBillItems(items);
    setCustomerName(detectedCustomer);
    setIsKhata(isCredit);
    const summary = `आपका बिल है: ${items.map((i) => `${i.quantity} ${i.unit} ${i.name}`).join(', ')}। कुल ₹${total}। ${
      isCredit ? `${detectedCustomer} के खाते में जोड़ दिया।` : 'कैश बिल।'
    }`;
    setSpokenSummary(summary);
    showToast(`${items.length} items found. Total ₹${total}`, 'success');
  };

  // Read Bill Aloud in Hindi
  const readBillAloud = async () => {
    setIsSpeaking(true);
    showToast('Generating speech...', 'info');

    const textToSpeak =
      spokenSummary ||
      `आपका बिल है: ${billItems.map((i) => `${i.quantity} ${i.unit} ${i.name}`).join(', ')}। कुल ${grandTotal} रुपये। ${
        isKhata ? `${customerName} के खाते में जोड़ दिया।` : ''
      }`;

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, voiceName: 'Kore' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioUrl) {
          if (audioPlayerRef.current) {
            audioPlayerRef.current.src = data.audioUrl;
            audioPlayerRef.current.play();
          }
          setIsSpeaking(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Server TTS fallback to Web Speech:', err);
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
      showToast(textToSpeak, 'info');
    }
  };

  // Confirm and Save bill to Khata Ledger
  const confirmAndSaveBill = () => {
    if (billItems.length === 0) {
      showToast('Bill is empty. Please add items.', 'error');
      return;
    }

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FF6B00', '#10B981', '#F59E0B'],
      });
    } catch (e) {
      // ignore
    }

    const newBill: BillRecord = {
      id: `bill-${Date.now()}`,
      timestamp: Date.now(),
      items: [...billItems],
      grandTotal,
      customerName: customerName || 'Walk-in',
      isKhata,
      transcript: transcript || inputText,
      spokenSummaryHindi: spokenSummary,
      status: 'saved',
    };

    if (isKhata && customerName) {
      setKhatas((prev) => {
        const existingIdx = prev.findIndex(
          (k) => k.customerName.toLowerCase().trim() === customerName.toLowerCase().trim()
        );
        if (existingIdx >= 0) {
          const updated = [...prev];
          const k = updated[existingIdx];
          updated[existingIdx] = {
            ...k,
            currentBalance: Number((k.currentBalance + grandTotal).toFixed(2)),
            bills: [newBill, ...k.bills],
            lastUpdated: Date.now(),
          };
          return updated;
        } else {
          const newKhata: CustomerKhata = {
            id: `khata-${Date.now()}`,
            customerName: customerName.trim(),
            phone: customerPhone || '',
            currentBalance: grandTotal,
            bills: [newBill],
            lastUpdated: Date.now(),
          };
          return [newKhata, ...prev];
        }
      });
      showToast(`Bill of ₹${grandTotal} posted to ${customerName}'s Khata!`, 'success');
    } else {
      showToast(`Cash bill of ₹${grandTotal} saved!`, 'success');
    }

    readBillAloud();
  };

  const clearBill = () => {
    setBillItems([]);
    setInputText('');
    setTranscript('');
    setCustomerName('Sharma ji');
    setIsKhata(true);
    showToast('Bill cleared', 'info');
  };

  const updateQty = (id: string, delta: number) => {
    setBillItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = Math.max(0.1, Number((item.quantity + delta).toFixed(2)));
            return {
              ...item,
              quantity: newQty,
              total: Number((newQty * item.rate).toFixed(2)),
            };
          }
          return item;
        })
        .filter((it) => it.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setBillItems((prev) => prev.filter((i) => i.id !== id));
  };

  // WHATSAPP BILL SHARING: Prepares a professional Hindi/English Kirana receipt for WhatsApp
  const shareCurrentBillWhatsApp = (phone?: string) => {
    const targetPhone = phone || customerPhone || '';
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const itemsText = billItems
      .map(
        (it, idx) =>
          `🔹 *${idx + 1}. ${it.name}${it.hindiName ? ` (${it.hindiName})` : ''}*\n    ${it.quantity} ${it.unit} x ₹${it.rate} = *₹${it.total.toFixed(2)}*`
      )
      .join('\n');

    const message = `🛍️ *किराना रसीद / KIRANA STORE RECEIPT*\n*तारीख / Date:* ${dateStr}\n*ग्राहक / Customer:* ${customerName}\n----------------------------------\n${itemsText}\n----------------------------------\n💰 *कुल योग / GRAND TOTAL: ₹${grandTotal.toFixed(2)}*\n${
      isKhata
        ? `📝 *खाते में दर्ज (Added to Khata)*\nकृपया समय पर भुगतान करें। धन्यवाद!`
        : `✅ *नगद भुगतान (Paid in Cash)*\nधन्यवाद, फिर पधारें! 🙏`
    }\n\n_Sent via बोलके बिल 📙 - Hinglish Kirana Voice Billing_`;

    const encoded = encodeURIComponent(message);
    const cleanPhone = targetPhone.replace(/\D/g, '');
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(url, '_blank');
  };

  // WHATSAPP KHATA REMINDER: For sending Khata balances to customers
  const sendKhataReminderWhatsApp = (khata: CustomerKhata) => {
    const message = `🙏 *नमस्ते ${khata.customerName} जी,*\n\nआपकी दुकान का बही-खाता बकाया:\n💰 *कुल बकाया राशि (Outstanding Balance): ₹${khata.currentBalance.toFixed(2)}*\n\nकृपया सुविधा अनुसार UPI या दुकान पर आकर भुगतान कर दें।\nधन्यवाद! 🛒\n\n_बोलके बिल 📙 किराना बही-खाता_`;
    const cleanPhone = (khata.phone || '').replace(/\D/g, '');
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const confirmDeleteKhata = () => {
    if (!deleteKhataTarget) return;
    setKhatas((prev) => prev.filter((k) => k.id !== deleteKhataTarget.id));
    showToast(`Deleted ${deleteKhataTarget.customerName}'s khata.`, 'info');
    setDeleteKhataTarget(null);
  };

  const resetDemoData = () => {
    setKhatas([
      {
        id: 'khata-1',
        customerName: 'Sharma ji',
        phone: '9876543210',
        currentBalance: 196,
        lastUpdated: Date.now(),
        bills: [
          {
            id: 'bill-1',
            timestamp: Date.now() - 3600000,
            items: [
              { id: '1', name: 'Atta', hindiName: 'आटा', quantity: 2, unit: 'kg', rate: 35, total: 70 },
              { id: '2', name: 'Sugar', hindiName: 'चीनी', quantity: 3, unit: 'kg', rate: 42, total: 126 },
            ],
            grandTotal: 196,
            customerName: 'Sharma ji',
            isKhata: true,
            transcript: '2 kilo aata, 3 kilo cheeni, Sharma ji ke khaate me likh do',
            status: 'saved',
          },
        ],
      },
    ]);
    showToast('Demo data reset to fresh Kirana state.', 'info');
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Top Green Notification Toast */}
      {notification && (
        <div
          className={`px-4 py-2.5 rounded-lg border text-sm font-semibold flex items-center justify-between transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : notification.type === 'error'
              ? 'bg-red-950/80 border-red-500/50 text-red-300'
              : 'bg-stone-800 border-stone-700 text-stone-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-stone-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-[#121620] border border-stone-800 rounded-2xl p-5 md:p-7 shadow-2xl space-y-7 text-stone-200">
        {/* Header Branding */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              बोलके बिल 📙
            </h1>
          </div>
          <p className="text-xs md:text-sm text-stone-400 font-medium">
            Hinglish Voice Billing for Kirana Stores
          </p>

          {/* Gnani.ai Prisma STT Active Indicator Badge */}
          <div className="pt-1 flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Listening Engine: <strong>Gnani.ai Prisma v3.0 (Vachana)</strong>
            </span>
          </div>
        </div>

        {/* SECTION 1: BOLO APNA BILL */}
        <div className="bg-[#191F2D] border border-stone-800 rounded-xl p-5 md:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
              <Mic className="w-4 h-4" />
              <span>1. Bolo Apna Bill</span>
            </div>
            {onOpenRateList && (
              <button
                onClick={onOpenRateList}
                className="text-[11px] text-stone-400 hover:text-orange-400 transition-colors flex items-center gap-1"
              >
                <IndianRupee className="w-3 h-3 text-orange-400" />
                <span>Rate List</span>
              </button>
            )}
          </div>

          {/* Central Microphone Button with Pulse Wave */}
          <div className="flex flex-col items-center justify-center py-2 space-y-3">
            <div className="relative">
              {isRecording && (
                <>
                  <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping" />
                  <div className="absolute -inset-3 rounded-full border-2 border-orange-500/50 animate-pulse" />
                </>
              )}
              {isTranscribingGnani && (
                <div className="absolute -inset-2 rounded-full border-2 border-emerald-500/60 animate-spin" />
              )}
              <button
                onClick={toggleRecording}
                disabled={isTranscribingGnani}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white transition-all shadow-xl cursor-pointer ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-500 ring-4 ring-orange-500/50 scale-105'
                    : isTranscribingGnani
                    ? 'bg-emerald-700'
                    : 'bg-[#FF6B00] hover:bg-[#ff7b1a] shadow-orange-950/60'
                }`}
                title={isRecording ? 'Tap to stop recording' : 'Tap to speak via Gnani.ai Prisma'}
              >
                {isTranscribingGnani ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            </div>

            <p className="text-xs text-stone-400 font-medium">
              {isTranscribingGnani ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5 animate-pulse">
                  ⚡ Gnani.ai Prisma processing audio...
                </span>
              ) : isRecording ? (
                <span className="text-orange-400 font-bold flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Recording... bolo apna bill (Tap to finish)
                </span>
              ) : (
                'Tap to record (Gnani.ai Prisma STT)'
              )}
            </p>
          </div>

          {/* Text Input & Parse Button */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && parseBillText(inputText)}
                placeholder="boliye ya type kijiye... e.g. '2 kilo cheeni, teen Parle-G, Sharma ji ke khate mein'"
                className="flex-1 bg-[#10141D] border border-stone-700/80 rounded-lg px-3.5 py-2.5 text-xs md:text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-orange-500"
              />
              <button
                onClick={() => parseBillText(inputText)}
                disabled={isParsing || !inputText.trim()}
                className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isParsing ? (
                  <span>Parsing...</span>
                ) : (
                  <>
                    <span>Parse</span>
                    <span>👉</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Demo Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-stone-500 font-medium">Try speaking:</span>
              {[
                '2 kilo aata, 3 kilo cheeni, Sharma ji ke khaate me likh do',
                '5 packet Parle-G, 1 litre Sarson tel, 2 Dettol soap',
                '1 kg daal, aadha kilo chai patti, cash bill',
                '4 packet Maggi, 2 packet bread, Verma ji khata',
              ].map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(sample);
                    parseBillText(sample);
                  }}
                  className="px-2.5 py-1 text-[11px] rounded bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-700/60 transition-colors cursor-pointer"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 2: TRANSCRIPT */}
        <div className="bg-[#191F2D] border border-stone-800 rounded-xl p-4 md:p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>2. Transcript</span>
            </div>
            {activeEngine && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                {activeEngine}
              </span>
            )}
          </div>
          <div className="bg-[#10141D] rounded-lg p-3 border border-stone-800/80 min-h-[44px] flex items-center justify-between gap-3">
            <p className="text-xs md:text-sm text-stone-200 font-mono">
              {transcript || inputText || (
                <span className="text-stone-500 italic">Aapki aawaz yahan dikhegi...</span>
              )}
            </p>
            {transcript && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(transcript);
                  showToast('Transcript copied!', 'info');
                }}
                className="text-[10px] text-stone-400 hover:text-white px-2 py-1 bg-stone-800 rounded shrink-0"
              >
                Copy
              </button>
            )}
          </div>
        </div>

        {/* SECTION 3: BILL PREVIEW */}
        <div className="bg-[#191F2D] border border-stone-800 rounded-xl p-4 md:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
              <span>🧾</span>
              <span>3. Bill Preview</span>
            </div>
            {customerName && (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-orange-600/20 text-orange-300 border border-orange-500/30 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  {customerName} {isKhata ? '(Khata / Udhaar)' : '(Cash)'}
                </span>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-stone-800">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-[#10141D] text-stone-400 text-[10px] uppercase font-bold tracking-wider border-b border-stone-800">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Item</th>
                  <th className="py-2.5 px-3">Qty</th>
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3">Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  <th className="py-2.5 px-2 text-center">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-medium">
                {billItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-stone-500 italic">
                      No items yet. Speak or type items above.
                    </td>
                  </tr>
                ) : (
                  billItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-stone-800/30">
                      <td className="py-2.5 px-3 text-stone-500 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 text-white font-semibold">
                        {item.name}
                        {item.hindiName && (
                          <span className="text-stone-400 font-normal ml-1 text-[11px]">
                            ({item.hindiName})
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-stone-400">{item.unit}</td>
                      <td className="py-2.5 px-3 font-mono">₹{item.rate}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-white font-mono">
                        ₹{item.total.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="p-1 hover:bg-stone-700 text-stone-400 hover:text-white rounded"
                            title="Add 1"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="p-1 hover:bg-stone-700 text-stone-400 hover:text-white rounded"
                            title="Subtract 1"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 hover:bg-red-950 text-stone-500 hover:text-red-400 rounded"
                            title="Delete item"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Grand Total Bar */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#10141D] border border-stone-800">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Grand Total
            </span>
            <span className="text-xl md:text-2xl font-black text-white font-mono tracking-tight">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>

          {/* Action Buttons Row with WHATSAPP OPTION prominently featured */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              onClick={confirmAndSaveBill}
              disabled={billItems.length === 0}
              className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF6B00] hover:bg-[#ff7b1a] disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-lg shadow-orange-950/40 transition-all cursor-pointer"
            >
              <span>🤝</span>
              <span>Confirm and Save</span>
            </button>

            {/* WHATSAPP OPTION (Never remove - prominent WhatsApp bill sharing) */}
            <button
              onClick={() => shareCurrentBillWhatsApp()}
              disabled={billItems.length === 0}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
              title="Share Bill Receipt on WhatsApp"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>WhatsApp Bill</span>
            </button>

            <button
              onClick={readBillAloud}
              disabled={isSpeaking || billItems.length === 0}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-200 text-xs font-semibold rounded-lg border border-stone-700 transition-colors cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-orange-400" />
              <span>{isSpeaking ? 'Bol rahe hain...' : 'Read Bill Aloud'}</span>
            </button>

            <button
              onClick={clearBill}
              className="inline-flex items-center justify-center gap-1 px-3 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs font-semibold rounded-lg border border-stone-700 transition-colors cursor-pointer"
              title="Clear bill"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          <audio ref={audioPlayerRef} className="hidden" controls />
        </div>

        {/* SECTION 4: KHATA (CREDIT LEDGER) */}
        <div className="bg-[#191F2D] border border-stone-800 rounded-xl p-4 md:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
              <span>📙</span>
              <span>4. Khata (Credit Ledger)</span>
            </div>
            <button
              onClick={() => setShowAddKhataModal(true)}
              className="text-[11px] font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add Customer Khata</span>
            </button>
          </div>

          {/* Customer Cards List */}
          <div className="space-y-2.5">
            {khatas.length === 0 ? (
              <div className="p-4 rounded-lg bg-[#10141D] text-center text-xs text-stone-500 italic">
                No active credit accounts. Customers added via voice bills will appear here.
              </div>
            ) : (
              khatas.map((khata) => (
                <div
                  key={khata.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-[#10141D] border border-stone-800 hover:border-stone-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                      {khata.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs md:text-sm font-bold text-white">
                        {khata.customerName}
                      </h4>
                      <p className="text-[11px] text-stone-400">
                        {khata.bills.length} saved bill{khata.bills.length !== 1 ? 's' : ''}
                        {khata.phone && ` • 📞 ${khata.phone}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5">
                    <span className="text-sm font-mono font-bold text-orange-400">
                      ₹{khata.currentBalance.toFixed(2)}
                    </span>

                    {/* WhatsApp Reminder Button on Customer Card */}
                    <button
                      onClick={() => sendKhataReminderWhatsApp(khata)}
                      className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 text-xs font-semibold rounded border border-emerald-700/50 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Send WhatsApp Payment Reminder"
                    >
                      <MessageCircle className="w-3 h-3 fill-current" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>

                    <button
                      onClick={() => setViewKhataTarget(khata)}
                      className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded border border-stone-700 transition-colors cursor-pointer"
                    >
                      View
                    </button>

                    <button
                      onClick={() => setDeleteKhataTarget(khata)}
                      className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                      title="Delete customer khata"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Ledger Bottom Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800/80">
            <button
              onClick={() => showToast('Khata ledger refreshed.', 'info')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200 bg-stone-800/60 rounded border border-stone-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Khata</span>
            </button>
            <button
              onClick={resetDemoData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 rounded border border-red-900/30 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Reset all demo data</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Delete Khata Confirmation (Exact replica of video screenshot) */}
      {deleteKhataTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-[#141A25] border border-stone-700 p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-white">
                Delete {deleteKhataTarget.customerName}'s khata?
              </h3>
              <p className="text-xs text-stone-400">
                This will also remove their saved bills.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={confirmDeleteKhata}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                OK
              </button>
              <button
                onClick={() => setDeleteKhataTarget(null)}
                className="flex-1 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs rounded-lg border border-stone-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: View Khata Details & History with WhatsApp Statement Option */}
      {viewKhataTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-[#141A25] border border-stone-700 p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📙 {viewKhataTarget.customerName} का बही-खाता</span>
                </h3>
                <p className="text-xs text-stone-400">
                  Total Outstanding Udhaar:{' '}
                  <span className="font-mono text-orange-400 font-bold">
                    ₹{viewKhataTarget.currentBalance}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setViewKhataTarget(null)}
                className="p-1 rounded bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bill history list */}
            <div className="space-y-3">
              {viewKhataTarget.bills.map((b, i) => (
                <div key={b.id || i} className="p-3 rounded-lg bg-[#0E121B] border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-stone-400">
                      {new Date(b.timestamp).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="font-mono font-bold text-white">₹{b.grandTotal}</span>
                  </div>
                  {b.transcript && (
                    <p className="text-[11px] text-stone-400 italic">"{b.transcript}"</p>
                  )}
                  <div className="text-[11px] text-stone-300">
                    {b.items.map((it) => `${it.name} (${it.quantity}${it.unit})`).join(', ')}
                  </div>
                </div>
              ))}
            </div>

            {/* Settle & WhatsApp Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-3 border-t border-stone-800">
              <button
                onClick={() => sendKhataReminderWhatsApp(viewKhataTarget)}
                className="w-full sm:flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                <span>WhatsApp Statement Bhejein</span>
              </button>
              <button
                onClick={() => {
                  setKhatas((prev) =>
                    prev.map((k) => (k.id === viewKhataTarget.id ? { ...k, currentBalance: 0 } : k))
                  );
                  setViewKhataTarget((curr) => (curr ? { ...curr, currentBalance: 0 } : null));
                  showToast(`Balance settled for ${viewKhataTarget.customerName}!`, 'success');
                }}
                className="w-full sm:flex-1 py-2 bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                ₹ भुगतान जमा (Clear Balance)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Customer Khata */}
      {showAddKhataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-[#141A25] border border-stone-700 p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Add New Customer Khata</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">
                  Customer Name (e.g. Mishra ji)
                </label>
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Sharma ji"
                  className="w-full bg-[#0E121B] border border-stone-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">
                  WhatsApp / Phone Number (10 digits)
                </label>
                <input
                  type="text"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-[#0E121B] border border-stone-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  if (!newCustomerName.trim()) return;
                  const newK: CustomerKhata = {
                    id: `khata-${Date.now()}`,
                    customerName: newCustomerName.trim(),
                    phone: newCustomerPhone.trim(),
                    currentBalance: 0,
                    bills: [],
                    lastUpdated: Date.now(),
                  };
                  setKhatas([newK, ...khatas]);
                  setNewCustomerName('');
                  setNewCustomerPhone('');
                  setShowAddKhataModal(false);
                  showToast(`Khata created for ${newK.customerName}`, 'success');
                }}
                className="flex-1 py-2 bg-[#FF6B00] hover:bg-[#ff7b1a] text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                Save Customer
              </button>
              <button
                onClick={() => setShowAddKhataModal(false)}
                className="px-3 py-2 bg-stone-800 text-stone-400 text-xs rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
