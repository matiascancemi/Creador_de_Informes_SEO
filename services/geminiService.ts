
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { GeminiSeoReportResponse, SeoReportData } from '../types';
import { 
  GEMINI_MODEL_NAME,
  DATA_FOR_SEO_BASE_URL,
  ON_PAGE_INSTANT_PAGES_ENDPOINT, // Usaremos el endpoint de resultados instantáneos
  // Los siguientes ya no son necesarios para el modo live
  // ON_PAGE_TASK_POST_ENDPOINT,
  // ON_PAGE_ID_LIST_ENDPOINT,
  // ON_PAGE_SUMMARY_ENDPOINT,
  // DATA_FOR_SEO_POLL_INTERVAL_MS,
  // DATA_FOR_SEO_MAX_POLLS
} from '../constants';

// --- DataForSEO API Interaction ---

// Payload para el endpoint instant_pages
interface DataForSeoInstantPayload {
  url: string;
  load_resources?: boolean;
  enable_javascript?: boolean;
  // Add other parameters as needed from https://docs.dataforseo.com/v3/on_page/instant_pages
}


interface DataForSeoTaskResponse {
  status_code: number;
  status_message: string;
  tasks_count?: number;
  tasks_error?: number;
  tasks?: Array<{
    id: string;
    status_code: number;
    status_message: string;
    data?: any;
    result?: any; // For summary, result is an array
  }>;
}

// Simplified structure for OnPage Summary result item
// Based on https://docs.dataforseo.com/v3/on_page/summary/
interface DataForSeoOnPageSummaryItem {
  meta?: {
    title?: string;
    description?: string;
    canonical?: string;
    htags?: Record<string, string[]>; // e.g. { H1: ["title1"], H2: ["title2"]}
  };
  content?: {
    plain_text_word_count?: number;
    plain_text_rate?: number; // text to html ratio
    duplicate_content?: boolean; // This might be from a different check, summary provides overall
  };
  checks?: Record<string, boolean>; // e.g., "no_image_alt": true, "duplicate_title": false
  page_timing?: { // units are in seconds, need to convert to ms for LCP/TBT
    time_to_interactive?: number;
    dom_complete?: number;
    largest_contentful_paint?: number; 
    first_input_delay?: number; // TBT is approximated or from a different specific check
    cumulative_layout_shift?: number;
    onpage_score?: number; // 0-100
  };
  total_images_count?: number;
  images_without_alt_count?: number;
  total_links_count?: number; // internal + external
  internal_links_count?: number;
  broken_links_count?: number; // from checks
  is_https?: boolean;
  is_http?: boolean;
  is_canonical?: boolean;
  // mobile_friendly check might be in 'checks' or needs a specific endpoint
  // indexable related checks like 'is_robots_txt_disallowed', 'is_meta_robots_disallowed'
}


