"use client";

import { useState, useRef, useEffect, useCallback } from "react";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const filterClientOptions = useCallback(
    (q: string) => {
      if (!clientOptions || !q.trim()) {
        setSuggestions([]);
        return;
      }
      const normalized = q.toLowerCase().trim();
      const filtered = clientOptions
        .filter(
          (o) =>
            o.normalizedLabel.includes(normalized) && !guessedIds.has(o.id)
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
  }, [query, dataSource, filterClientOptions, searchServer]);

  const selectItem = (item: AnswerOption) => {
    onSubmitGuess(item.id);
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
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
      if (suggestions.length > 0) {
        selectItem(suggestions[highlightIndex]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => query.trim() && setShowDropdown(true)}
        disabled={disabled}
        placeholder="Type to search answers..."
        className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((item, idx) => (
            <li
              key={item.id}
              className={`px-4 py-2 cursor-pointer ${
                idx === highlightIndex
                  ? "bg-blue-100 text-blue-900"
                  : "hover:bg-gray-50"
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
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-gray-500">
          No matches -- choose from the list.
        </div>
      )}
    </div>
  );
}
