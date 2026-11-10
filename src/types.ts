export interface BillItem {
  id: string;
  name: string;
  hindiName?: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
}

export interface BillRecord {
  id: string;
  timestamp: number;
  items: BillItem[];
  grandTotal: number;
  customerName?: string | null;
  isKhata: boolean;
  transcript: string;
  spokenSummaryHindi?: string;
  status: 'saved' | 'settled';
}

export interface CustomerKhata {
  id: string;
  customerName: string;
  phone?: string;
  currentBalance: number;
  bills: BillRecord[];
  lastUpdated: number;
}

export interface StoryAct {
  id: string;
  title: string;
  hindiTitle: string;
  startTime: number;
  endTime: number;
  description: string;
  prompt: string;
  assetUrl?: string;
  imageUrl?: string;
}