// Helper to make authenticated requests to DataForSEO API
const dataForSeoRequest = async (
  endpoint: string,
  login: string,
  password: string,
  method: 'GET' | 'POST' = 'POST',
  body: any = null
): Promise<DataForSeoTaskResponse> => {
  const url = DATA_FOR_SEO_BASE_URL + endpoint;
  const headers = new Headers();
  headers.append('Authorization', 'Basic ' + btoa(`${login}:${password}`));
  headers.append('Content-Type', 'application/json');

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method === 'POST') {
    options.body = JSON.stringify(body);
  }
  
  console.log(`DataForSEO Request: ${method} ${url}`, body ? `Body: ${JSON.stringify(body).substring(0,100)}...` : "");


  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`DataForSEO API error: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`DataForSEO API error (${endpoint}): ${response.status} ${response.statusText}. ${errorText.substring(0,200)}`);
  }
  return response.json();
};

// 1. Get OnPage Summary results instantly (Live Mode)
const getOnPageSummaryInstantly = async (targetUrl: string, login: string, password: string): Promise<DataForSeoOnPageSummaryItem> => {
  const payload: DataForSeoInstantPayload = {
    url: targetUrl,
    load_resources: true,
    enable_javascript: false, // Habilitar si es necesario, aumenta el costo y el tiempo
  };
  
  // El endpoint instant_pages espera un objeto, no un array de objetos.
  const response = await dataForSeoRequest(ON_PAGE_INSTANT_PAGES_ENDPOINT, login, password, 'POST', [payload]);

  if (response.status_code !== 20000 || !response.tasks || response.tasks.length === 0 || !response.tasks[0].result || response.tasks[0].result.length === 0) {
    throw new Error(`Failed to get OnPage Instant Summary for url ${targetUrl}: ${response.status_message}. Full response: ${JSON.stringify(response)}`);
  }
  
  // La estructura de la respuesta de instant_pages es un poco diferente.
  // El resultado está en tasks[0].result[0].items[0]
  const resultItem = response.tasks[0].result[0];
  if (!resultItem || !resultItem.items || resultItem.items.length === 0) {
     throw new Error(`No summary items found in DataForSEO instant response for ${targetUrl}. Full response: ${JSON.stringify(response)}`);
  }

  return resultItem.items[0] as DataForSeoOnPageSummaryItem;
};

// --- Data Mapping ---
// This is a crucial step. Maps the complex DataForSEO response to the simplified structure Gemini expects.
// This will need significant refinement based on actual API responses and desired report depth.
const mapDataForSeoToPromptStructure = (summary: DataForSeoOnPageSummaryItem, url: string): Partial<MockDataForSeoResponseForPrompt> => {
  
  // This is the structure Gemini was trained on with the mock data. We adapt to it.
  // We'll call this MockDataForSeoResponseForPrompt as it's what we *feed* to the prompt.
  const mapped: Partial<MockDataForSeoResponseForPrompt> = {
    target_url: url,
    on_page_summary: {
      page_title: summary.meta?.title,
      meta_description: summary.meta?.description,
      h1_tags: summary.meta?.htags?.H1 || (summary.meta?.htags?.h1 ? summary.meta.htags.h1 : []), // DataForSEO might use lowercase
      header_tags_structure: Object.entries(summary.meta?.htags || {}).reduce((acc, [key, value]) => {
        acc[key.toUpperCase()] = value.length;
        return acc;
      }, {} as Record<string, number>),
      content_quality_metrics: {
        word_count: summary.content?.plain_text_word_count,
        text_to_html_ratio: summary.content?.plain_text_rate,
        // duplicate_content_percentage needs a specific check or different endpoint.
        // For summary, 'duplicate_content' check might be a boolean.
        duplicate_content_percentage: summary.checks?.duplicate_content ? 100 : 0, // Simplified: 100 if true, 0 if false/undefined
      },
      image_analysis: {
        total_images: summary.total_images_count,
        images_missing_alt_text: summary.images_without_alt_count,
        // average_image_size_kb requires calculation or different endpoint
      },
      page_speed: {
        largest_contentful_paint_ms: summary.page_timing?.largest_contentful_paint ? Math.round(summary.page_timing.largest_contentful_paint * 1000) : undefined,
        // total_blocking_time_ms needs specific check (TBT often from Lighthouse or similar)
        // first_input_delay_ms from DataForSEO is often FID, not TBT. Use if available.
        total_blocking_time_ms: summary.page_timing?.first_input_delay ? Math.round(summary.page_timing.first_input_delay * 1000) : undefined,
        cumulative_layout_shift: summary.page_timing?.cumulative_layout_shift,
        performance_score: summary.page_timing?.onpage_score,
      },
      mobile_friendliness: {
        // 'mobile_friendly' check might be in summary.checks.is_mobile_friendly
        is_mobile_friendly: summary.checks?.mobile_friendly || summary.checks?.is_mobile_friendly, // check common variations
        viewport_defined: summary.checks?.viewport,
      },
      internal_linking: {
        total_internal_links: summary.internal_links_count,
        broken_internal_links: summary.checks?.broken_links ? 1 : (summary.broken_links_count || 0), // if boolean, assume 1 to indicate issue
      },
      duplicate_tags: {
        has_duplicate_title: summary.checks?.duplicate_title,
        has_duplicate_meta_description: summary.checks?.duplicate_description, // Or duplicate_meta_description
      },
      is_indexable: !(summary.checks?.is_robots_txt_disallowed || summary.checks?.is_meta_robots_disallowed || summary.checks?.noindex_meta_tag || summary.checks?.noindex_header),
      non_indexable_reason: 
        summary.checks?.is_robots_txt_disallowed ? "robots.txt" :
        (summary.checks?.is_meta_robots_disallowed || summary.checks?.noindex_meta_tag) ? "meta_noindex" :
        summary.checks?.noindex_header ? "x-robots-tag_noindex" :
        undefined,
    },
    // Off-page summary data is NOT available from OnPage Summary endpoint.
    // Gemini will be instructed that this data might be missing.
    off_page_summary: { 
        // These fields will be mostly undefined using only OnPage Summary
        estimated_domain_authority: undefined,
        referring_domains_count: undefined,
        backlinks_count: undefined,
    }
  };
  return mapped;
};

// This is the structure we will create from real DataForSEO data to feed into the prompt
// It's based on the original MockDataForSeoResponse structure for compatibility with the existing prompt.
interface MockDataForSeoResponseForPrompt {
  target_url: string;
  on_page_summary: {
    page_title?: string;
    meta_description?: string;
    h1_tags?: string[];
    header_tags_structure?: Record<string, number>;
    content_quality_metrics?: {
      word_count?: number;
      text_to_html_ratio?: number;
      duplicate_content_percentage?: number; 
    };
    image_analysis?: {
      total_images?: number;
      images_missing_alt_text?: number;
      average_image_size_kb?: number;
    };
    page_speed?: {
      largest_contentful_paint_ms?: number;
      total_blocking_time_ms?: number;
      cumulative_layout_shift?: number;
      performance_score?: number; 
    };
    mobile_friendliness?: {
      is_mobile_friendly?: boolean;
      viewport_defined?: boolean;
    };
    internal_linking?: {
      total_internal_links?: number;
      unique_internal_links?: number; // Might not be directly available, summay gives total internal
      broken_internal_links?: number;
    };
    duplicate_tags?: {
        has_duplicate_title?: boolean;
        has_duplicate_meta_description?: boolean;
    };
    is_indexable?: boolean;
    non_indexable_reason?: string;
  };
  off_page_summary: { 
    estimated_domain_authority?: number; 
    referring_domains_count?: number;
    backlinks_count?: number;
  };
}


const getGeminiApiKey = (): string | undefined => {
  return process.env.API_KEY;
};

// Updated prompt to acknowledge real data source and potential missing off-page data
const PROMPT_TEMPLATE = (url: string, dataForSeoJsonString: string): string => `
Eres un experto analista SEO de renombre mundial. Se te ha proporcionado un conjunto de datos técnicos obtenidos directamente de la API OnPage Summary de DataForSEO para el sitio web con URL "${url}".
Tu tarea es interpretar estos datos y generar un informe SEO exhaustivo y accionable.

