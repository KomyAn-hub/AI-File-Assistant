export interface ClassificationResult {
  category: string;
  suggestedPath: string;
  confidence: number;
  reason: string;
  highlightPath: string[];
}

export type FileStatus = "analyzing" | "classified" | "moving" | "moved" | "reminded";

export interface FileRecord {
  id: string;
  name: string;
  content: string;
  result: ClassificationResult | null;
  status: FileStatus;
  timestamp: Date;
  timeLabel: string;
  moveCountdown?: number;
  feedback?: "positive" | "negative";
}

export type AppMode = "suggestion" | "auto";
