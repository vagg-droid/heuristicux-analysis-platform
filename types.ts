
export interface HeuristicItem {
  id: number;
  name: string;
  description: string;
  weight: number;
}

export interface Observation {
  finding: string;
  recommendation: string;
  resolved?: boolean;
  boundingBox?: number[]; // [ymin, xmin, ymax, xmax] in normalized 0-1000 coordinates
}

export interface AnalysisDetail {
  score: number;
  initialScore?: number; // Store the original score from AI
  observations: Observation[];
  feedback?: 'good' | 'bad';
}

export interface ScreenAnalysis {
  heuristics: Record<number, AnalysisDetail>;
  overallScore: number;
  summary: string;
}

export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  analysis?: ScreenAnalysis;
  isLoading: boolean;
  userContext?: string;
  error?: string;
  model: string;
}

export interface HeuristicData {
  id: number;
  title: string;
  details: AnalysisDetail;
}
