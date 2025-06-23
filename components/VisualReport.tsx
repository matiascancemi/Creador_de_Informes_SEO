import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { GeminiSeoReportResponse } from '../types';
import ScoreGauge from './ScoreGauge';
import RecommendationCard from './RecommendationCard';

// --- Iconos ---
const PerformanceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;
const SeoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const ContentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>;
const OffPageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;

interface VisualReportProps {
  report: GeminiSeoReportResponse;
}

const VisualReport: React.FC<VisualReportProps> = ({ report }) => {
  const { analyzedUrl, strategyOverview, executiveSummary, detailedAnalysis, actionPlan } = report;
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = () => {
    const input = reportRef.current;
    if (!input) return;

    // A4 dimensions in mm: 210 x 297
    const a4Width = 210;
    const a4Height = 297;

    html2canvas(input, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      width: input.scrollWidth,
      height: input.scrollHeight,
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = a4Width;
      const pageHeight = a4Height;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`informe-seo-${new URL(analyzedUrl).hostname}.pdf`);
    });
  };

  const renderStrategyIcon = (title: string) => {
    const style = { width: '32px', height: '32px', color: '#0052cc' };
    if (title.includes('On-Page')) return <div style={style}><SeoIcon /></div>;
    if (title.includes('Off-Page')) return <div style={style}><OffPageIcon /></div>;
    if (title.includes('Contenidos')) return <div style={style}><ContentIcon /></div>;
    return null;
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
      <div ref={reportRef} className="bg-white text-gray-800 p-12 rounded-lg shadow-2xl printable-area">
        <header className="flex justify-between items-center border-b-2 pb-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Informe de Auditoría SEO</h1>
            <a href={analyzedUrl} className="text-blue-600 hover:underline">{analyzedUrl}</a>
          </div>
          <img src="/logo.jpg" alt="Aquilae Logo" className="h-16" />
        </header>

        {/* Strategy Overview */}
        <section className="mb-12 bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-3xl font-bold mb-4 text-blue-800">{strategyOverview.title}</h2>
          <p className="text-lg text-gray-700 mb-6">{strategyOverview.introduction}</p>
          <div className="grid md:grid-cols-3 gap-6">
            {strategyOverview.sections.map((section, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 mr-4">{renderStrategyIcon(section.title)}</div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{section.title}</h3>
                  <p className="text-gray-600">{section.description}</p>
                </div>
              </div>
            ))}
          </div>
           <div className="text-center mt-8">
            <a href="https://aquilae.agency/planes/" target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-600 transition-transform transform hover:scale-105 text-lg">
              Ver Planes de Mejora
            </a>
          </div>
        </section>

        {/* Executive Summary */}
        <section className="mb-12 page-break">
          <h2 className="text-3xl font-bold border-b pb-2 mb-4">{executiveSummary.title}</h2>
          <p className="mb-6">{executiveSummary.introduction}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-8">
            <ScoreGauge score={executiveSummary.overallScore.performance} title="Rendimiento" />
            <ScoreGauge score={executiveSummary.overallScore.accessibility} title="Accesibilidad" />
            <ScoreGauge score={executiveSummary.overallScore.bestPractices} title="Buenas Prácticas" />
            <ScoreGauge score={executiveSummary.overallScore.seo} title="SEO" />
          </div>
        </section>

        {/* Action Plan */}
        <section className="mb-12 page-break">
          <h2 className="text-3xl font-bold border-b pb-2 mb-4">Plan de Acción Priorizado</h2>
          {actionPlan.map((item, index) => (
            <RecommendationCard key={index} {...item} />
          ))}
        </section>

        {/* Detailed Analysis */}
        <section className="page-break">
          <h2 className="text-3xl font-bold border-b pb-2 mb-4">Análisis Técnico Detallado</h2>
          {detailedAnalysis.map((analysis, index) => (
            <div key={index} className="mb-6 p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center">
                <h3 className="text-2xl font-semibold">{analysis.category} - Puntuación: {analysis.score}/100</h3>
              </div>
              <p className="text-gray-600 my-2">{analysis.introduction}</p>
              {analysis.findings.map((finding, findIndex) => (
                <div key={findIndex} className="bg-white p-3 rounded-md mt-2 border">
                  <h4 className="font-bold text-lg">{finding.title}</h4>
                  <p><strong className="text-gray-700">Observación:</strong> {finding.observation}</p>
                  <p><strong className="text-green-700">Recomendación:</strong> {finding.recommendation}</p>
                </div>
              ))}
            </div>
          ))}
        </section>
      </div>
    </>
  );
};

export default VisualReport;
