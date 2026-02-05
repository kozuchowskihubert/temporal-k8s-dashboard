'use client';

import { useState, useEffect } from 'react';

interface PodMetric {
    total: number;
    running: number;
    pending: number;
    failed: number;
    cpu?: number; // Cores
    memory?: number; // Bytes
}

export default function MetricsChart() {
    const [metrics, setMetrics] = useState<Record<string, PodMetric>>({});
    const [loading, setLoading] = useState(true);

    const fetchMetrics = async () => {
        try {
            const response = await fetch('/api/metrics');
            const data = await response.json();
            setMetrics(data.pods || {});
        } catch (error) {
            console.error('Failed to fetch metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        let timeoutId: NodeJS.Timeout;

        const pollMetrics = async () => {
            if (!isMounted) return;

            await fetchMetrics();

            if (isMounted) {
                timeoutId = setTimeout(pollMetrics, 5000); // Wait 5s AFTER fetch completes
            }
        };

        pollMetrics();

        return () => {
            isMounted = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    if (loading) {
        return <div className="text-gray-500">Loading metrics...</div>;
    }

    const components = Object.entries(metrics);

    // Helpers for display
    const formatMemory = (bytes?: number) => {
        if (!bytes) return '0 MB';
        const mb = bytes / 1024 / 1024;
        if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
        return `${mb.toFixed(0)} MB`;
    };

    const formatCpu = (cores?: number) => {
        if (!cores) return '0 m';
        if (cores < 1) return `${(cores * 1000).toFixed(0)} m`;
        return `${cores.toFixed(2)} cores`;
    };

    return (
        <div className="metrics-chart p-6">
            <h2 className="text-2xl font-bold mb-4">📊 Pod Metrics by Component</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {components.map(([component, metric]) => {
                    const healthPercentage = metric.total > 0 ? (metric.running / metric.total) * 100 : 0;
                    const isHealthy = healthPercentage >= 50;

                    return (
                        <div
                            key={component}
                            className={`metric-card p-5 rounded-lg border-2 shadow-lg transition-all ${isHealthy ? 'bg-gray-800/50 border-green-500/60' : 'bg-gray-800/50 border-yellow-500/60'
                                }`}
                        >
                            <div className="font-bold text-lg mb-3 capitalize text-gray-100 flex justify-between items-center">
                                <span>{component}</span>
                                {isHealthy && metric.failed === 0 ? (
                                    <span className="text-green-400 text-xs px-2 py-1 bg-green-900/40 rounded-full">Healthy</span>
                                ) : (
                                    <span className="text-yellow-400 text-xs px-2 py-1 bg-yellow-900/40 rounded-full">Attention</span>
                                )}
                            </div>

                            {/* Health Bar */}
                            <div className="mb-4">
                                <div className="flex justify-between text-xs mb-1 text-gray-400">
                                    <span>Pods Health</span>
                                    <span>{metric.running}/{metric.total} Running</span>
                                </div>
                                <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${isHealthy ? 'bg-green-500' : 'bg-yellow-500'}`}
                                        style={{ width: `${healthPercentage}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Resource Metrics */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-gray-900/50 p-2 rounded border border-gray-700/50">
                                    <div className="text-xs text-gray-400 mb-1">CPU Usage</div>
                                    <div className="font-mono text-cyan-300 font-bold">
                                        {formatCpu(metric.cpu)}
                                    </div>
                                </div>
                                <div className="bg-gray-900/50 p-2 rounded border border-gray-700/50">
                                    <div className="text-xs text-gray-400 mb-1">Memory Usage</div>
                                    <div className="font-mono text-purple-300 font-bold">
                                        {formatMemory(metric.memory)}
                                    </div>
                                </div>
                            </div>

                            {/* Status Counts */}
                            <div className="flex gap-3 text-xs text-gray-400 border-t border-gray-700/50 pt-3">
                                {metric.pending > 0 && (
                                    <span className="text-yellow-500">⏳ {metric.pending} Pending</span>
                                )}
                                {metric.failed > 0 && (
                                    <span className="text-red-500">✗ {metric.failed} Failed</span>
                                )}
                                {metric.pending === 0 && metric.failed === 0 && (
                                    <span className="text-gray-500">All pods stable</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {components.length === 0 && (
                <div className="text-gray-500 text-center py-8 bg-gray-900/20 rounded-lg border border-gray-800 border-dashed">
                    No active components found in cluster
                </div>
            )}
        </div>
    );
}
