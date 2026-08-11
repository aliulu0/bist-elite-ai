export const SECTORS = [
  "Banka",
  "Holding",
  "Teknoloji",
  "Otomotiv",
  "Enerji",
  "İmalat",
  "Perakende",
  "Sağlık",
  "İnşaat",
  "Gayrimenkul",
  "Telekomünikasyon",
  "Ulaştırma",
  "Madencilik",
  "Kimya",
  "Gıda",
  "Tekstil",
  "Çimento",
  "Cam",
  "Kağıt",
  "Metal",
  "Makine",
  "Elektrik",
  "Diğer",
];

export const LIQUIDITY_LEVELS = ["high", "medium", "low"] as const;

export const RISK_LEVELS = ["low", "medium", "high"] as const;

export const TIMEFRAMES = ["1h", "2h", "4h", "1d", "1w", "1m", "3m", "6m"] as const;

export const HOLDING_PERIODS = [
  { value: "intraday", label: "Intraday" },
  { value: "swing", label: "Swing (1-5 days)" },
  { value: "position", label: "Position (1-4 weeks)" },
  { value: "investment", label: "Investment (1+ months)" },
] as const;

export const VERIFICATION_STATUSES = ["verified", "unverified", "unknown"] as const;