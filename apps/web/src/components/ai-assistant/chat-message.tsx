import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Bot, User } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
}

export function ChatMessage({ role, content, isTyping }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-3 p-4', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      <div className={cn('max-w-[80%] rounded-lg px-4 py-3', isUser ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
        {isTyping ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Düşünüyor...</span>
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{content}</div>
        )}
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}

export function ChatMessages({ messages }: { messages: Array<{ role: 'user' | 'assistant'; content: string }> }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">AI Asistan</h3>
            <p className="mt-1 text-sm text-muted-foreground">Hisse analizi, portföy değerlendirmesi ve daha fazlası için soru sorun.</p>
          </div>
        </div>
      ) : (
        messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}
