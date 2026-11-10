import React, { useState } from 'react';
import { IndianRupee, Plus, Trash2, X, Check, Save } from 'lucide-react';

interface RateItem {
  name: string;
  hindiName: string;
  rate: number;
  unit: string;
  category: string;
}

interface RateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (rates: Record<string, { rate: number; unit: string; category: string }>) => void;
}

export const RateListModal: React.FC<RateListModalProps> = ({ isOpen, onClose }) => {
  const [rates, setRates] = useState<RateItem[]>([
    { name: 'Atta', hindiName: 'आटा', rate: 35, unit: 'kg', category: 'Staples' },
    { name: 'Sugar / Cheeni', hindiName: 'चीनी', rate: 42, unit: 'kg', category: 'Staples' },
    { name: 'Rice / Chawal', hindiName: 'चावल', rate: 55, unit: 'kg', category: 'Staples' },
    { name: 'Toor Dal', hindiName: 'तूर दाल', rate: 140, unit: 'kg', category: 'Pulses' },
    { name: 'Mustard Oil / Sarson Tel', hindiName: 'सरसों तेल', rate: 155, unit: 'L', category: 'Oils' },
    { name: 'Refined Oil', hindiName: 'रिफाइंड तेल', rate: 135, unit: 'L', category: 'Oils' },
    { name: 'Tea / Chai Patti', hindiName: 'चाय पत्ती', rate: 120, unit: 'pack', category: 'Beverages' },
    { name: 'Milk / Doodh', hindiName: 'दूध', rate: 32, unit: 'packet', category: 'Dairy' },
    { name: 'Bread', hindiName: 'ब्रेड', rate: 30, unit: 'packet', category: 'Bakery' },
    { name: 'Parle-G Biscuit', hindiName: 'पारले-जी', rate: 10, unit: 'packet', category: 'Snacks' },
    { name: 'Maggi 2-Min Noodles', hindiName: 'मैगी', rate: 14, unit: 'packet', category: 'Snacks' },
    { name: 'Dettol Soap', hindiName: 'डेटॉल साबुन', rate: 42, unit: 'piece', category: 'Personal Care' },
    { name: 'Surf / Detergent', hindiName: 'सर्फ', rate: 65, unit: 'kg', category: 'Household' },
    { name: 'Salt / Namak', hindiName: 'नमक', rate: 24, unit: 'kg', category: 'Spices' },
  ]);

  const [search, setSearch] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemRate, setNewItemRate] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('kg');

  if (!isOpen) return null;

  const filtered = rates.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.hindiName.includes(search) ||
      r.category.toLowerCase().includes(search.toLowerCase())
  );

  const updateRate = (name: string, newRate: number) => {
    setRates((prev) =>
      prev.map((it) => (it.name === name ? { ...it, rate: newRate } : it))
    );
  };

  const addItem = () => {
    if (!newItemName.trim() || !newItemRate) return;
    setRates([
      {
        name: newItemName.trim(),
        hindiName: '',
        rate: parseFloat(newItemRate) || 0,
        unit: newItemUnit,
        category: 'General',
      },
      ...rates,
    ]);
    setNewItemName('');
    setNewItemRate('');
  };

  const removeItem = (name: string) => {
    setRates((prev) => prev.filter((it) => it.name !== name));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl bg-[#141A25] border border-stone-700 p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col text-stone-200">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-orange-400" />
              <span>किराना रेट लिस्ट (Item Rates & Pricing)</span>
            </h3>
            <p className="text-xs text-stone-400">
              बोलके बिल uses these rates when generating automatic bills.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-stone-800 text-stone-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add quick item */}
        <div className="p-3 rounded-lg bg-[#0E121B] border border-stone-800 space-y-2">
          <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">
            + Naya Item Jodein
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Item name (e.g. Besan)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1 min-w-[120px] bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-xs text-white"
            />
            <input
              type="number"
              placeholder="Rate ₹"
              value={newItemRate}
              onChange={(e) => setNewItemRate(e.target.value)}
              className="w-20 bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-xs text-white"
            />
            <select
              value={newItemUnit}
              onChange={(e) => setNewItemUnit(e.target.value)}
              className="bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-xs text-stone-300"
            >
              <option value="kg">kg</option>
              <option value="L">L</option>
              <option value="packet">packet</option>
              <option value="piece">piece</option>
              <option value="pack">pack</option>
            </select>
            <button
              onClick={addItem}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search items by name or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#0E121B] border border-stone-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-stone-500"
        />

        {/* Item table scrollable */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-stone-800">
          {filtered.map((it) => (
            <div key={it.name} className="flex items-center justify-between py-2 text-xs">
              <div>
                <span className="font-semibold text-white">{it.name}</span>
                {it.hindiName && (
                  <span className="text-stone-400 ml-1.5 text-[11px]">({it.hindiName})</span>
                )}
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">
                  {it.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-stone-400">₹</span>
                <input
                  type="number"
                  value={it.rate}
                  onChange={(e) => updateRate(it.name, parseFloat(e.target.value) || 0)}
                  className="w-16 bg-[#0E121B] border border-stone-700 rounded px-2 py-1 text-xs text-right font-mono font-bold text-orange-400"
                />
                <span className="text-stone-400 font-mono text-[11px]">/{it.unit}</span>
                <button
                  onClick={() => removeItem(it.name)}
                  className="p-1 text-stone-500 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
          <span className="text-xs text-stone-500">{rates.length} standard items indexed</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Save Rates
          </button>
        </div>
      </div>
    </div>
  );
};
