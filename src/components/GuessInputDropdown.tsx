"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { expandQuery } from "@/lib/aliases";

interface AnswerOption {
  id: string;
  label: string;
  normalizedLabel: string;
}

interface GuessInputDropdownProps {
  verticalSlug: string;
  clientOptions?: AnswerOption[];
  onSubmitGuess: (answerPoolItemId: string) => void;
  disabled?: boolean;
  guessedIds: Set<string>;
}

export function GuessInputDropdown({
  clientOptions,
  onSubmitGuess,
  disabled,
  guessedIds,
}: GuessInputDropdownProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AnswerOption[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AnswerOption | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filterClientOptions = useCallback(
    (q: string) => {
      if (!clientOptions || !q.trim()) {
        setSuggestions([]);
        return;
      }
      const queries = expandQuery(q);
      const filtered = clientOptions
        .filter(
          (o) =>
            !guessedIds.has(o.id) &&
            queries.some((query) => o.normalizedLabel.includes(query))
        )
        .slice(0, 20);
      setSuggestions(filtered);
      setHighlightIndex(0);
    },
    [clientOptions, guessedIds]
  );

  useEffect(() => {
    if (selectedItem) return;

    if (!query.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setShowDropdown(true);
    filterClientOptions(query);
  }, [query, filterClientOptions, selectedItem]);

  const selectItem = (item: AnswerOption) => {
    setSelectedItem(item);
    setQuery(item.label);
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleSubmit = () => {
    if (selectedItem) {
      onSubmitGuess(selectedItem.id);
      setSelectedItem(null);
      setQuery("");
      setSuggestions([]);
      setShowDropdown(false);
      const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
      if (!isTouchDevice) inputRef.current?.focus();
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (selectedItem && value !== selectedItem.label) {
      setSelectedItem(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedItem) {
        handleSubmit();
      } else if (suggestions.length > 0) {
        selectItem(suggestions[highlightIndex]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => !selectedItem && query.trim() && setShowDropdown(true)}
          disabled={disabled}
          placeholder="Type to search answers..."
          className="flex-1 p-3 md:p-3.5 bg-surface border border-border rounded-2xl text-base text-foreground placeholder-warm-brown/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
        />
        <button
          onClick={handleSubmit}
          disabled={!selectedItem || disabled}
          className="px-5 py-3 md:py-3.5 bg-accent hover:bg-accent-hover disabled:bg-surface-light disabled:text-warm-brown/30 disabled:border disabled:border-border text-white rounded-2xl font-bold text-sm transition-all duration-150 disabled:cursor-not-allowed active:scale-[0.97] shadow-sm"
        >
          Submit
        </button>
      </div>
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-2xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((item, idx) => (
            <li
              key={item.id}
              className={`px-4 py-3 cursor-pointer text-sm font-semibold transition-colors duration-100 ${
                idx === highlightIndex
                  ? "bg-peach text-accent"
                  : "text-foreground hover:bg-surface-light"
              } ${idx === 0 ? "rounded-t-2xl" : ""} ${
                idx === suggestions.length - 1 ? "rounded-b-2xl" : ""
              }`}
              onMouseEnter={() => setHighlightIndex(idx)}
              onClick={() => selectItem(item)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
      {showDropdown && query.trim() && suggestions.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-2xl shadow-lg px-4 py-3 text-warm-brown/50 text-sm font-semibold">
          No matches found.
        </div>
      )}
    </div>
  );
}
