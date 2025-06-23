import React from 'react';
import type { GeminiSeoReportResponse } from '../types';
import ScoreGauge from './ScoreGauge';
import RecommendationCard from './RecommendationCard';

interface VisualReportProps {
  report: GeminiSeoReportResponse;
}

const VisualReport: React.FC<VisualReportProps> = ({ report }) => {
  const { executiveSummary, detailedAnalysis, actionPlan } = report;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#333', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Executive Summary */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h2>{executiveSummary.title}</h2>
        <p>{executiveSummary.introduction}</p>
        
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', margin: '20px 0' }}>
          <ScoreGauge score={executiveSummary.overallScore.performance} title="Rendimiento" />
          <ScoreGauge score={executiveSummary.overallScore.accessibility} title="Accesibilidad" />
          <ScoreGauge score={executiveSummary.overallScore.bestPractices} title="Buenas Prácticas" />
          <ScoreGauge score={executiveSummary.overallScore.seo} title="SEO" />
        </div>

        <h3>Recomendaciones Principales</h3>
        {executiveSummary.topRecommendations.map((rec, index) => (
          <div key={index} style={{ borderLeft: '3px solid #4caf50', paddingLeft: '10px', marginBottom: '10px' }}>
            <strong>{rec.recommendation}</strong>: {rec.description}
          </div>
        ))}
      </section>

      {/* Detailed Analysis */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Análisis Detallado</h2>
        {detailedAnalysis.map((analysis, index) => (
          <div key={index} style={{ marginBottom: '20px' }}>
            <h3>{analysis.category} - Puntuación: {analysis.score}/100</h3>
            <p>{analysis.introduction}</p>
            {analysis.findings.map((finding, findIndex) => (
              <div key={findIndex} style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px', marginBottom: '10px' }}>
                <h4>{finding.title}</h4>
                <p><strong>Observación:</strong> {finding.observation}</p>
                <p><strong>Recomendación:</strong> {finding.recommendation}</p>
              </div>
            ))}
          </div>
        ))}
      </section>

      {/* Action Plan */}
      <section>
        <h2>Plan de Acción</h2>
        {actionPlan.map((item, index) => (
          <RecommendationCard
            key={index}
            priority={item.priority as any}
            area={item.area}
            action={item.action}
            details={item.details}
            impact={item.impact}
          />
        ))}
      </section>
    </div>
  );
};

export default VisualReport;
