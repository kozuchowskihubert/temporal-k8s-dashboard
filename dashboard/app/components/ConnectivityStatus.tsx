'use client';

import { useState, useEffect } from 'react';

interface HealthCheck {
    healthy: boolean;
    message: string;
}

interface HealthStatus {
    status: string;
    checks: {
        database: HealthCheck;
        frontend: HealthCheck;
        grafana: HealthCheck;
        prometheus: HealthCheck;
    };
    timestamp: string;
}

export default function ConnectivityStatus() {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(false);

    const checkHealth = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
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
        health.status === 'healthy' ? 'green' : health.status === 'degraded' ? 'yellow' : 'red';

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
                    : statusColor === 'yellow'
                        ? 'bg-yellow-800/40 border-yellow-500 text-yellow-50'
                        : 'bg-red-800/40 border-red-500 text-red-50'
                    }`}
            >
                <div className="flex items-center gap-2">
                    <span className="text-3xl">
                        {statusColor === 'green' ? '✅' : statusColor === 'yellow' ? '⚠️' : '❌'}
                    </span>
                    <div>
                        <div className="font-bold text-lg capitalize">{health.status}</div>
                        <div className="text-sm opacity-75">
                            Last checked: {new Date(health.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(health.checks).map(([name, check]) => (
                    <div
                        key={name}
                        className={`check-card p-4 rounded-lg border ${check.healthy
                            ? 'bg-green-800/30 border-green-500/60 text-gray-100'
                            : 'bg-red-800/30 border-red-500/60 text-gray-100'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{check.healthy ? '✅' : '❌'}</span>
                            <span className="font-bold capitalize">{name}</span>
                        </div>
                        <div className="text-sm text-gray-400">{check.message}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
