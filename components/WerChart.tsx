import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ExperimentData } from '../types';

interface WerChartProps {
  data: ExperimentData[];
}

export const WerChart: React.FC<WerChartProps> = ({ data }) => {
  // Group data by range
  const ranges = [
    { name: '< 10%', max: 0.1, count: 0 },
    { name: '10-20%', max: 0.2, count: 0 },
    { name: '20-40%', max: 0.4, count: 0 },
    { name: '40%+', max: 999, count: 0 },
  ];

  data.forEach(d => {
    const range = ranges.find(r => d.wer <= r.max);
    if (range) range.count++;
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={ranges}>
          <XAxis 
            dataKey="name" 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip 
            cursor={{fill: 'transparent'}}
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {ranges.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={['#4ade80', '#facc15', '#fb923c', '#f87171'][index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
