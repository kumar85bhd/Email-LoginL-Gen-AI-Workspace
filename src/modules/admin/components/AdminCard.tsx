import React, { useState, useEffect } from 'react';
import { Service, Metric, HealthStatus } from '../types';
import { fetchServiceMetrics } from '../services/api';
import { RefreshCw, ArrowUpRight } from 'lucide-react';
import { DynamicIcon } from '../../../shared/components/ui/DynamicIcon';
import { getCategoryStyles } from '../../../shared/utils/categoryColors';
import { usePreferences } from '../../../shared/context/usePreferences';

interface AdminCardProps {
  service: Service;
}

const getStatusColor = (status: HealthStatus) => {
  switch (status) {
    case HealthStatus.HEALTHY: return 'bg-emerald-500';
    case HealthStatus.WARNING: return 'bg-amber-500';
    case HealthStatus.CRITICAL: return 'bg-red-500';
    default: return 'bg-slate-300';
  }
};

const AdminCard: React.FC<AdminCardProps> = ({ service }) => {
  const [metrics, setMetrics] = useState<Metric[]>(service.metrics || []);
  const [loading, setLoading] = useState(false);
  const { openInNewTab } = usePreferences();
  const catStyles = getCategoryStyles(service.category);

  const handleRefresh = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setLoading(true);
    try {
      const newMetrics = await fetchServiceMetrics(service.id);
      if (newMetrics && newMetrics.length > 0) {
        setMetrics(newMetrics);
      }
    } catch {
      setMetrics([{ label: 'Status', value: 'N/A' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!metrics.length) {
      handleRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLaunch = () => {
    if (service.url) {
      window.open(service.url, openInNewTab ? '_blank' : '_self');
    }
  };

  return (
    <div
      onClick={handleLaunch}
      className={`group relative glass-card rounded-xl border border-white/10 shadow-sm 
        hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:border-slate-500/40 
        active:scale-[0.98] transition-all duration-300 ease-out 
        flex flex-col cursor-pointer h-full overflow-hidden`}
    >
      {/* Status Indicator Line */}
      <div className={`absolute top-0 left-0 w-full h-1 ${getStatusColor(service.status)} opacity-80`} />
      
      {/* Hover Glow Effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${catStyles.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none rounded-xl`} />

      <div className="p-4 flex-1 relative z-10 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center shadow-sm bg-gradient-to-br ${catStyles.gradient} text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            <DynamicIcon name={service.icon || service.type || 'Box'} size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-2xl transition-colors tracking-tight truncate ${catStyles.text}`}>
              {service.name}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-1.5 rounded-full text-muted-foreground/50 hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40"
              title="Refresh Metrics"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="p-1.5 rounded-full text-muted-foreground/50 hover:bg-secondary transition-colors">
               <ArrowUpRight size={16} />
            </div>
          </div>
        </div>

        {service.description && (
          <p className="text-lg text-muted-foreground leading-relaxed line-clamp-2 font-sans mb-4">
            {service.description}
          </p>
        )}

        {metrics.length > 0 && (
          <div className="mt-auto grid grid-cols-2 gap-2">
            {metrics.map((m, i) => (
              <div key={i} className="bg-white/40 dark:bg-white/5 backdrop-blur-sm rounded-lg p-2 border border-white/20 dark:border-white/10">
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">{m.label}</div>
                <div className="text-lg font-bold text-foreground font-mono truncate">{m.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCard;
