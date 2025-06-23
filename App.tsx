
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UrlInputForm } from './components/UrlInputForm';
import VisualReport from './components/VisualReport'; // Importar el nuevo componente
import { LoadingIndicator } from './components/LoadingIndicator';
import { ErrorMessage } from './components/ErrorMessage';
import { generateSeoReport } from './services/geminiService';
import type { SeoReportData } from './types';
import { APP_TITLE, DATA_FOR_SEO_LOGIN_ENV_VAR, DATA_FOR_SEO_PASSWORD_ENV_VAR } from './constants';

const App: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [report, setReport] = useState<SeoReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Generando informe, por favor espera...');
  const [error, setError] = useState<string | null>(null);
  const [apiKeyErrorState, setApiKeyErrorState] = useState<{gemini: boolean, dataForSeo: boolean}>({gemini: false, dataForSeo: false});


  const handleSubmit = useCallback(async (submittedUrl: string) => {
    const geminiApiKey = process.env.API_KEY;
    const dataForSeoLogin = process.env.DATA_FOR_SEO_LOGIN;
    const dataForSeoPassword = process.env.DATA_FOR_SEO_PASSWORD;

    let currentErrors: string[] = [];
    let newApiKeyErrorState = {gemini: false, dataForSeo: false};

    if (!geminiApiKey) {
      currentErrors.push("La clave API de Gemini ("+ "API_KEY" + ") no está configurada.");
      newApiKeyErrorState.gemini = true;
    }
    if (!dataForSeoLogin || !dataForSeoPassword) {
      currentErrors.push(`Las credenciales de DataForSEO (${DATA_FOR_SEO_LOGIN_ENV_VAR} y/o ${DATA_FOR_SEO_PASSWORD_ENV_VAR}) no están configuradas.`);
      newApiKeyErrorState.dataForSeo = true;
    }
    
    setApiKeyErrorState(newApiKeyErrorState);

    if (currentErrors.length > 0) {
      setError(currentErrors.join("\n"));
      setIsLoading(false);
      return;
    }

    setUrl(submittedUrl);
    setIsLoading(true);
    setLoadingMessage('Iniciando análisis SEO...');
    setError(null);
    setReport(null);

    try {
      // Pass credentials to the service
      const generatedReport = await generateSeoReport(
        submittedUrl, 
        dataForSeoLogin!, // Known to be defined if we reach here
        dataForSeoPassword!, // Known to be defined if we reach here
        (newMessage) => setLoadingMessage(newMessage) // Callback for loading messages
      );
      setReport(generatedReport);
      setError(null); // Clear errors on success
    } catch (err) {
      console.error("Error generando el informe SEO:", err);
      if (err instanceof Error) {
        setError(`Error al generar el informe: ${err.message}. Verifique la URL, sus credenciales API y la consola para más detalles.`);
      } else {
        setError("Ocurrió un error desconocido al generar el informe.");
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('Generando informe, por favor espera...'); // Reset loading message
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex flex-col items-center p-4">
      <Header title={APP_TITLE} />
      <main className="container mx-auto px-4 py-8 flex-grow w-full max-w-5xl">
        <div className="bg-white shadow-xl rounded-xl p-6 md:p-10">
          <p className="text-center text-gray-600 mb-6 text-lg">
            Introduce la URL de un sitio web para generar un análisis SEO completo.
          </p>
          <UrlInputForm onSubmit={handleSubmit} isLoading={isLoading} />
          
          {(apiKeyErrorState.gemini || apiKeyErrorState.dataForSeo) && error && (
             <div className={`mt-6 ${apiKeyErrorState.gemini && apiKeyErrorState.dataForSeo ? 'bg-red-700 border-red-900' : apiKeyErrorState.gemini ? 'bg-red-600 border-red-800' : 'bg-yellow-600 border-yellow-800'} text-white px-4 py-3 rounded-lg relative shadow-lg`} role="alert">
                <strong className="font-bold">¡Aviso de Configuración! </strong>
                <span className="block sm:inline whitespace-pre-line">{error}</span>
             </div>
           )}

          {isLoading && <LoadingIndicator message={loadingMessage} />}
          {error && !isLoading && (!apiKeyErrorState.gemini && !apiKeyErrorState.dataForSeo) && <ErrorMessage message={error} />}
          
          {report && !isLoading && (!error || (!apiKeyErrorState.gemini && !apiKeyErrorState.dataForSeo)) && (
            <div className="mt-10 animate-fadeIn">
              <VisualReport report={report} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
