
'use client';

import { useState, useEffect } from 'react';

interface HealthCheck {
    healthy: boolean | null;
    message: string;
}

interface NeonProjectDetails {
    cpu: number;
    ram: number;
    region: string;
    id: string;
    name: string;
}

interface HealthStatus {
    status: string;
    message?: string;
    components: {
        database: HealthCheck;
        frontend: HealthCheck;
        grafana: HealthCheck;
        prometheus: HealthCheck;
    };
    database_details?: NeonProjectDetails | null;
    timestamp?: string; // Optional because API might not return it
}

export default function ConnectivityStatus() {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(false);

    const checkHealth = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/health');
            const data = await response.json();

            // Generate a timestamp if one isn't provided so the UI updates
            if (!data.timestamp) {
                data.timestamp = new Date().toISOString();
            }

            setHealth(data);
        } catch (error) {
            console.error('Health check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkHealth();
        const interval = setInterval(checkHealth, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    if (!health) {
        return (
            <div className="connectivity-status p-6">
                <h2 className="text-2xl font-bold mb-4">🔌 Connectivity Status</h2>
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    const statusColor =
        health.status === 'healthy' ? 'green' : health.status === 'info' ? 'blue' : health.status === 'degraded' ? 'yellow' : 'red';

    const statusEmoji =
        health.status === 'healthy' ? '✅' : health.status === 'info' ? 'ℹ️' : health.status === 'degraded' ? '⚠️' : '❌';

    return (
        <div className="connectivity-status p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">🔌 Connectivity Status</h2>
                <button
                    onClick={checkHealth}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg
                   transition-colors disabled:opacity-50"
                >
                    {loading ? '🔄 Testing...' : '🔄 Refresh'}
                </button>
            </div>

            <div
                className={`status-badge mb-6 p-4 rounded-lg border-2 ${statusColor === 'green'
                    ? 'bg-green-800/40 border-green-500 text-green-50'
                    : statusColor === 'blue'
                        ? 'bg-blue-800/40 border-blue-500 text-blue-50'
                        : statusColor === 'yellow'
                            ? 'bg-yellow-800/40 border-yellow-500 text-yellow-50'
                            : 'bg-red-800/40 border-red-500 text-red-50'
                    }`}
            >
                <div className="flex items-center gap-2">
                    <span className="text-3xl">{statusEmoji}</span>
                    <div>
                        <div className="font-bold text-lg capitalize">{health.status}</div>
                        {health.message && (
                            <div className="text-sm opacity-90 mt-1">{health.message}</div>
                        )}
                        <div className="text-sm opacity-75">
                            Last checked: {health.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'Just now'}
                        </div>
                    </div>
                </div>
            </div>

            {health.database_details && (
                <div className="mb-6 p-4 rounded-lg border border-purple-500/30 bg-purple-900/10">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">🐘</span>
                        <h3 className="font-bold text-purple-200">Neon Database Config</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-400 block">Use Case</span>
                            <span className="text-purple-100 font-mono">Serverless Postgres</span>
                        </div>
                        <div>
                            <span className="text-gray-400 block">Region</span>
                            <span className="text-purple-100 font-mono">{health.database_details.region}</span>
                        </div>
                        <div>
                            <span className="text-gray-400 block">Compute</span>
                            <span className="text-purple-100 font-mono">{health.database_details.cpu} CU ({health.database_details.ram} GB RAM)</span>
                        </div>
                        <div>
                            <span className="text-gray-400 block">Project ID</span>
                            <span className="text-purple-100 font-mono truncate" title={health.database_details.id}>{health.database_details.id}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(health.components || {}).map(([name, check]) => {
                    const checkColor =
                        check.healthy === true ? 'green' :
                            check.healthy === false ? 'red' :
                                'blue';

                    const checkEmoji =
                        check.healthy === true ? '✅' :
                            check.healthy === false ? '❌' :
                                'ℹ️';

                    return (
                        <div
                            key={name}
                            className={`check-card p-4 rounded-lg border ${checkColor === 'green'
                                ? 'bg-green-800/30 border-green-500/60 text-gray-100'
                                : checkColor === 'red'
                                    ? 'bg-red-800/30 border-red-500/60 text-gray-100'
                                    : 'bg-blue-800/30 border-blue-500/60 text-gray-100'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">{checkEmoji}</span>
                                <span className="font-bold capitalize">{name}</span>
                            </div>
                            <div className="text-sm text-gray-400">{check.message}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
