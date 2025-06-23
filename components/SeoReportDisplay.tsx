
import React from 'react';
import type { SeoReportData, SeoSection, SeoFactorItem, PrioritizedRecommendation, OverallSummary } from '../types';

interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, icon, children }) => (
  <div className="bg-slate-800 shadow-xl rounded-lg p-6 mb-8 transform transition-all hover:shadow-sky-500/30 hover:-translate-y-1 duration-300">
    <div className="flex items-center mb-4">
      {icon && <span className="mr-3 text-sky-400">{icon}</span>}
      <h2 className="text-2xl font-semibold text-sky-400">{title}</h2>
    </div>
    {children}
  </div>
);

const OnPageIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const OffPageIcon: React.FC = () => (
 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const SummaryIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FactorItemDisplay: React.FC<{ item: SeoFactorItem }> = ({ item }) => (
  <div className="mb-6 p-4 border border-slate-700 rounded-md bg-slate-700/30">
    <h4 className="text-lg font-semibold text-sky-300">{item.factorName}</h4>
    <p className="text-sm text-slate-300 mt-1"><strong className="text-slate-100">Observación:</strong> {item.currentObservation}</p>
    <p className="text-sm text-slate-300 mt-1"><strong className="text-slate-100">Importancia:</strong> {item.importance}</p>
    <p className="text-sm text-slate-300 mt-1"><strong className="text-slate-100">Recomendación:</strong> {item.recommendation}</p>
  </div>
);

const SectionDisplay: React.FC<{ section: SeoSection, icon: React.ReactNode }> = ({ section, icon }) => (
  <SectionCard title={section.title} icon={icon}>
    <p className="text-slate-300 mb-6 italic">{section.introduction}</p>
    {section.factors.map((factor, index) => (
      <FactorItemDisplay key={index} item={factor} />
    ))}
  </SectionCard>
);

const RecommendationItemDisplay: React.FC<{ item: PrioritizedRecommendation }> = ({ item }) => (
    <li className="mb-4 p-4 border border-slate-700 rounded-md bg-slate-700/30">
        <div className="flex items-center mb-1">
            <span className={`mr-2 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${item.priority === 1 ? 'bg-red-500' : item.priority === 2 ? 'bg-yellow-500' : 'bg-green-500'}`}>
                {item.priority}
            </span>
            <h4 className="text-md font-semibold text-sky-300">{item.action}</h4>
        </div>
        <p className="text-sm text-slate-300 ml-8">{item.reasoning}</p>
    </li>
);

const SummaryDisplay: React.FC<{ summary: OverallSummary }> = ({ summary }) => (
  <SectionCard title={summary.title} icon={<SummaryIcon />}>
    <div className="grid md:grid-cols-2 gap-6 mb-6">
      <div>
        <h3 className="text-xl font-semibold text-green-400 mb-2">Fortalezas</h3>
        {summary.strengths.length > 0 ? (
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            {summary.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        ) : <p className="text-slate-400 italic">No se identificaron fortalezas específicas.</p>}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-red-400 mb-2">Debilidades</h3>
         {summary.weaknesses.length > 0 ? (
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            {summary.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        ) : <p className="text-slate-400 italic">No se identificaron debilidades específicas.</p>}
      </div>
    </div>
    <div>
      <h3 className="text-xl font-semibold text-sky-300 mb-3">Principales Recomendaciones</h3>
       {summary.topRecommendations.length > 0 ? (
          <ul className="space-y-3">
            {summary.topRecommendations.sort((a,b) => a.priority - b.priority).map((rec, index) => (
              <RecommendationItemDisplay key={index} item={rec} />
            ))}
          </ul>
        ): <p className="text-slate-400 italic">No hay recomendaciones prioritarias en este momento.</p>}
    </div>
  </SectionCard>
);


export const SeoReportDisplay: React.FC<{ report: SeoReportData }> = ({ report }) => {
  return (
    <div className="mt-8">
      <div className="text-center mb-8 p-4 bg-slate-700 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-sky-400">Informe SEO para:</h2>
        <a href={report.analyzedUrl} target="_blank" rel="noopener noreferrer" className="text-lg text-sky-300 hover:text-sky-200 underline break-all">
          {report.analyzedUrl}
        </a>
      </div>
      
      <SectionDisplay section={report.onPageAnalysis} icon={<OnPageIcon />} />
      <SectionDisplay section={report.offPageAnalysis} icon={<OffPageIcon />} />
      <SummaryDisplay summary={report.overallSummary} />

    </div>
  );
};
