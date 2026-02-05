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
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>🔧</span>
                <span className="gradient-text">Kubectl Commands</span>
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {COMMANDS.map((cmd) => (
                    <button
                        key={cmd.id}
                        onClick={() => executeCommand(cmd.id)}
                        disabled={loading}
                        className="command-button p-4 bg-gradient-to-br from-cyan-600 to-blue-700 
                     hover:from-cyan-500 hover:to-blue-600 text-white rounded-lg
                     transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-lg hover:shadow-xl hover:shadow-cyan-500/30 transform hover:scale-105 hover:-translate-y-1
                     border border-cyan-400/20 hover:border-cyan-300/50"
                    >
                        <div className="text-2xl mb-1">{cmd.icon}</div>
                        <div className="text-xs font-semibold">{cmd.label}</div>
                    </button>
                ))}
            </div>

            {error && (
                <div className="error-box bg-red-900/30 border-2 border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-4 backdrop-blur-sm">
                    <strong className="text-red-400">Error:</strong> {error}
                </div>
            )}

            {output && (
                <div className="output-box bg-black/60 text-cyan-300 p-4 rounded-lg overflow-auto max-h-96 font-mono text-sm border border-cyan-500/30 shadow-inner backdrop-blur-sm">
                    <pre className="whitespace-pre-wrap">{output}</pre>
                </div>
            )}
        </div>
    );
}
