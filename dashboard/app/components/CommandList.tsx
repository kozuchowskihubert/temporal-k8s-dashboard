'use client';

import { useState } from 'react';

interface Command {
    name: string;
    description: string;
    example: string;
    category: string;
}

const KUBECTL_COMMANDS: Command[] = [
    // Pod Commands
    { category: 'Pods', name: 'kubectl get pods', description: 'List all pods in namespace', example: 'kubectl get pods -n temporal-prod' },
    { category: 'Pods', name: 'kubectl describe pod', description: 'Show detailed pod information', example: 'kubectl describe pod <pod-name> -n temporal-prod' },
    { category: 'Pods', name: 'kubectl logs', description: 'View pod logs', example: 'kubectl logs <pod-name> -n temporal-prod --tail=50' },
    { category: 'Pods', name: 'kubectl exec', description: 'Execute command in pod', example: 'kubectl exec -it <pod-name> -n temporal-prod -- /bin/sh' },

    // Service Commands
    { category: 'Services', name: 'kubectl get services', description: 'List all services', example: 'kubectl get services -n temporal-prod' },
    { category: 'Services', name: 'kubectl describe service', description: 'Show service details', example: 'kubectl describe service <service-name> -n temporal-prod' },
    { category: 'Services', name: 'kubectl port-forward', description: 'Forward local port to service', example: 'kubectl port-forward svc/<service-name> 8080:80 -n temporal-prod' },

    // Deployment Commands
    { category: 'Deployments', name: 'kubectl get deployments', description: 'List all deployments', example: 'kubectl get deployments -n temporal-prod' },
    { category: 'Deployments', name: 'kubectl rollout status', description: 'Check deployment status', example: 'kubectl rollout status deployment/<name> -n temporal-prod' },
    { category: 'Deployments', name: 'kubectl scale', description: 'Scale deployment replicas', example: 'kubectl scale deployment/<name> --replicas=3 -n temporal-prod' },

    // Config & Debug
    { category: 'Config', name: 'kubectl get configmaps', description: 'List config maps', example: 'kubectl get configmaps -n temporal-prod' },
    { category: 'Config', name: 'kubectl get secrets', description: 'List secrets', example: 'kubectl get secrets -n temporal-prod' },
    { category: 'Debug', name: 'kubectl top pods', description: 'Show pod resource usage', example: 'kubectl top pods -n temporal-prod' },
    { category: 'Debug', name: 'kubectl get events', description: 'View cluster events', example: 'kubectl get events -n temporal-prod --sort-by=.metadata.creationTimestamp' },
];

export default function CommandList() {
    const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const categories = ['All', ...Array.from(new Set(KUBECTL_COMMANDS.map(cmd => cmd.category)))];

    const filteredCommands = selectedCategory === 'All'
        ? KUBECTL_COMMANDS
        : KUBECTL_COMMANDS.filter(cmd => cmd.category === selectedCategory);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedCommand(text);
        setTimeout(() => setCopiedCommand(null), 2000);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                    <span>💻</span>
                    <span className="gradient-text">Available Commands</span>
                </h3>

                <div className="flex gap-2 flex-wrap">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${selectedCategory === category
                                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                {filteredCommands.map((cmd, index) => (
                    <div
                        key={index}
                        className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-lg p-4 hover:border-cyan-500/50 transition-all group"
                    >
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold text-cyan-400 px-2 py-0.5 bg-cyan-500/10 rounded">
                                        {cmd.category}
                                    </span>
                                </div>
                                <h4 className="font-mono text-sm font-semibold text-white truncate">
                                    {cmd.name}
                                </h4>
                            </div>
                            <button
                                onClick={() => copyToClipboard(cmd.example)}
                                className="flex-shrink-0 p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                                title="Copy command"
                            >
                                {copiedCommand === cmd.example ? (
                                    <span className="text-green-400">✓</span>
                                ) : (
                                    <span>📋</span>
                                )}
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 mb-2">{cmd.description}</p>

                        <div className="relative">
                            <code className="block text-xs font-mono bg-black/30 text-cyan-300 p-2 rounded overflow-x-auto whitespace-nowrap">
                                {cmd.example}
                            </code>
                        </div>
                    </div>
                ))}
            </div>

            {filteredCommands.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                    No commands found in this category
                </div>
            )}
        </div>
    );
}
