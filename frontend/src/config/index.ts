export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  },
  app: {
    name: "BIST Elite AI",
    version: "1.0.0",
  },
  routes: {
    home: "/",
    screener: "/screener",
    eliteScore: "/elite-score",
    technicalAnalysis: "/technical-analysis",
    fundamentalAnalysis: "/fundamental-analysis",
    backtest: "/backtest",
    portfolio: "/portfolio",
    news: "/news",
    telegram: "/telegram",
    aiAssistant: "/ai-assistant",
    settings: "/settings",
  },
} as const;
