import React from 'react';

// --- Iconos ---
const HighPriorityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>;
const MediumPriorityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LowPriorityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>;


interface RecommendationCardProps {
  priority: 'Alta' | 'Media' | 'Baja';
  area: string;
  action: string;
  details: string;
  impact: string;
}

const priorityConfig = {
  Alta: { color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: <HighPriorityIcon /> },
  Media: { color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', icon: <MediumPriorityIcon /> },
  Baja: { color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200', icon: <LowPriorityIcon /> },
};

const RecommendationCard: React.FC<RecommendationCardProps> = ({ priority, area, action, details, impact }) => {
  const config = priorityConfig[priority];

  return (
    <div className={`p-4 mb-4 border-l-4 rounded-r-lg ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start">
        <div className={`w-6 h-6 mr-3 ${config.color}`}>
          {config.icon}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-bold ${config.color}`}>{action}</h3>
          <p className="text-sm text-gray-500 mt-1">
            <strong>Área:</strong> {area} | <strong>Impacto:</strong> {impact}
          </p>
          <p className="mt-2 text-gray-700">{details}</p>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
