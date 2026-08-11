import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

export function ChatInput({ onSend, disabled, suggestions, onSuggestionClick }: ChatInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t p-4">
      {suggestions && suggestions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.slice(0, 4).map((s, i) => (
            <button
              key={i}
              onClick={() => {
                if (onSuggestionClick) onSuggestionClick(s);
                else onSend(s);
              }}
              disabled={disabled}
              className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" />
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ASELS neden düştü? Portföyümü analiz et..."
          disabled={disabled}
          className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || disabled}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
