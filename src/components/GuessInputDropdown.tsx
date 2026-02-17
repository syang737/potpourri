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
  dataSource: "client" | "server";
  clientOptions?: AnswerOption[];
  onSubmitGuess: (answerPoolItemId: string) => void;
  disabled?: boolean;
  guessedIds: Set<string>;
}

export function GuessInputDropdown({
  verticalSlug,
  dataSource,
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
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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

  const searchServer = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/vertical/${verticalSlug}/search?query=${encodeURIComponent(q)}&limit=20`
        );
        const data = await res.json();
        const filtered = (data.items as AnswerOption[]).filter(
          (o) => !guessedIds.has(o.id)
        );
        setSuggestions(filtered);
        setHighlightIndex(0);
      } catch {
        setSuggestions([]);
      }
    },
    [verticalSlug, guessedIds]
  );

  useEffect(() => {
    // Don't search when an item is already selected
    if (selectedItem) return;

    if (!query.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setShowDropdown(true);

    if (dataSource === "client") {
      filterClientOptions(query);
    } else {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => searchServer(query), 250);
    }
  }, [query, dataSource, filterClientOptions, searchServer, selectedItem]);

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
      inputRef.current?.focus();
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    // If user types after selecting, clear the selection
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
        // Submit the selected answer
        handleSubmit();
      } else if (suggestions.length > 0) {
        // Select the highlighted item from dropdown
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
          className="flex-1 p-3 md:p-3.5 bg-surface-light border border-border-light rounded-xl text-base text-gray-100 placeholder-gray-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
        />
        <button
          onClick={handleSubmit}
          disabled={!selectedItem || disabled}
          className="px-5 py-3 md:py-3.5 bg-accent hover:bg-accent-hover disabled:bg-white/5 disabled:text-gray-600 text-white rounded-xl font-medium text-sm transition-all duration-150 disabled:cursor-not-allowed active:scale-[0.97]"
        >
          Submit
        </button>
      </div>
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-surface-light border border-border-light rounded-xl shadow-2xl max-h-60 overflow-y-auto">
          {suggestions.map((item, idx) => (
            <li
              key={item.id}
              className={`px-4 py-3 cursor-pointer text-sm transition-colors duration-100 ${
                idx === highlightIndex
                  ? "bg-sky-500/20 text-sky-300"
                  : "text-gray-200 hover:bg-white/5"
              } ${idx === 0 ? "rounded-t-xl" : ""} ${
                idx === suggestions.length - 1 ? "rounded-b-xl" : ""
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
        <div className="absolute z-10 w-full mt-1 bg-surface-light border border-border-light rounded-xl shadow-2xl px-4 py-3 text-gray-400 text-sm">
          No matches found.
        </div>
      )}
    </div>
  );
}
