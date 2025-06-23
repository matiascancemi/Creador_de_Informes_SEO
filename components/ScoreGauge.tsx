import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ScoreGaugeProps {
  score: number;
  title: string;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, title }) => {
  const scoreColor = score > 89 ? '#4caf50' : score > 49 ? '#ff9800' : '#f44336';

  const data = {
    datasets: [
      {
        data: [score, 100 - score],
        backgroundColor: [scoreColor, '#e0e0e0'],
        borderColor: [scoreColor, '#e0e0e0'],
        borderWidth: 1,
        circumference: 180,
        rotation: 270,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '80%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
  };

  return (
    <div style={{ textAlign: 'center', width: '150px', margin: '0 auto' }}>
      <div style={{ position: 'relative', width: '100%', paddingTop: '50%' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <Doughnut data={data} options={options} />
          <div
            style={{
              position: 'absolute',
              top: '60%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '2rem',
              fontWeight: 'bold',
              color: scoreColor,
            }}
          >
            {score}
          </div>
        </div>
      </div>
      <h3 style={{ marginTop: '-1rem', fontWeight: 'normal' }}>{title}</h3>
    </div>
  );
};

export default ScoreGauge;
