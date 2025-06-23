export const GEMINI_MODEL_NAME = "gemini-2.5-flash-preview-04-17";
export const APP_TITLE = "Generador de Informes SEO con IA";

// DataForSEO API Configuration
export const DATA_FOR_SEO_LOGIN_ENV_VAR = "DATA_FOR_SEO_LOGIN";
export const DATA_FOR_SEO_PASSWORD_ENV_VAR = "DATA_FOR_SEO_PASSWORD";
export const DATA_FOR_SEO_BASE_URL = "https://api.dataforseo.com";
export const ON_PAGE_TASK_POST_ENDPOINT = "/v3/on_page/task_post";
export const ON_PAGE_ID_LIST_ENDPOINT = "/v3/on_page/id_list"; // Used to check task status
export const ON_PAGE_SUMMARY_ENDPOINT = "/v3/on_page/summary"; // Used to get results

// Polling configuration for DataForSEO tasks
export const DATA_FOR_SEO_POLL_INTERVAL_MS = 5000; // 5 seconds
export const DATA_FOR_SEO_MAX_POLLS = 24; // 24 * 5s = 2 minutes timeout
