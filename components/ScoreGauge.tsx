import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ScoreGaugeProps {
  score: number;
  title: string;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, title }) => {
  const scoreColor = score > 89 ? '#22c55e' : score > 49 ? '#f59e0b' : '#ef4444'; // green-500, amber-500, red-500

  const data = {
    datasets: [
      {
        data: [score, 100 - score],
        backgroundColor: [scoreColor, '#f3f4f6'], // bg-gray-100
        borderColor: [scoreColor, '#f3f4f6'],
        borderWidth: 0,
        circumference: 360,
        rotation: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
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
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow">
      <div className="relative w-32 h-32">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold" style={{ color: scoreColor }}>
            {score}
          </span>
        </div>
      </div>
      <h3 className="mt-2 text-lg font-semibold text-gray-700">{title}</h3>
    </div>
  );
};

export default ScoreGauge;
