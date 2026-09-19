// src/features/company-admin/rewards/components/GlobalApiCatalogModal.tsx

import { useEffect, useMemo, useState } from 'react';
import { Globe, Search, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CatalogCard {
  id: string;
  brand: string;
  title: string;
  description: string;
  points: number;
  usd: number;
  image_url?: string;
  /** Fallback gradient when no image is available */
  tint?: string;
}

interface GlobalApiCatalogModalProps {
  open: boolean;
  onClose: () => void;
  /** Called when the user clicks Done — receives the ids they marked "Listed". */
  onImport?: (ids: string[]) => void;
  /** Optional: pre-marked ids (e.g. rewards already in the org catalog) */
  initiallyListed?: string[];
}

// ─── Mock catalog ─────────────────────────────────────────────────────
// Replace with a real call to rewardSourceService when the "browse all"
// endpoint exists. Shape matches what the modal renders 1:1.

const MOCK_CATALOG: CatalogCard[] = [
  {
    id: 'amc-15',
    brand: 'AMC',
    title: '$15 AMC Movie eTicket',
    description: 'Catch the latest blockbuster movies with digital tickets, popcorn, and drinks at AMC Theatres.',
    points: 150,
    usd: 15,
    image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
  },
  {
    id: 'netflix-15',
    brand: 'Netflix',
    title: '$15 Entertainment Streaming Voucher',
    description: 'Pay for your monthly Netflix, Hulu, or Disney+ subscription seamlessly.',
    points: 150,
    usd: 15,
    image_url: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&q=80',
  },
  {
    id: 'walmart-25',
    brand: 'Walmart',
    title: '$25 Walmart eGift Card',
    description: 'Shop low prices on groceries, home goods, and tech at Walmart stores and Walmart.com.',
    points: 250,
    usd: 25,
    image_url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80',
  },
  {
    id: 'amazon-25',
    brand: 'Amazon',
    title: '$25 Amazon eGift Card',
    description: 'Millions of products, fast delivery, and exclusive deals — use anywhere on Amazon.',
    points: 250,
    usd: 25,
    image_url: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=800&q=80',
  },
  {
    id: 'starbucks-10',
    brand: 'Starbucks',
    title: '$10 Starbucks eGift Card',
    description: 'A digital coffee card sent straight to your email — redeemable at any Starbucks location.',
    points: 100,
    usd: 10,
    image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80',
  },
  {
    id: 'target-25',
    brand: 'Target',
    title: '$25 Target GiftCard',
    description: 'Everything you love about Target, delivered digitally. Use in-store or on Target.com.',
    points: 250,
    usd: 25,
    image_url: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&q=80',
  },
  {
    id: 'ubereats-20',
    brand: 'Uber Eats',
    title: '$20 Uber Eats eGift Card',
    description: 'Order food from thousands of restaurants, delivered to your door.',
    points: 200,
    usd: 20,
    image_url: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&q=80',
  },
  {
    id: 'airbnb-50',
    brand: 'Airbnb',
    title: '$50 Airbnb Gift Card',
    description: 'Book unique homes and experiences around the world.',
    points: 500,
    usd: 50,
    image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
  },
  {
    id: 'spotify-10',
    brand: 'Spotify',
    title: '$10 Spotify Premium Gift Card',
    description: 'Ad-free music, podcasts, and playlists — one month of Premium.',
    points: 100,
    usd: 10,
    image_url: 'https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=800&q=80',
  },
  {
    id: 'doordash-20',
    brand: 'DoorDash',
    title: '$20 DoorDash Gift Card',
    description: 'Get your favorite meals, groceries, and essentials delivered fast.',
    points: 200,
    usd: 20,
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  },
  {
    id: 'bestbuy-25',
    brand: 'Best Buy',
    title: '$25 Best Buy Gift Card',
    description: 'Electronics, appliances, and tech accessories — in-store or online.',
    points: 250,
    usd: 25,
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
  },
  {
    id: 'chipotle-15',
    brand: 'Chipotle',
    title: '$15 Chipotle eGift Card',
    description: 'Burritos, bowls, and tacos made with real ingredients.',
    points: 150,
    usd: 15,
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
  },
];

export function GlobalApiCatalogModal({
  open,
  onClose,
  onImport,
  initiallyListed = [],
}: GlobalApiCatalogModalProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [listedIds, setListedIds] = useState<Set<string>>(new Set(initiallyListed));

  // Reset transient state each time the modal opens
  useEffect(() => {
    if (open) {
      setSearch('');
      setDebouncedSearch('');
      setListedIds(new Set(initiallyListed));
    }
  }, [open, initiallyListed]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return MOCK_CATALOG;
    return MOCK_CATALOG.filter(
      (c) =>
        c.brand.toLowerCase().includes(term) ||
        c.title.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term)
    );
  }, [debouncedSearch]);

  const toggleListed = (id: string) => {
    setListedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDone = () => {
    onImport?.(Array.from(listedIds));
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 px-6 py-5 text-white">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 ring-1 ring-indigo-400/30">
              <Globe className="h-5 w-5 text-indigo-200" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">
                Global Digital Gift Card Catalog
              </h2>
              <p className="mt-0.5 text-xs text-white/60">
                Import directly from global brand gift card catalogs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 transition-colors hover:text-white"
            aria-label="Close catalog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ─── Search ─────────────────────────────────────────── */}
        <div className="border-b border-slate-200 bg-white px-6 py-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brand (Starbucks, Visa, Target, Amazon, Uber Eats, Airbnb)…"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              autoFocus
            />
          </div>
        </div>

        {/* ─── Grid ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto bg-slate-50/60 px-6 py-5">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <p className="text-base font-bold text-slate-800">No gift cards match</p>
              <p className="mt-1 text-sm text-slate-500">
                Try a different brand, category, or keyword.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((card) => {
                const isListed = listedIds.has(card.id);
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => toggleListed(card.id)}
                    className={cn(
                      'group flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
                      isListed
                        ? 'border-indigo-300 ring-2 ring-indigo-100'
                        : 'border-slate-200'
                    )}
                  >
                    {/* Image with $ chip */}
                    <div className="relative h-40 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                      {card.image_url ? (
                        <img
                          src={card.image_url}
                          alt={card.brand}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Globe className="h-14 w-14 text-slate-300" />
                        </div>
                      )}
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                        ${card.usd} USD
                      </span>
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 flex-1 text-sm font-bold leading-snug text-slate-900">
                          {card.title}
                        </h3>
                        <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700 ring-1 ring-indigo-100">
                          {card.points} PTS
                        </span>
                      </div>

                      <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {card.description}
                      </p>

                      {/* Footer row */}
                      <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Conversion: 10 pts = $1.00
                        </span>
                        {isListed ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                            <Check className="h-3 w-3" />
                            Listed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            + Add
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Footer ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-white px-6 py-4">
          <p className="text-sm text-slate-500">
            Showing <span className="font-bold text-slate-800">{filtered.length}</span>{' '}
            ready-to-import global e-gift cards
            {listedIds.size > 0 && (
              <>
                {' · '}
                <span className="font-bold text-indigo-600">{listedIds.size}</span>{' '}
                marked for import
              </>
            )}
          </p>
          <button
            type="button"
            onClick={handleDone}
            className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}