Datos de DataForSEO OnPage Summary:
\`\`\`json
${dataForSeoJsonString}
\`\`\`

Instrucciones detalladas:
1.  Analiza CUIDADOSAMENTE los datos de DataForSEO proporcionados. Estos son datos reales del endpoint 'OnPage Summary'.
2.  Para cada "factorName" en "onPageAnalysis":
    *   Rellena el campo "currentObservation" basándote ESTRICTAMENTE en los datos de DataForSEO.
    *   Si un dato específico está presente (ej: \`page_title\`), úsalo directamente. Menciona el valor si es relevante.
    *   Si un dato específico no está explícitamente en el JSON de DataForSEO (ej. algunos aspectos de \`off_page_summary\` o métricas muy detalladas no cubiertas por OnPage Summary), indícalo claramente (ej: "DataForSEO OnPage Summary no proporcionó datos específicos sobre X." o "No se encontraron datos sobre X en la información de DataForSEO OnPage Summary.").
    *   "importance" debe explicar por qué el factor es crucial.
    *   "recommendation" debe ser coherente con la "currentObservation" derivada de DataForSEO.
3.  Para la sección "offPageAnalysis":
    *   Ten en cuenta que el endpoint OnPage Summary de DataForSEO tiene un enfoque limitado en datos off-page.
    *   Rellena "currentObservation" con la información disponible. Si no hay datos directos del OnPage Summary para un factor off-page, indícalo claramente (ej: "Los datos de OnPage Summary de DataForSEO no incluyen X.").
    *   Las recomendaciones para off-page pueden ser más generales si los datos son limitados.
4.  Para "overallSummary":
    *   "strengths" y "weaknesses" deben basarse ÚNICAMENTE en tu análisis de los datos de DataForSEO.
    *   "topRecommendations" deben ser acciones priorizadas basadas en los datos.
5.  El idioma de todo el contenido del JSON de salida debe ser español.
6.  La respuesta DEBE SER ÚNICAMENTE el objeto JSON bien formado, sin ningún texto adicional antes o después, y sin usar bloques de código markdown como \`\`\`json\`\`\` alrededor del JSON principal.

Formato JSON de Salida Esperado (igual que antes, pero las observaciones serán más realistas y algunas podrían indicar datos no disponibles):
{
  "analyzedUrl": "${url}",
  "onPageAnalysis": {
    "title": "Análisis SEO On-Page (Basado en Datos Reales de DataForSEO)",
    "introduction": "Este análisis detalla los aspectos SEO on-page de ${url}, interpretando los datos técnicos proporcionados por DataForSEO OnPage Summary para evaluar el estado actual y las oportunidades de mejora.",
    "factors": [
      {
        "factorName": "Etiqueta de Título (Title Tag)",
        "currentObservation": "[GEMINI: Basado en 'page_title' de DataForSEO. Ej: 'El título actual es \\\"...\". Tiene X caracteres.']",
        "importance": "Crucial para SEO; es lo primero que ven usuarios y motores de búsqueda. Indica el contenido de la página.",
        "recommendation": "[GEMINI: Recomendación basada en la observación. Ej: 'Optimizar para incluir palabra clave principal y mantenerse entre 50-60 caracteres.']"
      },
      // ... (resto de factores on-page como antes, Gemini adaptará currentObservation)
       {
        "factorName": "Meta Descripciones",
        "currentObservation": "[GEMINI: Basado en 'meta_description' de DataForSEO. Indicar si está ausente o presente, y su posible calidad/longitud.]",
        "importance": "Influyen en el CTR desde los SERPs, aunque no directamente en el ranking. Son un 'anuncio' para tu página.",
        "recommendation": "[GEMINI: Crear descripciones únicas y atractivas (150-160 caracteres) con un CTA, si es necesario según la observación.]"
      },
      {
        "factorName": "Encabezados (H1-H6)",
        "currentObservation": "[GEMINI: Basado en 'h1_tags' y 'header_tags_structure' de DataForSEO. Ej: 'Se encontró X H1. La estructura general es...']",
        "importance": "Estructuran el contenido para usuarios y motores de búsqueda, mejorando legibilidad y relevancia temática.",
        "recommendation": "[GEMINI: Usar un solo H1. Organizar el contenido lógicamente con H2-H6. Incluir palabras clave relevantes.]"
      },
      {
        "factorName": "Calidad y Optimización del Contenido",
        "currentObservation": "[GEMINI: Basado en 'content_quality_metrics' (word_count, text_to_html_ratio, duplicate_content_percentage). Ej: 'La página tiene X palabras. El porcentaje de contenido duplicado es Y%.']",
        "importance": "El contenido original, valioso y bien estructurado es fundamental para atraer y retener usuarios, y para el ranking.",
        "recommendation": "[GEMINI: Mejorar la originalidad si 'duplicate_content_percentage' es alto. Asegurar profundidad y relevancia. Optimizar para palabras clave.]"
      },
      {
        "factorName": "Optimización de Imágenes (Alt Text, Compresión)",
        "currentObservation": "[GEMINI: Basado en 'image_analysis' (total_images, images_missing_alt_text, average_image_size_kb). Ej: 'Hay X imágenes, Y de ellas sin texto alternativo. El tamaño promedio es Z KB.']",
        "importance": "El texto alternativo mejora la accesibilidad y el SEO de imágenes. La compresión afecta la velocidad de carga.",
        "recommendation": "[GEMINI: Añadir texto alt descriptivo a todas las imágenes. Comprimir imágenes para reducir su peso sin perder calidad visual.]"
      },
      {
        "factorName": "Velocidad del Sitio y Core Web Vitals",
        "currentObservation": "[GEMINI: Basado en 'page_speed' (LCP, TBT, CLS, performance_score). Ej: 'LCP es Xms, CLS es Y. La puntuación de rendimiento es Z/100.']",
        "importance": "Factor de ranking crucial. Impacta directamente la experiencia del usuario y las tasas de conversión.",
        "recommendation": "[GEMINI: Identificar cuellos de botella y optimizar. Mejorar LCP, TBT y CLS según las métricas observadas.]"
      },
      {
        "factorName": "Amigabilidad Móvil (Mobile-Friendliness)",
        "currentObservation": "[GEMINI: Basado en 'mobile_friendliness' (is_mobile_friendly, viewport_defined). Ej: 'El sitio es/no es amigable para móviles según DataForSEO. Viewport definido: sí/no.']",
        "importance": "Esencial para el ranking (mobile-first indexing) y para alcanzar a la mayoría de usuarios.",
        "recommendation": "[GEMINI: Asegurar diseño responsive, elementos táctiles adecuados y legibilidad si se detectan problemas.]"
      },
      {
        "factorName": "Enlaces Internos",
        "currentObservation": "[GEMINI: Basado en 'internal_linking' (total_internal_links, broken_internal_links). Ej: 'Se detectaron X enlaces internos, Y de ellos rotos.']",
        "importance": "Distribuyen la autoridad de la página (link equity), mejoran la navegación y ayudan a los motores a descubrir contenido.",
        "recommendation": "[GEMINI: Corregir enlaces rotos. Crear una estrategia de enlazado interno lógica con anchor text descriptivos.]"
      },
      {
        "factorName": "Indexabilidad",
        "currentObservation": "[GEMINI: Basado en 'is_indexable' y 'non_indexable_reason'. Ej: 'La página es/no es indexable. Razón: robots.txt/meta_noindex/ninguna.']",
        "importance": "Si una página no es indexable, no aparecerá en los resultados de búsqueda.",
        "recommendation": "[GEMINI: Si no es indexable y debería serlo, revisar la configuración (robots.txt, meta tags, x-robots-tag).]"
      },
      {
        "factorName": "Tags Duplicados",
        "currentObservation": "[GEMINI: Basado en 'duplicate_tags'. Ej: 'Se detectó/no se detectó título duplicado. Se detectó/no se detectó meta descripción duplicada.']",
        "importance": "Los tags duplicados pueden confundir a los motores de búsqueda y diluir la relevancia de las páginas.",
        "recommendation": "[GEMINI: Asegurar títulos y meta descripciones únicos para cada página indexable.]"
      }
    ]
  },
  "offPageAnalysis": {
    "title": "Análisis SEO Off-Page (Basado en Datos de DataForSEO OnPage Summary)",
    "introduction": "Evaluación de factores SEO externos a ${url}, utilizando los datos disponibles de DataForSEO OnPage Summary. Estos factores influyen en la autoridad y percepción del sitio. El OnPage Summary ofrece datos limitados para el off-page.",
    "factors": [
      {
        "factorName": "Perfil de Backlinks (Cantidad y Dominios de Referencia)",
        "currentObservation": "[GEMINI: Basado en 'off_page_summary' (referring_domains_count, backlinks_count) del JSON provisto. Si no hay datos, indicar 'DataForSEO OnPage Summary no proporciona estos datos detallados.']",
        "importance": "Los backlinks de calidad son un fuerte indicador de autoridad y confianza para los motores de búsqueda.",
        "recommendation": "[GEMINI: Enfocarse en adquirir backlinks de alta calidad de sitios relevantes. Diversificar el perfil de enlaces. Si no hay datos, sugerir usar herramientas específicas de backlinks.]"
      },
      {
        "factorName": "Autoridad de Dominio Estimada",
        "currentObservation": "[GEMINI: Basado en 'off_page_summary' (estimated_domain_authority). Si no, indicar 'DataForSEO OnPage Summary no proporciona esta métrica.']",
        "importance": "Una métrica predictiva de la capacidad de un sitio para rankear. Se construye con el tiempo.",
        "recommendation": "[GEMINI: Mejorar la autoridad general del dominio mediante la creación de contenido de calidad y la obtención de backlinks autorizados. Si no hay datos, sugerir consultar herramientas especializadas.]"
      },
      {
        "factorName": "Presencia en SEO Local (Google Business Profile)",
        "currentObservation": "[GEMINI: 'DataForSEO OnPage Summary no proporciona directamente datos de Google Business Profile. Este factor requeriría una verificación manual o herramientas de SEO local.']",
        "importance": "Fundamental para negocios con ubicaciones físicas o que sirven a áreas geográficas específicas.",
        "recommendation": "Si es un negocio local, optimizar el perfil de Google Business: completar información, obtener reseñas, publicar NAPs consistentes."
      },
      {
        "factorName": "Señales Sociales",
        "currentObservation": "[GEMINI: 'Los datos de DataForSEO OnPage Summary no incluyen métricas directas de señales sociales.']",
        "importance": "Aunque no son un factor de ranking directo, la actividad social puede influir indirectamente en la visibilidad y la generación de enlaces.",
        "recommendation": "Mantener una presencia activa en redes sociales relevantes, compartir contenido y fomentar la interacción."
      }
    ]
  },
  "overallSummary": {
    "title": "Resumen General y Prioridades Estratégicas (Datos de DataForSEO OnPage Summary)",
    "strengths": [
      "[GEMINI: Fortaleza 1 derivada de los datos de DataForSEO. Ej: 'Buena velocidad de carga (LCP de Xms).']",
      "[GEMINI: Fortaleza 2 derivada de los datos de DataForSEO. Ej: 'Alto número de palabras por página (X palabras).']"
    ],
    "weaknesses": [
      "[GEMINI: Debilidad 1 derivada de los datos de DataForSEO. Ej: 'X imágenes sin texto alternativo.']",
      "[GEMINI: Debilidad 2 derivada de los datos de DataForSEO. Ej: 'CLS de Y, indica problemas de estabilidad visual.']"
    ],
    "topRecommendations": [
      {
        "priority": 1,
        "action": "[GEMINI: Acción de alta prioridad basada en DataForSEO. Ej: 'Corregir las X imágenes sin texto alternativo.']",
        "reasoning": "[GEMINI: Razón de la prioridad. Ej: 'Impacto directo en accesibilidad y SEO de imágenes, relativamente fácil de implementar.']"
      },
      // ... (resto de recomendaciones como antes, Gemini adaptará)
      {
        "priority": 2,
        "action": "[GEMINI: Acción de prioridad media basada en DataForSEO. Ej: 'Mejorar el Cumulative Layout Shift (CLS) que actualmente es Y.']",
        "reasoning": "[GEMINI: Razón. Ej: 'Afecta la experiencia del usuario y es un Core Web Vital.']"
      },
      {
        "priority": 3,
        "action": "[GEMINI: Acción de prioridad baja/media basada en DataForSEO. Ej: 'Considerar estrategias para aumentar la autoridad de dominio (actualmente X/100, si el dato está disponible).']",
        "reasoning": "[GEMINI: Razón. Ej: 'Es un esfuerzo a largo plazo pero fundamental para la competitividad en rankings. Si no hay dato de autoridad, se puede omitir o generalizar.']"
      }
    ]
  }
}
`;

