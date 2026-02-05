'use client';

import { useState, useEffect } from 'react';

interface PodMetric {
    total: number;
    running: number;
    pending: number;
    failed: number;
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
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 10000); // Refresh every 10s
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="text-gray-500">Loading metrics...</div>;
    }

    const components = Object.entries(metrics);

    return (
        <div className="metrics-chart p-6">
            <h2 className="text-2xl font-bold mb-4">📊 Pod Metrics by Component</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {components.map(([component, metric]) => {
                    const healthPercentage = (metric.running / metric.total) * 100;
                    const isHealthy = healthPercentage >= 50;

                    return (
                        <div
                            key={component}
                            className={`metric-card p-5 rounded-lg border-2 shadow-lg ${isHealthy ? 'bg-green-50 border-green-400' : 'bg-yellow-50 border-yellow-400'
                                }`}
                        >
                            <div className="font-bold text-lg mb-3 capitalize">{component}</div>

                            <div className="metric-bar mb-3">
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Health</span>
                                    <span className="font-bold">{healthPercentage.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-gray-300 rounded-full h-3">
                                    <div
                                        className={`h-3 rounded-full transition-all ${isHealthy ? 'bg-green-500' : 'bg-yellow-500'
                                            }`}
                                        style={{ width: `${healthPercentage}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-1">
                                    <span className="text-green-600 font-bold">✓</span>
                                    <span>Running: {metric.running}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-600 font-bold">●</span>
                                    <span>Total: {metric.total}</span>
                                </div>
                                {metric.pending > 0 && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-yellow-600 font-bold">⏳</span>
                                        <span>Pending: {metric.pending}</span>
                                    </div>
                                )}
                                {metric.failed > 0 && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-red-600 font-bold">✗</span>
                                        <span>Failed: {metric.failed}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {components.length === 0 && (
                <div className="text-gray-500 text-center py-8">No metrics available</div>
            )}
        </div>
    );
}
