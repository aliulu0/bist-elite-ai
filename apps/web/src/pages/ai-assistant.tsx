import { useState, useCallback } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { ChatMessages } from '@/components/ai-assistant/chat-message';
import { ChatInput } from '@/components/ai-assistant/chat-input';
import { AlertCircle } from 'lucide-react';
import { sdkClient } from '@/lib/sdk';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const loadSuggestions = useCallback(async () => {
    try {
      const data = await sdkClient.aiSuggestions();
      const all = Object.values(data).flat() as string[];
      setSuggestions(all.slice(0, 8));
    } catch { /* ignore */ }
  }, []);

  const handleSend = useCallback(async (message: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setLoading(true);
    setError('');

    try {
      const data = await sdkClient.aiChat(message);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);

      if (data.suggestions?.length) {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Bir hata oluştu';
      setError(errorMsg);
      setMessages((prev) => [...prev, { role: 'assistant', content: `Üzgünüm, bir hata oluştu: ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="AI Asistan"
        description="Doğal dil sorularıyla hisse analizi, portföy değerlendirmesi, makro analiz ve daha fazlası"
      />
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-card">
        <ChatMessages messages={messages} />
        {error && (
          <div className="flex items-center gap-2 border-t bg-destructive/10 px-4 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        <ChatInput
          onSend={handleSend}
          disabled={loading}
          suggestions={suggestions}
          onSuggestionClick={handleSend}
        />
      </div>
    </div>
  );
}
