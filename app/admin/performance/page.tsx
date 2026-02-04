'use client';

import { useState, useEffect } from 'react';
import { performanceMonitor, PERFORMANCE_THRESHOLDS } from '@/lib/performanceMonitoring';

interface MetricSummary {
  count: number;
  avg: number;
  min: number;
  max: number;
}

/**
 * Performance Dashboard
 * 
 * Displays key performance metrics and alerts for performance degradation.
 * Requirements: 19.1, 19.2
 */
export default function PerformanceDashboard() {
  const [summary, setSummary] = useState<Record<string, MetricSummary>>({});
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  useEffect(() => {
    const updateSummary = () => {
      setSummary(performanceMonitor.getSummary());
    };

    updateSummary();
    const interval = setInterval(updateSummary, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusColor = (metricName: string, value: number): string => {
    const thresholdKey = metricName.toUpperCase().replace(/[^A-Z_]/g, '_') as keyof typeof PERFORMANCE_THRESHOLDS;
    const threshold = PERFORMANCE_THRESHOLDS[thresholdKey];

    if (!threshold) return 'text-gray-600';

    const percentage = (value / threshold) * 100;
    if (percentage <= 75) return 'text-green-600';
    if (percentage <= 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (metricName: string, value: number): string => {
    const thresholdKey = metricName.toUpperCase().replace(/[^A-Z_]/g, '_') as keyof typeof PERFORMANCE_THRESHOLDS;
    const threshold = PERFORMANCE_THRESHOLDS[thresholdKey];

    if (!threshold) return 'bg-gray-100 text-gray-800';

    const percentage = (value / threshold) * 100;
    if (percentage <= 75) return 'bg-green-100 text-green-800';
    if (percentage <= 100) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatMetricName = (name: string): string => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatValue = (value: number): string => {
    const safeValue = value ?? 0;
    return safeValue < 1000 ? `${safeValue.toFixed(2)}ms` : `${(safeValue / 1000).toFixed(2)}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Dashboard</h1>
          <p className="text-gray-600">
            Monitor key performance metrics and track performance over time
          </p>
        </div>

        {/* Refresh Controls */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="refreshInterval" className="block text-sm font-medium text-gray-700 mb-1">
                Refresh Interval
              </label>
              <select
                id="refreshInterval"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value={1000}>1 second</option>
                <option value={5000}>5 seconds</option>
                <option value={10000}>10 seconds</option>
                <option value={30000}>30 seconds</option>
                <option value={60000}>1 minute</option>
              </select>
            </div>
            <button
              onClick={() => performanceMonitor.clearMetrics()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear Metrics
            </button>
          </div>
        </div>

        {/* Performance Budgets */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Budgets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(PERFORMANCE_THRESHOLDS).map(([key, value]) => (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  {formatMetricName(key)}
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {typeof value === 'number' && value > 1000 
                    ? formatValue(value)
                    : value < 1 
                    ? (value ?? 0).toFixed(2)
                    : `${value}${key.includes('BUNDLE') || key.includes('WEIGHT') ? ' bytes' : 'ms'}`}
                </div>
                <div className="text-xs text-gray-500 mt-1">Budget Threshold</div>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Metrics</h2>
          
          {Object.keys(summary).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No metrics recorded yet. Metrics will appear as you use the application.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(summary).map(([name, metric]) => (
                <div key={name} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {formatMetricName(name)}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(name, metric.avg)}`}>
                      {metric.avg <= (PERFORMANCE_THRESHOLDS[name.toUpperCase().replace(/[^A-Z_]/g, '_') as keyof typeof PERFORMANCE_THRESHOLDS] || Infinity) * 0.75
                        ? 'Good'
                        : metric.avg <= (PERFORMANCE_THRESHOLDS[name.toUpperCase().replace(/[^A-Z_]/g, '_') as keyof typeof PERFORMANCE_THRESHOLDS] || Infinity)
                        ? 'Warning'
                        : 'Critical'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Count</div>
                      <div className="text-xl font-bold text-gray-900">{metric.count}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Average</div>
                      <div className={`text-xl font-bold ${getStatusColor(name, metric.avg)}`}>
                        {formatValue(metric.avg)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Min</div>
                      <div className="text-xl font-bold text-gray-900">{formatValue(metric.min)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Max</div>
                      <div className="text-xl font-bold text-gray-900">{formatValue(metric.max)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Performance Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Performance Tips</h3>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>Keep initial bundle size under 200KB for fast page loads</li>
            <li>Optimize images and use WebP format when possible</li>
            <li>Implement code splitting for large components</li>
            <li>Use caching strategies for frequently accessed data</li>
            <li>Monitor API response times and optimize slow endpoints</li>
            <li>Run Lighthouse audits regularly to track Core Web Vitals</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
