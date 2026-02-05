import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
    try {
        const checks = {
            database: await checkDatabase(),
            frontend: await checkFrontend(),
            grafana: await checkGrafana(),
            prometheus: await checkPrometheus(),
        };

        const allHealthy = Object.values(checks).every((check) => check.healthy);

        return NextResponse.json({
            status: allHealthy ? 'healthy' : 'degraded',
            checks,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

async function checkDatabase(): Promise<{ healthy: boolean; message: string }> {
    try {
        // Check if database secret exists (temporal uses this for postgres connection)
        const { stdout } = await execAsync(
            'kubectl get secret -n temporal-prod temporal-db-secret -o json 2>/dev/null || echo "{}"'
        );

        // If no secret, check if postgres pods are running instead
        try {
            const { stdout: podCheck } = await execAsync(
                'kubectl get pods -n temporal-prod -l app.kubernetes.io/component=postgresql -o json 2>/dev/null || echo "{\\"items\\":[]}"'
            );
            const pods = JSON.parse(podCheck);
            if (pods.items && pods.items.length > 0) {
                const runningPods = pods.items.filter(
                    (pod: any) => pod.status?.phase === 'Running'
                ).length;
                return {
                    healthy: runningPods > 0,
                    message: `${runningPods} PostgreSQL pod(s) running`,
                };
            }
        } catch { }

        const secret = JSON.parse(stdout);
        return {
            healthy: !!secret.metadata?.name,
            message: secret.metadata?.name ? 'Database secret configured' : 'Using external database',
        };
    } catch {
        return { healthy: false, message: 'Database configuration not found' };
    }
}

async function checkFrontend(): Promise<{ healthy: boolean; message: string }> {
    try {
        const { stdout } = await execAsync(
            'kubectl get pods -n temporal-prod -l app.kubernetes.io/component=frontend -o json'
        );
        const pods = JSON.parse(stdout);
        const runningPods = pods.items?.filter(
            (pod: any) => pod.status?.phase === 'Running'
        ).length || 0;
        const totalPods = pods.items?.length || 0;

        return {
            healthy: runningPods > 0,
            message: `${runningPods}/${totalPods} pods running`,
        };
    } catch {
        return { healthy: false, message: 'Unable to check frontend pods' };
    }
}

async function checkGrafana(): Promise<{ healthy: boolean; message: string }> {
    try {
        // Check for Grafana service by exact name
        const { stdout } = await execAsync(
            'kubectl get svc -n temporal-prod temporal-prod-grafana -o json 2>/dev/null || echo "{\\"items\\":[]}"'
        );
        const service = JSON.parse(stdout);

        // Also check if pods are running
        const { stdout: podCheck } = await execAsync(
            'kubectl get pods -n temporal-prod -l app.kubernetes.io/name=grafana -o json'
        );
        const pods = JSON.parse(podCheck);
        const runningPods = pods.items?.filter(
            (pod: any) => pod.status?.phase === 'Running'
        ).length || 0;

        return {
            healthy: service.metadata?.name && runningPods > 0,
            message: service.metadata?.name ? `Service available (${runningPods} pod)` : 'Service not found',
        };
    } catch {
        return { healthy: false, message: 'Grafana not accessible' };
    }
}

async function checkPrometheus(): Promise<{ healthy: boolean; message: string }> {
    try {
        // Check for Prometheus server service by exact name
        const { stdout } = await execAsync(
            'kubectl get svc -n temporal-prod temporal-prod-prometheus-server -o json 2>/dev/null || echo "{\\"items\\":[]}"'
        );
        const service = JSON.parse(stdout);

        // Check if Prometheus server pod is running
        const { stdout: podCheck } = await execAsync(
            'kubectl get pods -n temporal-prod -l "app.kubernetes.io/name=prometheus,app.kubernetes.io/component=server" -o json'
        );
        const pods = JSON.parse(podCheck);
        const runningPods = pods.items?.filter(
            (pod: any) => pod.status?.phase === 'Running'
        ).length || 0;

        return {
            healthy: service.metadata?.name && runningPods > 0,
            message: service.metadata?.name ? `Scraping metrics (${runningPods} pod)` : 'Service not found',
        };
    } catch {
        return { healthy: false, message: 'Prometheus not accessible' };
    }
}
