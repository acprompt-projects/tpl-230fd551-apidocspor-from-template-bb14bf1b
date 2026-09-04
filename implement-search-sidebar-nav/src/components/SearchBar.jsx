import React, { useState, useRef, useEffect, useCallback } from "react";

function buildIndex(documents) {
  const records = [];
  for (const doc of documents) {
    const tokens = (doc.section + " " + doc.label + " " + (doc.keywords || "")).toLowerCase().split(/\s+/);
    records.push({ ...doc, _tokens: tokens, _text: tokens.join(" ") });
  }
  return records;
}

function search(index, query, { limit = 8, threshold = 0.35 } = {}) {
  if (!query.trim()) return [];
  const qTokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = [];
  for (const rec of index) {
    let score = 0;
    for (const qt of qTokens) {
      let bestTokScore = 0;
      for (const tok of rec._tokens) {
        if (tok === qt) { bestTokScore = Math.max(bestTokScore, 1.0); }
        else if (tok.startsWith(qt)) { bestTokScore = Math.max(bestTokScore, 0.85); }
        else if (tok.includes(qt)) { bestTokScore = Math.max(bestTokScore, 0.65); }
        else {
          const dist = levenshtein(tok, qt);
          const maxLen = Math.max(tok.length, qt.length);
          if (maxLen > 0) {
            const sim = 1 - dist / maxLen;
            if (sim > 0.55) bestTokScore = Math.max(bestTokScore, sim * 0.5);
          }
        }
      }
      score += bestTokScore;
    }
    score = score / qTokens.length;
    if (score >= threshold) scored.push({ ...rec, _score: score });
  }
  scored.sort((a, b) => b._score - a._score);
  return scored.slice(0, limit);
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
    }
    prev = curr;
  }
  return prev[n];
}

export default function SearchBar({ documents = [], onSelect, placeholder = "Search docs…" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const indexRef = useRef(null);
  if (!indexRef.current && documents.length > 0) {
    indexRef.current = buildIndex(documents);
  }
  useEffect(() => {
    if (documents.length > 0) indexRef.current = buildIndex(documents);
  }, [documents]);

  const handleQuery = useCallback((val) => {
    setQuery(val);
    if (!val.trim()) { setResults([]); setIsOpen(false); setActiveIdx(-1); return; }
    if (!indexRef.current) return;
    const hits = search(indexRef.current, val);
    setResults(hits);
    setIsOpen(hits.length > 0);
    setActiveIdx(-1);
  }, []);

  const handleSelect = useCallback((item) => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setActiveIdx(-1);
    if (onSelect) onSelect(item);
  }, [onSelect]);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(results[activeIdx]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIdx(-1);
    }
  }, [isOpen, results, activeIdx, handleSelect]);

  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const el = listRef.current.children[activeIdx];
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx]);

  return (
    <div className="search" role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
      <div className="search__input-wrap">
        <span className="search__icon" aria-hidden="true">⌕</span>
        <input
          ref={inputRef}
          type="search"
          className="search__input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          aria-label="Search documentation"
          aria-autocomplete="list"
          aria-controls="search-results"
        />
        {query && (
          <button className="search__clear" onClick={() => handleQuery("")} aria-label="Clear search">✕</button>
        )}
      </div>
      {isOpen && (
        <ul id="search-results" ref={listRef} className="search__results" role="listbox">
          {results.map((item, i) => (
            <li
              key={item.id}
              className={`search__result${i === activeIdx ? " search__result--active" : ""}`}
              role="option"
              aria-selected={i === activeIdx}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <span className="search__result-section">{item.section}</span>
              <span className="search__result-label">{item.label}</span>
              {item._score != null && (
                <span className="search__result-score">{Math.round(item._score * 100)}%</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { buildIndex, search };