export class ChatResponseDto {
  answer!: string;
  sources!: Array<{ name: string; type: string; confidence: number }>;
  suggestions!: string[];
  context!: Record<string, unknown>;
}
