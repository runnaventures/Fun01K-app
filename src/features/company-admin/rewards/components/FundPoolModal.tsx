// src/features/company-admin/rewards/components/FundPoolModal.tsx

import { useEffect, useState } from 'react';
import { X, DollarSign, CreditCard, Building2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

type PaymentMethod = 'corporate_card' | 'ach_debit' | 'wire_invoice';

interface FundPoolModalProps {
  open: boolean;
  onClose: () => void;
  /** Current balance displayed in the pale green panel. */
  currentBalance?: number;
  /** Called when the user confirms. */
  onConfirm?: (amount: number, method: PaymentMethod) => void;
  /** Last 4 digits of the corporate card, for display. */
  cardLast4?: string;
}

const QUICK_AMOUNTS = [250, 500, 1000];

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: 'corporate_card', label: 'Corporate Card', sub: '•••• 4242', icon: CreditCard },
  { value: 'ach_debit', label: 'ACH Debit', sub: 'Bank Account', icon: Building2 },
  { value: 'wire_invoice', label: 'Wire / Invoice', sub: 'Net 30 Billing', icon: FileText },
];

export function FundPoolModal({
  open,
  onClose,
  currentBalance = 2500,
  onConfirm,
  cardLast4 = '4242',
}: FundPoolModalProps) {
  const [amount, setAmount] = useState<number>(500);
  const [method, setMethod] = useState<PaymentMethod>('corporate_card');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset transient state on open
  useEffect(() => {
    if (open) {
      setAmount(500);
      setMethod('corporate_card');
      setIsSubmitting(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!amount || amount <= 0) return;
    setIsSubmitting(true);
    try {
      await onConfirm?.(amount, method);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 px-6 py-5 text-white">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
              <DollarSign className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">
                Fund Prepaid Rewards Account
              </h2>
              <p className="mt-0.5 text-xs text-white/60">
                Corporate Escrow Reserve Account
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 transition-colors hover:text-white"
            aria-label="Close funding modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ─── Body ───────────────────────────────────────────── */}
        <div className="flex-1 space-y-5 overflow-y-auto bg-white px-6 py-6">
          {/* Reserve panel */}
          <div className="rounded-2xl bg-emerald-50 px-5 py-4 ring-1 ring-emerald-100">
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">
              Current Prepaid Reserve
            </p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-emerald-700">
              ${currentBalance.toFixed(2)}{' '}
              <span className="text-base font-bold text-emerald-600">USD</span>
            </p>
          </div>

          {/* Quick amount chips */}
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Top-up Amount (USD)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {QUICK_AMOUNTS.map((val) => {
                const isActive = amount === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={cn(
                      'rounded-xl border px-4 py-3 text-sm font-bold transition-all',
                      isActive
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    )}
                  >
                    +${val}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount input */}
          <div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              min={1}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-xl font-extrabold tracking-tight text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Enter amount"
            />
          </div>

          {/* Payment method */}
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PAYMENT_METHODS.map((pm) => {
                const Icon = pm.icon;
                const isActive = method === pm.value;
                const sub = pm.value === 'corporate_card' ? `•••• ${cardLast4}` : pm.sub;
                return (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => setMethod(pm.value)}
                    className={cn(
                      'flex flex-col items-start gap-2 rounded-2xl border px-3 py-3 text-left transition-all',
                      isActive
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-100'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        isActive ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900">{pm.label}</p>
                      <p className="truncate text-[10px] text-slate-500">{sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs leading-relaxed text-slate-500">
            Funds are held securely in escrow for instant automated digital e-gift
            card issuance when team members exchange earned points.
          </p>
        </div>

        {/* ─── Footer ─────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || amount <= 0}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Processing…' : 'Confirm Deposit'}
          </button>
        </div>
      </div>
    </div>
  );
}