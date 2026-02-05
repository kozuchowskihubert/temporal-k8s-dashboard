'use client';

import { useState } from 'react';

interface CommandPanelProps {
    namespace?: string;
}

const COMMANDS = [
    { id: 'get-pods', label: 'Get All Pods', icon: '📦' },
    { id: 'check-frontend', label: 'Frontend Status', icon: '🎯' },
    { id: 'check-history', label: 'History Status', icon: '📚' },
    { id: 'check-matching', label: 'Matching Status', icon: '🔄' },
    { id: 'check-worker', label: 'Worker Status', icon: '⚙️' },
    { id: 'get-services', label: 'Get Services', icon: '🌐' },
    { id: 'get-web-logs', label: 'Web Logs (50 lines)', icon: '📄' },
];

export default function CommandPanel({ namespace = 'temporal-prod' }: CommandPanelProps) {
    const [loading, setLoading] = useState(false);
    const [output, setOutput] = useState<string>('');
    const [error, setError] = useState<string>('');

    const executeCommand = async (command: string) => {
        setLoading(true);
        setError('');
        setOutput('Loading...');

        try {
            const response = await fetch('/api/kubectl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command, namespace }),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || 'Command failed');
                setOutput('');
                return;
            }

            if (result.data) {
                setOutput(JSON.stringify(result.data, null, 2));
            } else {
                setOutput(result.output || 'No output');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            setOutput('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="command-panel">
            <h2 className="text-2xl font-bold mb-4">🔧 Kubectl Commands</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {COMMANDS.map((cmd) => (
                    <button
                        key={cmd.id}
                        onClick={() => executeCommand(cmd.id)}
                        disabled={loading}
                        className="command-button p-4 bg-gradient-to-br from-blue-500 to-purple-600 
                     hover:from-blue-600 hover:to-purple-700 text-white rounded-lg
                     transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <div className="text-2xl mb-1">{cmd.icon}</div>
                        <div className="text-sm font-semibold">{cmd.label}</div>
                    </button>
                ))}
            </div>

            {error && (
                <div className="error-box bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {output && (
                <div className="output-box bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 font-mono text-sm">
                    <pre>{output}</pre>
                </div>
            )}
        </div>
    );
}
