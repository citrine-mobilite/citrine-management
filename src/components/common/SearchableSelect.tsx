import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  triggerClassName?: string;
  allowClear?: boolean;
  emptyMessage?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
  name?: string;
  required?: boolean;
  align?: 'left' | 'right';
}

function normalizeStr(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options = [],
  value,
  onChange,
  placeholder = 'Sélectionner...',
  searchPlaceholder = 'Rechercher...',
  disabled = false,
  className = '',
  buttonClassName = '',
  triggerClassName = '',
  allowClear = false,
  emptyMessage = 'Aucun résultat',
  icon,
  size = 'md',
  id,
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt.value) === String(value));
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const norm = normalizeStr(searchQuery);
    return options.filter((opt) => {
      const matchLabel = normalizeStr(opt.label).includes(norm);
      const matchDesc = opt.description ? normalizeStr(opt.description).includes(norm) : false;
      const matchVal = normalizeStr(String(opt.value)).includes(norm);
      return matchLabel || matchDesc || matchVal;
    });
  }, [options, searchQuery]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSelect = (opt: SelectOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const sizeClasses = {
    sm: 'py-1 px-2.5 text-xs rounded-xl min-h-[32px]',
    md: 'py-2 px-3.5 text-xs rounded-xl min-h-[38px]',
    lg: 'py-2.5 px-4 text-sm rounded-2xl min-h-[44px]',
  };

  return (
    <div ref={containerRef} className={`relative inline-block w-full text-left ${className}`} id={id}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full bg-white border border-stone-200 text-stone-800 font-medium flex items-center justify-between gap-2 transition shadow-3xs hover:border-[#2A7B76] focus:outline-none focus:ring-2 focus:ring-[#2A7B76]/20 ${
          sizeClasses[size]
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-stone-50' : 'cursor-pointer'} ${buttonClassName} ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {icon && <span className="text-stone-400 shrink-0">{icon}</span>}
          {selectedOption ? (
            <span className="truncate flex items-center gap-1.5">
              {selectedOption.icon}
              <span className="font-semibold text-stone-900">{selectedOption.label}</span>
            </span>
          ) : (
            <span className="text-stone-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {allowClear && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-0.5 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-700"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown className={`h-3.5 w-3.5 text-stone-400 transition-transform ${isOpen ? 'rotate-180 text-[#2A7B76]' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 max-h-64 w-full min-w-[220px] bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Search Input Bar */}
          <div className="p-2 border-b border-stone-100 bg-stone-50/80 flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-stone-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs text-stone-900 font-medium focus:outline-none placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-0.5 hover:bg-stone-200 rounded text-stone-400 hover:text-stone-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Options list */}
          <ul ref={listRef} className="overflow-y-auto max-h-52 p-1 space-y-0.5 text-xs divide-y divide-stone-50">
            {filteredOptions.length === 0 ? (
              <li className="p-3 text-center text-stone-400 text-xs italic">
                {emptyMessage}
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={String(opt.value)}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition ${
                      opt.disabled ? 'opacity-40 cursor-not-allowed' : ''
                    } ${
                      isSelected
                        ? 'bg-[#2A7B76] text-white font-bold'
                        : isHighlighted
                        ? 'bg-stone-100 text-stone-900 font-medium'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      {opt.icon}
                      <div className="truncate">
                        <div className="truncate">{opt.label}</div>
                        {opt.description && (
                          <div
                            className={`text-[10px] truncate font-normal ${
                              isSelected ? 'text-emerald-100' : 'text-stone-400'
                            }`}
                          >
                            {opt.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && <Check className="h-3.5 w-3.5 text-white shrink-0 ml-1" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
