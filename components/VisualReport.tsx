import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { GeminiSeoReportResponse } from '../types';
import ScoreGauge from './ScoreGauge';
import RecommendationCard from './RecommendationCard';

// --- Iconos (Componentes SVG simples para evitar dependencias externas) ---
const PerformanceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;
const AccessibilityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const BestPracticesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SeoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;


interface VisualReportProps {
  report: GeminiSeoReportResponse;
}

const VisualReport: React.FC<VisualReportProps> = ({ report }) => {
  const { analyzedUrl, executiveSummary, detailedAnalysis, actionPlan } = report;
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = () => {
    const input = reportRef.current;
    if (!input) return;

    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const height = pdfWidth / ratio;
      
      let position = 0;
      let remainingHeight = canvasHeight;

      while (remainingHeight > 0) {
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvasWidth;
        pageCanvas.height = canvasHeight * (pdfHeight/height);
        
        const pageCtx = pageCanvas.getContext('2d');
        pageCtx?.drawImage(canvas, 0, position, canvasWidth, pageCanvas.height, 0, 0, pageCanvas.width, pageCanvas.height);

        const pageImgData = pageCanvas.toDataURL('image/png');
        if (position > 0) {
          pdf.addPage();
        }
        pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, height);
        
        remainingHeight -= pageCanvas.height;
        position += pageCanvas.height;
      }
      
      pdf.save(`informe-seo-${new URL(analyzedUrl).hostname}.pdf`);
    });
  };

  const renderCategoryIcon = (category: string) => {
    const style = { width: '24px', height: '24px', marginRight: '10px' };
    switch (category) {
      case 'Rendimiento Web': return <div style={style}><PerformanceIcon /></div>;
      case 'SEO On-Page': return <div style={style}><SeoIcon /></div>;
      default: return null;
    }
  };

  return (
    <>
      <div className="w-full flex justify-end mb-4">
        <button
          onClick={handleDownloadPdf}
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <div className="w-5 h-5 mr-2"><DownloadIcon /></div>
          Descargar PDF
        </button>
      </div>
      <div ref={reportRef} className="bg-white text-gray-800 p-8 rounded-lg shadow-2xl">
        {/* Report Header */}
        <header className="flex justify-between items-center border-b-2 pb-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Informe de Auditoría SEO</h1>
            <a href={analyzedUrl} className="text-blue-600 hover:underline">{analyzedUrl}</a>
          </div>
          <img src="/logo.jpg" alt="Aquilae Logo" className="h-12" />
        </header>

        {/* Executive Summary */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold border-b pb-2 mb-4">{executiveSummary.title}</h2>
          <p className="mb-6">{executiveSummary.introduction}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
            <ScoreGauge score={executiveSummary.overallScore.performance} title="Rendimiento" />
            <ScoreGauge score={executiveSummary.overallScore.accessibility} title="Accesibilidad" />
            <ScoreGauge score={executiveSummary.overallScore.bestPractices} title="Buenas Prácticas" />
            <ScoreGauge score={executiveSummary.overallScore.seo} title="SEO" />
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2">Recomendaciones Principales</h3>
            <ul className="list-disc list-inside">
              {executiveSummary.topRecommendations.map((rec, index) => (
                <li key={index} className="mb-2">
                  <strong>{rec.recommendation}:</strong> {rec.description}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Detailed Analysis */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold border-b pb-2 mb-4">Análisis Detallado</h2>
          {detailedAnalysis.map((analysis, index) => (
            <div key={index} className="mb-6 p-4 border rounded-lg">
              <div className="flex items-center">
                {renderCategoryIcon(analysis.category)}
                <h3 className="text-xl font-semibold">{analysis.category} - Puntuación: {analysis.score}/100</h3>
              </div>
              <p className="text-gray-600 my-2">{analysis.introduction}</p>
              {analysis.findings.map((finding, findIndex) => (
                <div key={findIndex} className="bg-gray-50 p-3 rounded-md mt-2">
                  <h4 className="font-bold">{finding.title}</h4>
                  <p><strong className="text-gray-700">Observación:</strong> {finding.observation}</p>
                  <p><strong className="text-green-700">Recomendación:</strong> {finding.recommendation}</p>
                </div>
              ))}
            </div>
          ))}
        </section>

        {/* Action Plan */}
        <section>
          <h2 className="text-2xl font-bold border-b pb-2 mb-4">Plan de Acción</h2>
          {actionPlan.map((item, index) => (
            <RecommendationCard
              key={index}
              priority={item.priority}
              area={item.area}
              action={item.action}
              details={item.details}
              impact={item.impact}
            />
          ))}
        </section>
      </div>
    </>
  );
};

export default VisualReport;