export const generateSeoReport = async (
  url: string, 
  dataForSeoLogin: string, 
  dataForSeoPassword: string,
  setLoadingMessage: (message: string) => void
): Promise<GeminiSeoReportResponse> => {
  const geminiApiKey = getGeminiApiKey();
  if (!geminiApiKey) {
    console.error("API Key for Gemini is not configured.");
    throw new Error("Clave API de Gemini no configurada. Revisa la configuración del entorno.");
  }
  if (!dataForSeoLogin || !dataForSeoPassword) {
     throw new Error("Credenciales de DataForSEO (login/password) no configuradas.");
  }

  setLoadingMessage("Paso 1/2: Obteniendo análisis de DataForSEO (modo live)...");
  const dataForSeoSummary = await getOnPageSummaryInstantly(url, dataForSeoLogin, dataForSeoPassword);
  
  // Map the real DataForSEO data to the structure Gemini expects
  const mappedDataForPrompt = mapDataForSeoToPromptStructure(dataForSeoSummary, url);
  const dataForSeoJsonString = JSON.stringify(mappedDataForPrompt, null, 2);
  
  // console.log("Mapped DataForSEO for Gemini prompt:", dataForSeoJsonString);


  setLoadingMessage("Paso 2/2: Generando informe con IA de Gemini...");
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  const prompt = PROMPT_TEMPLATE(url, dataForSeoJsonString);

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let jsonStr = response.text?.trim() || "";
    
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }

    try {
      const parsedData = JSON.parse(jsonStr) as GeminiSeoReportResponse;
      if (
        !parsedData.analyzedUrl ||
        !parsedData.onPageAnalysis || !parsedData.onPageAnalysis.factors ||
        !parsedData.offPageAnalysis || !parsedData.offPageAnalysis.factors ||
        !parsedData.overallSummary || !parsedData.overallSummary.topRecommendations
      ) {
        console.error("Respuesta JSON de Gemini no tiene la estructura esperada:", parsedData);
        throw new Error("La respuesta de la IA no tuvo el formato esperado. Intenta de nuevo.");
      }
      return parsedData;
    } catch (e) {
      console.error("Fallo al parsear la respuesta JSON de Gemini:", e, "\nRaw response text:\n", jsonStr);
      throw new Error(`La respuesta de la IA no pudo ser procesada como JSON válido. Raw: ${jsonStr.substring(0,1000)}`);
    }

  } catch (error) {
    console.error("Error al llamar a la API de Gemini:", error);
    if (error instanceof Error && error.message.includes("API Key not valid")) {
        throw new Error("Clave API de Gemini inválida. Por favor, verifica tu clave.");
    }
     if (error instanceof Error && error.message.includes("quota")) {
      throw new Error("Se ha excedido la cuota de la API de Gemini. Inténtalo más tarde.");
    }
    throw new Error(`Error de comunicación con el servicio de IA: ${error instanceof Error ? error.message : String(error)}`);
  }
};
