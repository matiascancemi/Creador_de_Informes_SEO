import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { GeminiSeoReportResponse } from '../types';
import { 
  GEMINI_MODEL_NAME,
  DATA_FOR_SEO_BASE_URL,
  ON_PAGE_PAGES_ENDPOINT,
  ON_PAGE_INSTANT_PAGES_ENDPOINT,
  ON_PAGE_LIGHTHOUSE_LIVE_ENDPOINT
} from '../constants';

// --- DataForSEO API Payloads ---
interface DataForSeoInstantPayload { url: string; load_resources?: boolean; enable_javascript?: boolean; }
interface DataForSeoLighthousePayload { url: string; for_mobile?: boolean; }
interface DataForSeoOnPagePagesPayload { target: string; limit?: number; order_by?: string[]; }

// --- DataForSEO API Result Interfaces (Simplified) ---
interface DataForSeoOnPagePage { url: string; rank: number; }
interface DataForSeoLighthouseResult {
  categories: {
    performance: { score: number | null };
    accessibility: { score: number | null };
    "best-practices": { score: number | null };
    seo: { score: number | null };
  };
  audits: {
    metrics?: {
      details?: {
        items: Array<{
          largest_contentful_paint?: number;
          total_blocking_time?: number;
          cumulative_layout_shift?: number;
        }>
      }
    }
  }
}
interface DataForSeoOnPageSummaryItem {
  meta?: { title?: string; description?: string; htags?: Record<string, string[]>; };
  content?: { plain_text_word_count?: number; plain_text_rate?: number; };
  checks?: Record<string, boolean>;
  page_timing?: { onpage_score?: number; };
  total_images_count?: number;
  images_without_alt_count?: number;
  internal_links_count?: number;
  broken_links_count?: number;
}
interface DataForSeoTaskResponse {
  status_code: number;
  status_message: string;
  tasks?: Array<{ status_code: number; status_message: string; result?: any[]; }>;
}

