import React from 'react';

interface RecommendationCardProps {
  priority: 'Alta' | 'Media' | 'Baja';
  area: string;
  action: string;
  details: string;
  impact: string;
}

const priorityColors = {
  Alta: '#f44336',
  Media: '#ff9800',
  Baja: '#4caf50',
};

const RecommendationCard: React.FC<RecommendationCardProps> = ({ priority, area, action, details, impact }) => {
  return (
    <div style={{
      border: `1px solid ${priorityColors[priority]}`,
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, color: priorityColors[priority] }}>{action}</h3>
        <span style={{
          backgroundColor: priorityColors[priority],
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: 'bold',
        }}>
          Prioridad {priority}
        </span>
      </div>
      <p style={{ margin: '0 0 8px 0', fontStyle: 'italic', color: '#666' }}>
        <strong>Área:</strong> {area}
      </p>
      <p style={{ margin: 0 }}>{details}</p>
      <p style={{ marginTop: '12px', fontWeight: 'bold' }}>
        <strong>Impacto:</strong> {impact}
      </p>
    </div>
  );
};

export default RecommendationCard;
