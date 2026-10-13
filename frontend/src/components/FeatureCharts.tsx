import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { FeatureBundle } from '../types';
import { Activity, BarChart3, TrendingUp, Volume2 } from 'lucide-react';

interface FeatureChartsProps {
  refFeatures: FeatureBundle;
  partFeatures: FeatureBundle;
  currentTime?: number;
}

export const FeatureCharts: React.FC<FeatureChartsProps> = ({
  refFeatures,
  partFeatures,
  currentTime,
}) => {
  const [activeTab, setActiveTab] = useState<'pitch' | 'energy' | 'rate'>('pitch');

  // Merge timeseries into a unified timeline for contrastive comparison
  const refPts = refFeatures.timeseries || [];
  const partPts = partFeatures.timeseries || [];

  // Align points on a common timestamp grid
  const maxTime = Math.max(
    refPts.length ? refPts[refPts.length - 1].time : 0,
    partPts.length ? partPts[partPts.length - 1].time : 0
  );

  const mergedData: any[] = [];
  const step = 0.1; // 100ms interval samples for plotting
  for (let t = 0; t <= maxTime; t += step) {
    const curT = Math.round(t * 10) / 10;
    
    // Find closest ref point
    const rClosest = refPts.reduce((prev, curr) => 
      Math.abs(curr.time - curT) < Math.abs(prev.time - curT) ? curr : prev, refPts[0] || {}
    );
    // Find closest part point
    const pClosest = partPts.reduce((prev, curr) => 
      Math.abs(curr.time - curT) < Math.abs(prev.time - curT) ? curr : prev, partPts[0] || {}
    );

    mergedData.push({
      time: curT,
      ref_pitch: rClosest?.pitch_hz ?? null,
      part_pitch: pClosest?.pitch_hz ?? null,
      ref_energy: rClosest?.rms_energy ?? 0,
      part_energy: pClosest?.rms_energy ?? 0,
      ref_rate: rClosest?.speaking_rate_wpm ?? null,
      part_rate: pClosest?.speaking_rate_wpm ?? null,
    });
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-100">
            Acoustic Feature Comparison Curves
          </h3>
        </div>

        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('pitch')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeTab === 'pitch'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pitch (F0 Contour)
          </button>
          <button
            onClick={() => setActiveTab('energy')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeTab === 'energy'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            RMS Energy Dynamics
          </button>
          <button
            onClick={() => setActiveTab('rate')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeTab === 'rate'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Speaking Rate (WPM)
          </button>
        </div>
      </div>

      {/* Charts Container */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'pitch' ? (
            <LineChart data={mergedData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                tickFormatter={(val) => `${val}s`} 
                fontSize={11}
              />
              <YAxis 
                stroke="#64748b" 
                domain={['auto', 'auto']} 
                unit="Hz" 
                fontSize={11}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                labelFormatter={(val) => `Time: ${val}s`}
                formatter={(val: any) => [val ? `${val} Hz` : 'Unvoiced', '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey="ref_pitch"
                name="Reference F0 (Ideal)"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="part_pitch"
                name="Participant F0 (Measured)"
                stroke="#ec4899"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            </LineChart>
          ) : activeTab === 'energy' ? (
            <AreaChart data={mergedData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                tickFormatter={(val) => `${val}s`} 
                fontSize={11}
              />
              <YAxis 
                stroke="#64748b" 
                domain={[0, 'auto']} 
                fontSize={11}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                labelFormatter={(val) => `Time: ${val}s`}
                formatter={(val: any) => [Number(val).toFixed(3), '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area
                type="monotone"
                dataKey="ref_energy"
                name="Reference RMS Energy"
                stroke="#38bdf8"
                fill="#38bdf8"
                fillOpacity={0.15}
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="part_energy"
                name="Participant RMS Energy"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.2}
                strokeWidth={1.5}
              />
            </AreaChart>
          ) : (
            <LineChart data={mergedData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                tickFormatter={(val) => `${val}s`} 
                fontSize={11}
              />
              <YAxis 
                stroke="#64748b" 
                domain={[0, 250]} 
                unit=" WPM" 
                fontSize={11}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                labelFormatter={(val) => `Time: ${val}s`}
                formatter={(val: any) => [val ? `${val} WPM` : '0 WPM', '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey="ref_rate"
                name="Reference Speaking Rate"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="part_rate"
                name="Participant Speaking Rate"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Feature Summary Comparison Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-slate-400 font-mono">Mean Pitch (F0)</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="font-semibold text-slate-100">{partFeatures.summary.mean_pitch_hz} Hz</span>
            <span className="text-[11px] text-slate-400">(Ref: {refFeatures.summary.mean_pitch_hz} Hz)</span>
          </div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-slate-400 font-mono">Semitone Range</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="font-semibold text-slate-100">{partFeatures.summary.pitch_semitone_range} st</span>
            <span className="text-[11px] text-slate-400">(Ref: {refFeatures.summary.pitch_semitone_range} st)</span>
          </div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-slate-400 font-mono">Speaking Rate</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="font-semibold text-slate-100">{partFeatures.summary.estimated_wpm} WPM</span>
            <span className="text-[11px] text-slate-400">(Ref: {refFeatures.summary.estimated_wpm} WPM)</span>
          </div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-slate-400 font-mono">Pause Time Ratio</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="font-semibold text-slate-100">{(partFeatures.summary.pause_time_ratio * 100).toFixed(1)}%</span>
            <span className="text-[11px] text-slate-400">(Ref: {(refFeatures.summary.pause_time_ratio * 100).toFixed(1)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
