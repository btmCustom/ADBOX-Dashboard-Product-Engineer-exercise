"use client";

import { useEffect, useId, useRef, useState } from "react";

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M5 7.5 10 12.5 15 7.5"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M16.667 5 7.5 14.167 3.333 10"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();
  const labelId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

  const focusOption = (index: number) => {
    requestAnimationFrame(() => {
      listRef.current?.querySelectorAll<HTMLElement>('[role="option"]')[index]?.focus();
    });
  };

  const openMenu = () => {
    const idx = Math.max(
      0,
      options.findIndex((o) => o.value === value),
    );
    setActiveIndex(idx);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    focusOption(activeIndex);
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
    // Only when the menu opens — activeIndex is set in openMenu beforehand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const choose = (next: T) => {
    onChange(next);
    setOpen(false);
  };

  const move = (delta: number) => {
    setActiveIndex((i) => {
      const next = (i + delta + options.length) % options.length;
      focusOption(next);
      return next;
    });
  };

  return (
    <div ref={rootRef} className={`relative flex min-w-[12.5rem] flex-col gap-1.5 ${className}`}>
      <span id={labelId} className="text-sm font-medium text-gray-700">
        {label}
      </span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        aria-controls={listboxId}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-lg border bg-white py-2.5 pr-3.5 pl-3.5 text-left text-base shadow-xs transition-colors focus:outline-none ${
          open
            ? "border-brand-300 ring-4 ring-brand-100"
            : "border-gray-300 hover:border-gray-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
        }`}
      >
        <span className="truncate font-medium text-gray-900">{selected?.label}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={labelId}
          tabIndex={-1}
          className="absolute top-[calc(100%+6px)] right-0 left-0 z-50 max-h-72 overflow-auto rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-active={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(option.value)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      move(1);
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      move(-1);
                    } else if (event.key === "Home") {
                      event.preventDefault();
                      setActiveIndex(0);
                    } else if (event.key === "End") {
                      event.preventDefault();
                      setActiveIndex(options.length - 1);
                    } else if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      choose(option.value);
                    }
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2.5 text-left text-base outline-none ${
                    isActive ? "bg-gray-50" : "bg-transparent"
                  } ${isSelected ? "text-gray-900" : "text-gray-700"}`}
                >
                  <span className="truncate font-medium">{option.label}</span>
                  {isSelected ? <CheckIcon className="h-5 w-5 shrink-0 text-brand-600" /> : <span className="h-5 w-5" />}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
