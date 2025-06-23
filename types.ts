// types.ts

// --- Tipos para el Resumen Ejecutivo ---
interface OverallScore {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

interface TopRecommendation {
  priority: 'Alta' | 'Media' | 'Baja';
  recommendation: string;
  description: string;
}

interface ExecutiveSummary {
  title: string;
  overallScore: OverallScore;
  introduction: string;
  topRecommendations: TopRecommendation[];
}

// --- Tipos para el Análisis Detallado ---
interface Finding {
  title: string;
  observation: string;
  recommendation: string;
}

interface DetailedAnalysisSection {
  category: string;
  score: number;
  introduction: string;
  findings: Finding[];
}

// --- Tipos para el Plan de Acción ---
interface ActionPlanItem {
  priority: 'Alta' | 'Media' | 'Baja';
  area: string;
  action: string;
  details: string;
  impact: string;
}

// --- Estructura Principal del Informe ---
export interface SeoReportData {
  analyzedUrl: string;
  executiveSummary: ExecutiveSummary;
  detailedAnalysis: DetailedAnalysisSection[];
  actionPlan: ActionPlanItem[];
}

// La respuesta esperada de Gemini ahora sigue esta nueva estructura
export type GeminiSeoReportResponse = SeoReportData;
