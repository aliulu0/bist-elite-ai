"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout";
import { useI18n } from "@/providers/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle, PageHeader, Input, Button } from "@/components";
import { Bot, Send, User, Sparkles, TrendingUp, BarChart3 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AIAssistantPage() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Merhaba! Ben BIST Elite AI asistanınızım. Size hisse analizi, piyasa değerlendirmesi ve yatırım önerileri konusunda yardımcı olabilirim. Nasıl yardımcı olabilirim?",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Bu konuda size yardımcı olabilirim. Lütfen daha fazla detay verir misiniz?",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  return (
    <MainLayout>
      <PageHeader
        title={t("aiAssistant.title")}
        subtitle={t("aiAssistant.subtitle")}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card className="flex h-[calc(100vh-220px)] flex-col">
            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex max-w-[80%] items-start gap-3 rounded-2xl p-4 ${
                        message.role === "user"
                          ? "bg-primary text-white"
                          : "bg-background text-text"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          message.role === "user"
                            ? "bg-white/20"
                            : "bg-primary/10"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>

            <div className="border-t border-border p-4">
              <div className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("aiAssistant.askQuestion")}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <Button onClick={handleSend}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("aiAssistant.suggestions")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { icon: <TrendingUp className="h-4 w-4" />, text: t("aiAssistant.marketAnalysis") },
                  { icon: <BarChart3 className="h-4 w-4" />, text: t("aiAssistant.stockAnalysis") },
                  { icon: <Sparkles className="h-4 w-4" />, text: "Sektör Analizi" },
                  { icon: <Bot className="h-4 w-4" />, text: "Risk Değerlendirmesi" },
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    className="flex w-full items-center gap-3 rounded-xl bg-background/50 p-3 text-left text-sm text-muted transition-all hover:bg-border/50 hover:text-text"
                  >
                    {suggestion.icon}
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("aiAssistant.history")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  "GARAN analizi",
                  "Piyasa değerlendirmesi",
                  "Sektör karşılaştırma",
                ].map((item, i) => (
                  <button
                    key={i}
                    className="flex w-full items-center justify-between rounded-xl bg-background/50 p-3 text-left text-sm text-muted transition-all hover:bg-border/50 hover:text-text"
                  >
                    <span>{item}</span>
                    <span className="text-xs text-muted">2 saat önce</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