// --- Helper to make authenticated requests ---
const dataForSeoRequest = async (endpoint: string, login: string, password: string, method: 'POST' = 'POST', body: any = null): Promise<DataForSeoTaskResponse> => {
  const url = DATA_FOR_SEO_BASE_URL + endpoint;
  const headers = new Headers({
    'Authorization': 'Basic ' + btoa(`${login}:${password}`),
    'Content-Type': 'application/json'
  });
  const options: RequestInit = { method, headers, body: body ? JSON.stringify(body) : null };
  
  console.log(`DataForSEO Request: ${method} ${url}`, body ? `Body: ${JSON.stringify(body).substring(0, 100)}...` : "");
  
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`DataForSEO API error: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`DataForSEO API error (${endpoint}): ${response.status} ${response.statusText}. ${errorText.substring(0, 200)}`);
  }
  return response.json();
};

// --- API Fetching Functions ---
const getOnPageSummaryInstantly = async (url: string, login: string, password: string): Promise<DataForSeoOnPageSummaryItem | null> => {
  try {
    const response = await dataForSeoRequest(ON_PAGE_INSTANT_PAGES_ENDPOINT, login, password, 'POST', [{ url, load_resources: true, enable_javascript: false }]);
    if (response.status_code !== 20000 || !response.tasks?.[0]?.result?.[0]?.items?.[0]) {
      console.warn(`Could not get OnPage Summary for ${url}: ${response.tasks?.[0]?.status_message || response.status_message}`);
      return null;
    }
    return response.tasks[0].result[0].items[0];
  } catch (error) {
    console.error(`Error in getOnPageSummaryInstantly for ${url}:`, error);
    return null;
  }
};

const getLighthouseReport = async (url: string, login: string, password: string): Promise<DataForSeoLighthouseResult | null> => {
  try {
    const response = await dataForSeoRequest(ON_PAGE_LIGHTHOUSE_LIVE_ENDPOINT, login, password, 'POST', [{ url, for_mobile: true }]);
    if (response.status_code !== 20000 || !response.tasks?.[0]?.result?.[0]) {
      console.warn(`Could not get Lighthouse report for ${url}: ${response.tasks?.[0]?.status_message || response.status_message}`);
      return null;
    }
    return response.tasks[0].result[0];
  } catch (error) {
    console.error(`Error in getLighthouseReport for ${url}:`, error);
    return null;
  }
};

const getTopPages = async (target: string, login: string, password: string): Promise<string[]> => {
  try {
    const response = await dataForSeoRequest(ON_PAGE_PAGES_ENDPOINT, login, password, 'POST', [{ target, limit: 50 }]);
    if (response.status_code !== 20000 || !response.tasks?.[0]?.result?.[0]?.items) {
      console.warn(`Could not get top pages for ${target}, falling back to target itself. Reason: ${response.tasks?.[0]?.status_message || response.status_message}`);
      return [target];
    }
    const pages = response.tasks[0].result[0].items as DataForSeoOnPagePage[];
    const sortedPages = pages.sort((a, b) => b.rank - a.rank);
    return sortedPages.slice(0, 10).map(page => page.url);
  } catch (error) {
    console.error(`Error in getTopPages for ${target}:`, error);
    return [target];
  }
};

// --- Data Consolidation and Prompt Generation ---
const prepareDataForGemini = (mainUrl: string, analysisData: any[]) => {
    const validLighthouseReports = analysisData.map(d => d.lighthouse).filter(Boolean);
    const averageScores = { performance: 0, accessibility: 0, best_practices: 0, seo: 0 };
    if (validLighthouseReports.length > 0) {
        const total = validLighthouseReports.length;
        averageScores.performance = Math.round(validLighthouseReports.reduce((acc, r) => acc + (r.categories.performance.score || 0), 0) / total * 100);
        averageScores.accessibility = Math.round(validLighthouseReports.reduce((acc, r) => acc + (r.categories.accessibility.score || 0), 0) / total * 100);
        averageScores.best_practices = Math.round(validLighthouseReports.reduce((acc, r) => acc + (r.categories["best-practices"].score || 0), 0) / total * 100);
        averageScores.seo = Math.round(validLighthouseReports.reduce((acc, r) => acc + (r.categories.seo.score || 0), 0) / total * 100);
    }

    const page_details = analysisData.map(({ url, summary, lighthouse }) => ({
        url,
        on_page_summary: { page_title: summary?.meta?.title, meta_description: summary?.meta?.description },
        lighthouse_summary: { performance_score: lighthouse ? Math.round((lighthouse.categories.performance.score || 0) * 100) : undefined }
    }));

    return { main_url: mainUrl, average_scores: averageScores, page_details };
};

const PROMPT_TEMPLATE = (dataForSeoJsonString: string): string => `
Eres un consultor SEO experto preparando un informe para un cliente. Analiza los siguientes datos técnicos de las 10 páginas más importantes de su sitio y genera un informe claro y accionable. No menciones las herramientas usadas.

Datos técnicos:
\`\`\`json
${dataForSeoJsonString}
\`\`\`

Instrucciones:
1.  **Resumen Ejecutivo**: Presenta las puntuaciones promedio (performance, accessibility, etc.) y destaca las 3 recomendaciones de mayor impacto.
2.  **Análisis por Categorías**: Agrupa los hallazgos en "Rendimiento Web" y "SEO On-Page". Explica los promedios e identifica problemas comunes.
3.  **Plan de Acción**: Crea una lista de acciones priorizadas (Alta, Media, Baja), explicando qué hacer, por qué es importante y cómo solucionarlo, usando ejemplos de las URLs analizadas.
4.  **Tono**: Usa un lenguaje profesional pero fácil de entender.
5.  **Formato de Salida**: La respuesta DEBE SER ÚNICAMENTE el objeto JSON bien formado.

Formato JSON de Salida Esperado:
{
  "analyzedUrl": "[URL principal]",
  "executiveSummary": {
    "title": "Resumen Ejecutivo",
    "overallScore": { "performance": 0, "accessibility": 0, "bestPractices": 0, "seo": 0 },
    "introduction": "[Párrafo introductorio sobre la salud del sitio.]",
    "topRecommendations": [ { "priority": "Alta", "recommendation": "[Recomendación 1]", "description": "[Por qué es importante.]" } ]
  },
  "detailedAnalysis": [
    {
      "category": "Rendimiento Web",
      "score": 0,
      "introduction": "[Explicación de la importancia del rendimiento.]",
      "findings": [ { "title": "Core Web Vitals", "observation": "[Análisis de métricas.]", "recommendation": "[Recomendación general.]" } ]
    }
  ],
  "actionPlan": [
    { "priority": "Alta", "area": "Rendimiento", "action": "Optimizar imágenes.", "details": "Ejemplo de problema en página X.", "impact": "Mejora la velocidad y UX." }
  ]
}
`;

// --- Main Exported Function ---
export const generateSeoReport = async (
  url: string, 
  dataForSeoLogin: string, 
  dataForSeoPassword: string,
  setLoadingMessage: (message: string) => void
): Promise<GeminiSeoReportResponse> => {
  const geminiApiKey = process.env.API_KEY;
  if (!geminiApiKey) throw new Error("Clave API de Gemini no configurada.");
  if (!dataForSeoLogin || !dataForSeoPassword) throw new Error("Credenciales de DataForSEO no configuradas.");

  setLoadingMessage("Paso 1/3: Identificando páginas principales del sitio...");
  const topPages = await getTopPages(url, dataForSeoLogin, dataForSeoPassword);
  console.log("Top pages to analyze:", topPages);

  setLoadingMessage(`Paso 2/3: Analizando ${topPages.length} páginas en paralelo...`);
  const analysisPromises = topPages.map(pageUrl => 
    Promise.all([
      getOnPageSummaryInstantly(pageUrl, dataForSeoLogin, dataForSeoPassword),
      getLighthouseReport(pageUrl, dataForSeoLogin, dataForSeoPassword)
    ])
  );
  const allResults = await Promise.all(analysisPromises);

  const analysisData = allResults.map(([summary, lighthouse], index) => ({
    url: topPages[index],
    summary,
    lighthouse,
  }));

  if (analysisData.every(d => !d.summary && !d.lighthouse)) {
    throw new Error("No se pudo obtener ningún dato para las páginas analizadas.");
  }

  setLoadingMessage("Paso 3/3: Consolidando datos y generando informe con IA...");
  const mappedDataForPrompt = prepareDataForGemini(url, analysisData);
  const dataForSeoJsonString = JSON.stringify(mappedDataForPrompt, null, 2);
  
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  const prompt = PROMPT_TEMPLATE(dataForSeoJsonString);

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    let jsonStr = response.text?.trim() || "";
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7, -3).trim();
    }

    return JSON.parse(jsonStr) as GeminiSeoReportResponse;
  } catch (error) {
    console.error("Error al llamar o parsear la API de Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("API Key not valid")) {
        throw new Error("Clave API de Gemini inválida.");
    }
    throw new Error(`Error de comunicación con la IA: ${errorMessage}`);
  }
};
