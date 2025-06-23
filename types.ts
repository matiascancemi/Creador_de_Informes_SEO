
export interface SeoFactorItem {
  factorName: string;
  currentObservation: string;
  importance: string;
  recommendation: string;
}

export interface SeoSection {
  title: string;
  introduction: string;
  factors: SeoFactorItem[];
}

export interface PrioritizedRecommendation {
  priority: number;
  action: string;
  reasoning: string;
}

export interface OverallSummary {
  title: string;
  strengths: string[];
  weaknesses: string[];
  topRecommendations: PrioritizedRecommendation[];
}

export interface SeoReportData {
  analyzedUrl: string;
  onPageAnalysis: SeoSection;
  offPageAnalysis: SeoSection;
  overallSummary: OverallSummary;
}

// This is the expected structure from Gemini
export type GeminiSeoReportResponse = SeoReportData;
