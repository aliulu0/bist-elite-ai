export interface JobContext {
  signal?: AbortSignal;
  metadata?: Record<string, unknown>;
}

export interface JobResult {
  success: boolean;
  message: string;
  metadata: Record<string, unknown>;
}

export interface IJob {
  execute(ctx?: JobContext): Promise<JobResult>;
}
