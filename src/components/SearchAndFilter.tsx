import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, X, ArrowUpDown, Zap, CalendarClock } from 'lucide-react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Subscription } from '../types';

// --- Debounce Hook for smoother searching ---
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

interface SearchAndFilterProps {
  filters: {
    search: string; category: string; billing_cycle: string; sort_by: string;
    price_min: number; price_max: number;
  };
  onFiltersChange: (filters: any) => void;
  subscriptions: Subscription[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  filters, onFiltersChange, subscriptions, viewMode, onViewModeChange
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    onFiltersChange({ ...filters, search: debouncedSearchTerm });
  }, [debouncedSearchTerm]);

  const categories = Array.from(new Set(subscriptions.map(s => s.category)));
  const maxPrice = Math.max(...subscriptions.map(s => s.cost), 100);

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setSearchTerm('');
    onFiltersChange({ search: '', category: 'all', billing_cycle: 'all', sort_by: 'renewal_date_asc', price_min: 0, price_max: maxPrice });
  };
  
  const applyQuickFilter = (type: 'renewing_soon' | 'high_cost') => {
      if (type === 'renewing_soon') {
          onFiltersChange({ ...filters, sort_by: 'renewal_date_asc' });
          toast.success("Showing subscriptions renewing soon.");
      }
      if (type === 'high_cost') {
          onFiltersChange({ ...filters, sort_by: 'cost_desc', price_min: 50, price_max: maxPrice });
          toast.success("Showing high-cost subscriptions.");
      }
  }

  const activeFilterCount = Object.values(filters).filter(value => {
      if (typeof value === 'string') return value && value !== 'all' && value !== 'renewal_date_asc';
      if (typeof value === 'number') return value > 0 && value < maxPrice;
      return false;
  }).length;

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <motion.div layout className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-grow md:flex-grow-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search subscriptions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-64 pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => applyQuickFilter('renewing_soon')} className="hidden sm:flex items-center space-x-2 text-sm bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200"><CalendarClock size={16}/><span>Renewing Soon</span></button>
          <button onClick={() => applyQuickFilter('high_cost')} className="hidden sm:flex items-center space-x-2 text-sm bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200"><Zap size={16}/><span>High Cost</span></button>
          
          <Popover className="relative">
            <PopoverButton className="flex items-center space-x-2 border px-4 py-2 rounded-lg hover:bg-gray-50">
                <Filter size={16}/><span>Filters</span>
                {activeFilterCount > 0 && <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeFilterCount}</span>}
            </PopoverButton>
            <PopoverPanel anchor="bottom end" className="z-10 mt-2 w-80 rounded-xl bg-white shadow-lg ring-1 ring-black/5 p-4">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Category</label>
                        <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)} className="w-full mt-1 py-2 px-3 border rounded-lg"><option value="all">All Categories</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Billing Cycle</label>
                        <select value={filters.billing_cycle} onChange={(e) => handleFilterChange('billing_cycle', e.target.value)} className="w-full mt-1 py-2 px-3 border rounded-lg"><option value="all">All Cycles</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Price Range: ${filters.price_min} - ${filters.price_max}</label>
                        <input type="range" min={0} max={maxPrice} value={filters.price_max} onChange={(e) => handleFilterChange('price_max', parseInt(e.target.value))} className="w-full mt-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/>
                    </div>
                    <button onClick={clearFilters} className="w-full text-center text-sm text-indigo-600 hover:underline">Clear All Filters</button>
                </div>
            </PopoverPanel>
          </Popover>

          {/* --- FIX: Added the ArrowUpDown icon to the sort dropdown --- */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select value={filters.sort_by} onChange={(e) => handleFilterChange('sort_by', e.target.value)} className="pl-9 pr-4 py-2 border rounded-lg appearance-none">
                <option value="renewal_date_asc">Sort: Renewal</option>
                <option value="cost_desc">Sort: Cost (High)</option>
                <option value="cost_asc">Sort: Cost (Low)</option>
                <option value="name_asc">Sort: Name (A-Z)</option>
            </select>
          </div>

          <div className="flex items-center rounded-lg border p-1">
            <button onClick={() => onViewModeChange('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400'}`}><Grid size={16} /></button>
            <button onClick={() => onViewModeChange('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400'}`}><List size={16} /></button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {hasActiveFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap items-center gap-2 pt-3 border-t">
              <span className="text-sm font-medium text-gray-600">Active Filters:</span>
              {filters.search && <FilterPill onRemove={() => setSearchTerm('')}>Search: "{filters.search}"</FilterPill>}
              {filters.category !== 'all' && <FilterPill onRemove={() => handleFilterChange('category', 'all')}>Category: {filters.category}</FilterPill>}
              {filters.billing_cycle !== 'all' && <FilterPill onRemove={() => handleFilterChange('billing_cycle', 'all')}>Cycle: {filters.billing_cycle}</FilterPill>}
              <button onClick={clearFilters} className="text-sm text-indigo-600 hover:underline">Clear All</button>
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Interactive Filter Pill Component ---
const FilterPill: React.FC<{ children: React.ReactNode; onRemove: () => void; }> = ({ children, onRemove }) => (
    <motion.span 
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="inline-flex items-center pl-3 pr-1 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
        {children}
        <button onClick={onRemove} className="ml-1 p-0.5 rounded-full hover:bg-indigo-200">
            <X className="w-3 h-3" />
        </button>
    </motion.span>
);

export default SearchAndFilter;
