
import React, { useState } from 'react';

interface UrlInputFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export const UrlInputForm: React.FC<UrlInputFormProps> = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setInputError("Por favor, introduce una URL.");
      return;
    }
    try {
      new URL(url); // Basic URL validation
      setInputError(null);
      onSubmit(url);
    } catch (_) {
      setInputError("Por favor, introduce una URL válida (ej: https://ejemplo.com).");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="url-input" className="block text-sm font-medium text-slate-300 mb-1">
          URL del Sitio Web
        </label>
        <div className="flex rounded-md shadow-sm">
           <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-600 bg-slate-700 text-slate-400 sm:text-sm">
            https://
          </span>
          <input
            type="text"
            name="url-input"
            id="url-input"
            value={url.replace(/^https?:\/\//, '')}
            onChange={(e) => setUrl(`https://${e.target.value.replace(/^https?:\/\//, '')}`)}
            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-sky-500 focus:border-sky-500 sm:text-sm border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400"
            placeholder="ejemplo.com"
            disabled={isLoading}
          />
        </div>
        {inputError && <p className="mt-2 text-sm text-red-400">{inputError}</p>}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors duration-150"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generando Informe...
          </>
        ) : (
          'Generar Informe SEO'
        )}
      </button>
    </form>
  );
};
