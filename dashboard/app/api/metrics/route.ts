import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
    try {
        const metrics = {
            pods: await getPodMetrics(),
            resources: await getResourceMetrics(),
            timestamp: new Date().toISOString(),
        };

        return NextResponse.json(metrics);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

async function getPodMetrics() {
    try {
        const { stdout } = await execAsync(
            'kubectl get pods -n temporal-prod -o json'
        );
        const pods = JSON.parse(stdout);

        const podsByComponent: Record<string, any> = {};

        pods.items?.forEach((pod: any) => {
            const component = pod.metadata?.labels?.['app.kubernetes.io/component'] ||
                pod.metadata?.labels?.['app.kubernetes.io/name'] ||
                pod.metadata?.labels?.['app'];
            if (!component) return;

            if (!podsByComponent[component]) {
                podsByComponent[component] = {
                    total: 0,
                    running: 0,
                    pending: 0,
                    failed: 0,
                };
            }

            podsByComponent[component].total++;
            const phase = pod.status?.phase?.toLowerCase();
            if (phase === 'running') podsByComponent[component].running++;
            else if (phase === 'pending') podsByComponent[component].pending++;
            else if (phase === 'failed') podsByComponent[component].failed++;
        });

        return podsByComponent;
    } catch {
        return {};
    }
}

async function getResourceMetrics() {
    try {
        // Get top pods (requires metrics-server)
        const { stdout } = await execAsync(
            'kubectl top pods -n temporal-prod --no-headers 2>/dev/null || echo "metrics unavailable"'
        );

        if (stdout.includes('metrics unavailable')) {
            return { available: false, message: 'Metrics server not installed' };
        }

        // Parse resource usage
        const lines = stdout.trim().split('\n');
        const resources = lines.map((line) => {
            const [name, cpu, memory] = line.split(/\s+/);
            return { name, cpu, memory };
        });

        return { available: true, resources };
    } catch {
        return { available: false, message: 'Unable to fetch metrics' };
    }
}
