import React, { useState } from 'react';
import { Plus, Trash2, Check, X, Loader2, Activity, AlertCircle } from 'lucide-react';

export interface MetricConfig {
  id: string;
  name: string;
  url: string;
  status: 'idle' | 'testing' | 'success' | 'error';
  errorMessage?: string;
}

interface MetricConfigurationProps {
  /** Callback fired when metrics are successfully saved */
  onSave?: (metrics: MetricConfig[]) => void;
  /** Initial metrics if editing an existing configuration */
  initialMetrics?: MetricConfig[];
  /** Optional label for the checkbox */
  label?: string;
}

/**
 * MetricConfiguration Component
 * 
 * A drop-in component that provides a checkbox to enable metrics.
 * When checked, it opens a modal allowing the user to configure up to 2 metrics.
 * Each metric requires a Name and a valid API URL. The URL must be tested successfully
 * before the configuration can be saved.
 */
export default function MetricConfiguration({ 
  onSave, 
  initialMetrics = [],
  label = "Enable Metrics" 
}: MetricConfigurationProps) {
  const [isChecked, setIsChecked] = useState(initialMetrics.length > 0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [metrics, setMetrics] = useState<MetricConfig[]>(initialMetrics);
  const [savedMetrics, setSavedMetrics] = useState<MetricConfig[]>(initialMetrics);

  // Handle checkbox toggle
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (checked) {
      setIsModalOpen(true);
      // Initialize with one empty row if none exist
      if (metrics.length === 0) {
        setMetrics([{ id: Date.now().toString(), name: '', url: '', status: 'idle' }]);
      }
    } else {
      setIsChecked(false);
      setMetrics([]);
      setSavedMetrics([]);
      onSave?.([]);
    }
  };

  // Add a new metric row (max 2)
  const handleAddMetric = () => {
    if (metrics.length < 2) {
      setMetrics([...metrics, { id: Date.now().toString(), name: '', url: '', status: 'idle' }]);
    }
  };

  // Remove a metric row
  const handleRemoveMetric = (id: string) => {
    setMetrics(metrics.filter(m => m.id !== id));
  };

  // Update metric field
  const handleUpdateMetric = (id: string, field: keyof MetricConfig, value: string) => {
    setMetrics(metrics.map(m => {
      if (m.id === id) {
        // Reset status to idle if URL changes so they have to re-test
        const newStatus = field === 'url' ? 'idle' : m.status;
        return { ...m, [field]: value, status: newStatus, errorMessage: undefined };
      }
      return m;
    }));
  };

  // Test the API connection
  const handleTestConnection = async (id: string, url: string) => {
    if (!url.trim()) return;

    // Set testing state
    setMetrics(prev => prev.map(m => m.id === id ? { ...m, status: 'testing', errorMessage: undefined } : m));

    try {
      // Basic URL validation
      new URL(url);

      // Attempt to fetch the URL
      // Note: In a real app, you might need to proxy this through your backend to avoid CORS issues.
      const response = await fetch(url, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        setMetrics(prev => prev.map(m => m.id === id ? { ...m, status: 'success' } : m));
      } else {
        setMetrics(prev => prev.map(m => m.id === id ? { 
          ...m, 
          status: 'error', 
          errorMessage: `HTTP Error: ${response.status}` 
        } : m));
      }
    } catch (error: any) {
      setMetrics(prev => prev.map(m => m.id === id ? { 
        ...m, 
        status: 'error', 
        errorMessage: error.message.includes('URL') ? 'Invalid URL format' : 'Network error or CORS issue'
      } : m));
    }
  };

  // Save the configuration
  const handleSave = () => {
    setSavedMetrics(metrics);
    setIsChecked(true);
    setIsModalOpen(false);
    onSave?.(metrics);
  };

  // Cancel and revert to last saved state
  const handleCancel = () => {
    setMetrics(savedMetrics);
    setIsModalOpen(false);
    if (savedMetrics.length === 0) {
      setIsChecked(false);
    }
  };

  // Check if save button should be enabled
  // Enabled if there's at least 1 metric, all names/urls are filled, and all statuses are 'success'
  const isSaveEnabled = metrics.length > 0 && metrics.every(m => 
    m.name.trim() !== '' && 
    m.url.trim() !== '' && 
    m.status === 'success'
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Checkbox Trigger */}
      <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors w-max">
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={isChecked}
            onChange={handleCheckboxChange}
          />
          <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-colors flex items-center justify-center">
            <Check size={14} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
        </div>
        <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <Activity size={18} className="text-indigo-500" />
          {label}
        </span>
      </label>

      {/* Active Metrics Summary (Optional, shows when checked and modal closed) */}
      {isChecked && savedMetrics.length > 0 && !isModalOpen && (
        <div className="ml-8 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          {savedMetrics.length} metric{savedMetrics.length > 1 ? 's' : ''} configured
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-indigo-600 dark:text-indigo-400 hover:underline ml-2 font-medium"
          >
            Edit
          </button>
        </div>
      )}

      {/* Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="text-indigo-500" />
                  Configure Metrics
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Add up to 2 API endpoints to fetch metric data. Connections must be tested before saving.
                </p>
              </div>
              <button 
                onClick={handleCancel}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-sm">
                      <th className="p-4 font-medium w-1/4">Metric Name</th>
                      <th className="p-4 font-medium w-2/4">API URL</th>
                      <th className="p-4 font-medium w-1/4 text-center">Test Connection</th>
                      <th className="p-4 font-medium w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {metrics.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">
                          No metrics added yet. Click "Add Metric" to begin.
                        </td>
                      </tr>
                    ) : (
                      metrics.map((metric) => (
                        <tr key={metric.id} className="bg-white dark:bg-slate-900">
                          <td className="p-4 align-top">
                            <input
                              type="text"
                              value={metric.name}
                              onChange={(e) => handleUpdateMetric(metric.id, 'name', e.target.value)}
                              placeholder="e.g., Active Users"
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white"
                            />
                          </td>
                          <td className="p-4 align-top">
                            <input
                              type="url"
                              value={metric.url}
                              onChange={(e) => handleUpdateMetric(metric.id, 'url', e.target.value)}
                              placeholder="https://api.example.com/v1/metrics"
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white"
                            />
                            {metric.errorMessage && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
                                <AlertCircle size={12} />
                                {metric.errorMessage}
                              </div>
                            )}
                          </td>
                          <td className="p-4 align-top">
                            <div className="flex flex-col items-center gap-2">
                              <button
                                onClick={() => handleTestConnection(metric.id, metric.url)}
                                disabled={!metric.url.trim() || metric.status === 'testing'}
                                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {metric.status === 'testing' ? (
                                  <><Loader2 size={16} className="animate-spin" /> Testing...</>
                                ) : (
                                  'Test API'
                                )}
                              </button>
                              
                              {/* Status Indicator */}
                              {metric.status === 'success' && (
                                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md w-full justify-center">
                                  <Check size={12} /> Connection Successful
                                </span>
                              )}
                              {metric.status === 'error' && (
                                <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-md w-full justify-center">
                                  <X size={12} /> Connection Failed
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 align-top text-center">
                            <button
                              onClick={() => handleRemoveMetric(metric.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Remove Metric"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add Metric Button */}
              <div className="mt-4">
                <button
                  onClick={handleAddMetric}
                  disabled={metrics.length >= 2}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                  Add Metric {metrics.length > 0 && `(${metrics.length}/2)`}
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isSaveEnabled}
                className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow active:scale-[0.98]"
              >
                Save Configuration
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
