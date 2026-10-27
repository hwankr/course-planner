'use client';

import { useState, useRef, useEffect, useId } from 'react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  group?: string;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** 입력 id. 외부 <label htmlFor>와 연결할 때 지정한다. 생략하면 자동 생성. */
  id?: string;
  /** 보이는 라벨 (13/600 Ink2, 포커스 시 Primary). 생략하면 호출처가 라벨을 직접 제공한다. */
  label?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = '선택하세요',
  disabled = false,
  className = '',
  id,
  label,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: SearchableSelectProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listboxId = `${inputId}-listbox`;
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Filter options by search term
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group filtered options
  const groupedOptions: Record<string, SearchableSelectOption[]> = {};
  const ungroupedOptions: SearchableSelectOption[] = [];

  filteredOptions.forEach(opt => {
    if (opt.group) {
      if (!groupedOptions[opt.group]) {
        groupedOptions[opt.group] = [];
      }
      groupedOptions[opt.group].push(opt);
    } else {
      ungroupedOptions.push(opt);
    }
  });

  // 화면에 그려지는 순서 그대로 (그룹 없는 항목 → 그룹별 항목). 방향키 이동 기준.
  const orderedOptions = [
    ...ungroupedOptions,
    ...Object.keys(groupedOptions).flatMap(group => groupedOptions[group]),
  ];
  const getOptionId = (index: number) => `${listboxId}-o${index}`;

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard: Escape to close
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchTerm('');
        inputRef.current?.blur();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleInputClick = () => {
    if (!disabled && !isOpen) {
      setActiveIndex(-1);
      setIsOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setActiveIndex(-1);
    setIsOpen(true);
  };

  // 키보드 선택은 포커스를 입력에 남겨 둔다 (마우스 선택은 기존처럼 blur).
  const handleOptionClick = (optionValue: string, keepFocus = false) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
    if (!keepFocus) inputRef.current?.blur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    inputRef.current?.focus();
  };

  const displayValue = isOpen ? searchTerm : (selectedOption?.label || '');
  const isListOpen = isOpen && !disabled;
  const activeOption = isListOpen ? orderedOptions[activeIndex] : undefined;

  // Keyboard: 방향키로 열기·이동, Enter로 선택, Tab으로 닫기 (Escape는 위에서 처리)
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    const lastIndex = orderedOptions.length - 1;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault();
        const isDown = e.key === 'ArrowDown';
        if (!isListOpen) {
          const selectedIndex = orderedOptions.findIndex(opt => opt.value === value);
          setActiveIndex(selectedIndex >= 0 ? selectedIndex : isDown ? 0 : lastIndex);
          setIsOpen(true);
        } else if (lastIndex >= 0) {
          setActiveIndex(prev =>
            isDown
              ? Math.min(prev + 1, lastIndex)
              : prev < 0 ? lastIndex : Math.max(prev - 1, 0)
          );
        }
        break;
      }
      case 'Enter':
        if (isListOpen) {
          e.preventDefault();
          if (activeOption) handleOptionClick(activeOption.value, true);
        }
        break;
      case 'Tab':
        if (isListOpen) {
          setIsOpen(false);
          setSearchTerm('');
        }
        break;
    }
  };

  // 활성 항목이 목록 스크롤 밖에 있으면 보이게 한다.
  useEffect(() => {
    if (!isListOpen || activeIndex < 0) return;
    document.getElementById(`${listboxId}-o${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [isListOpen, activeIndex, listboxId]);

  const renderOption = (option: SearchableSelectOption) => {
    const index = orderedOptions.indexOf(option);
    return (
      <button
        key={option.value}
        id={getOptionId(index)}
        type="button"
        role="option"
        tabIndex={-1}
        aria-selected={option.value === value}
        onClick={() => handleOptionClick(option.value)}
        onMouseEnter={() => setActiveIndex(index)}
        className={`w-full text-left px-4 min-h-[44px] text-[15px] transition-colors duration-150 hover:bg-fill ${
          index === activeIndex ? 'bg-fill' : ''
        } ${
          option.value === value
            ? 'text-primary font-semibold'
            : 'text-ink font-medium'
        }`}
      >
        {option.label}
      </button>
    );
  };

  return (
    <div ref={containerRef} className={`group relative ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-[13px] leading-[18px] font-semibold text-ink-2 transition-colors duration-150 group-focus-within:text-primary"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isListOpen}
          aria-controls={isListOpen ? listboxId : undefined}
          aria-activedescendant={activeOption ? getOptionId(activeIndex) : undefined}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          autoComplete="off"
          value={displayValue}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex h-10 w-full rounded-none border-0 border-b border-line-3 bg-transparent px-0 pr-8 text-[17px] font-medium text-ink placeholder:text-placeholder transition-colors duration-150 ease-out focus:outline-none focus-visible:outline-none focus:border-primary focus:shadow-[inset_0_-1px_0_var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="선택 해제"
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-placeholder hover:text-ink transition-colors duration-150"
          >
            <svg
              className="h-4 w-4"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {isListOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={label ?? ariaLabel}
          aria-labelledby={label || ariaLabel ? undefined : ariaLabelledBy}
          className="absolute z-50 mt-1 w-full rounded-none border border-line-2 bg-white py-1 shadow-float max-h-60 overflow-y-auto"
        >
          {filteredOptions.length === 0 ? (
            <div role="presentation" className="px-4 py-3 text-[13px] leading-[18px] text-ink-2 text-center">
              검색 결과가 없습니다.
            </div>
          ) : (
            <>
              {/* Ungrouped options */}
              {ungroupedOptions.map(renderOption)}

              {/* Grouped options */}
              {Object.keys(groupedOptions).map((group, index) => (
                <div key={group} role="group" aria-labelledby={`${listboxId}-g${index}`}>
                  <div
                    id={`${listboxId}-g${index}`}
                    role="presentation"
                    className="px-4 pt-3 pb-1 text-[12px] leading-4 font-semibold text-ink-2"
                  >
                    {group}
                  </div>
                  {groupedOptions[group].map(renderOption)}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
