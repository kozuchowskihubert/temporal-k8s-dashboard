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
        // Check if temporal-db-secret exists
        const { stdout } = await execAsync(
            'kubectl get secret -n temporal-prod temporal-db-secret -o json'
        );
        const secret = JSON.parse(stdout);
        return {
            healthy: true,
            message: secret.metadata.name ? 'Database secret configured' : 'Missing',
        };
    } catch {
        return { healthy: false, message: 'Database secret not found' };
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
        return { healthy: false, message: 'Unable to check frontend' };
    }
}

async function checkGrafana(): Promise<{ healthy: boolean; message: string }> {
    try {
        const { stdout } = await execAsync(
            'kubectl get svc -n temporal-prod -l app.kubernetes.io/name=grafana -o json'
        );
        const services = JSON.parse(stdout);
        return {
            healthy: services.items?.length > 0,
            message: services.items?.length > 0 ? 'Service available' : 'Not found',
        };
    } catch {
        return { healthy: false, message: 'Grafana not accessible' };
    }
}

async function checkPrometheus(): Promise<{ healthy: boolean; message: string }> {
    try {
        const { stdout } = await execAsync(
            'kubectl get svc -n temporal-prod -l app=prometheus -o json'
        );
        const services = JSON.parse(stdout);
        return {
            healthy: services.items?.length > 0,
            message: services.items?.length > 0 ? 'Scraping metrics' : 'Not found',
        };
    } catch {
        return { healthy: false, message: 'Prometheus not accessible' };
    }
}
