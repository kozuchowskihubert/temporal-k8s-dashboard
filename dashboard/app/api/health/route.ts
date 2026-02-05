
import { NextRequest, NextResponse } from 'next/server';
import { KubeConfig, CoreV1Api, V1Pod } from '@kubernetes/client-node';
import { getProjectDetails } from '@/app/lib/neon';

// Force dynamic execution for this route
export const dynamic = 'force-dynamic';

function getKubeConfig(): KubeConfig {
    const kc = new KubeConfig();

    // 1. Try loading from specific environment variables (for remote access via tunnel)
    const k8sServer = process.env.K8S_SERVER?.trim();
    const k8sToken = process.env.K8S_TOKEN?.trim();

    if (k8sServer && k8sToken) {
        console.log(`[Health API] Configuring for remote access to ${k8sServer}`);

        const skipTlsVerify = process.env.K8S_SKIP_TLS_VERIFY === 'true';
        const caCert = process.env.K8S_CA_CERT;

        kc.loadFromOptions({
            clusters: [
                {
                    name: 'remote-cluster',
                    server: k8sServer,
                    skipTLSVerify: skipTlsVerify,
                    caData: caCert && !skipTlsVerify ? caCert : undefined,
                },
            ],
            users: [
                {
                    name: 'remote-user',
                    token: k8sToken,
                },
            ],
            contexts: [
                {
                    name: 'remote-context',
                    cluster: 'remote-cluster',
                    user: 'remote-user',
                },
            ],
            currentContext: 'remote-context',
        });
        return kc;
    }

    // 2. Try default loading (in-cluster or local ~/.kube/config)
    try {
        kc.loadFromDefault();
        console.log('[Health API] Loaded default kubeconfig');
        return kc;
    } catch (e) {
        console.error('[Health API] Failed to load default kubeconfig:', e);
    }

    throw new Error('Could not load Kubernetes configuration');
}

export async function GET() {
    try {
        const kc = getKubeConfig();
        const neonApiKey = process.env.NEON_API_KEY;
        const neonProjectId = process.env.NEON_PROJECT_ID;

        // Run all checks in parallel with a timeout wrapper for safety
        const [
            database,
            frontend,
            grafana,
            prometheus,
            databaseDetails
        ] = await Promise.all([
            runWithTimeout(checkDatabase(kc), { healthy: false, message: 'Timeout checking database' }),
            runWithTimeout(checkFrontend(kc), { healthy: false, message: 'Timeout checking frontend' }),
            runWithTimeout(checkGrafana(kc), { healthy: false, message: 'Timeout checking grafana' }),
            runWithTimeout(checkPrometheus(kc), { healthy: false, message: 'Timeout checking prometheus' }),
            (neonApiKey && neonProjectId)
                ? runWithTimeout(getProjectDetails(neonApiKey, neonProjectId), null)
                : Promise.resolve(null)
        ]);

        const overallHealthy =
            database.healthy && frontend.healthy && grafana.healthy && prometheus.healthy;

        return NextResponse.json(
            {
                status: overallHealthy ? 'healthy' : 'degraded',
                components: {
                    database,
                    frontend,
                    grafana,
                    prometheus,
                },
                database_details: databaseDetails,
            },
            { status: 200 } // Always return 200 to allow UI to show partial status instead of crashing
        );
    } catch (error: any) {
        console.error('[Health API] Unexpected error:', error);
        return NextResponse.json(
            { status: 'error', message: error?.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// Timeout wrapper helper
async function runWithTimeout<T>(promise: Promise<T>, fallback: T, timeoutMs = 8000): Promise<T> {
    const timeout = new Promise<T>((resolve) =>
        setTimeout(() => {
            console.error(`[Health API] Check timed out after ${timeoutMs}ms`);
            resolve(fallback);
        }, timeoutMs)
    );
    return Promise.race([promise, timeout]);
}

async function checkDatabase(kc: KubeConfig): Promise<{ healthy: boolean; message: string }> {
    const k8sApi = kc.makeApiClient(CoreV1Api);
    try {
        await k8sApi.readNamespacedSecret({ name: 'temporal-db-secret', namespace: 'temporal-prod' });
        return { healthy: true, message: 'External Database Configured' };
    } catch (e: any) {
        if (e?.statusCode !== 404 && e?.response?.statusCode !== 404) {
            // If error is not 404, valid connection but other error
            console.error('[Health API] Database check error:', e);
            return { healthy: false, message: `Check failed: ${e.message}` };
        }
        return { healthy: false, message: 'Database secret not found' };
    }
}

async function checkFrontend(kc: KubeConfig): Promise<{ healthy: boolean; message: string }> {
    const k8sApi = kc.makeApiClient(CoreV1Api);
    try {
        const pods = await k8sApi.listNamespacedPod({
            namespace: 'temporal-prod',
            labelSelector: 'app.kubernetes.io/component=frontend',
            limit: 1 // Optimization: We only need to know if ANY are running
        });

        const runningPods = pods.items.filter((pod: V1Pod) => pod.status?.phase === 'Running');
        if (runningPods.length > 0) return { healthy: true, message: 'Frontend service running' };
        return { healthy: false, message: 'Frontend pods not running' };
    } catch (error: any) {
        return { healthy: false, message: `Frontend check failed: ${error?.message || error}` };
    }
}

async function checkGrafana(kc: KubeConfig): Promise<{ healthy: boolean; message: string }> {
    const k8sApi = kc.makeApiClient(CoreV1Api);
    try {
        // Optimize: Skip service check, just check pods. Service check adds RTT.
        const pods = await k8sApi.listNamespacedPod({
            namespace: 'temporal-prod',
            labelSelector: 'app.kubernetes.io/name=grafana',
            limit: 1
        });

        const runningPods = pods.items.filter((pod: V1Pod) => pod.status?.phase === 'Running');
        if (runningPods.length > 0) return { healthy: true, message: 'Grafana operational' };
        return { healthy: false, message: 'Grafana pods not running' };
    } catch (error: any) {
        return { healthy: false, message: `Grafana check failed: ${error?.message || error}` };
    }
}

async function checkPrometheus(kc: KubeConfig): Promise<{ healthy: boolean; message: string }> {
    const k8sApi = kc.makeApiClient(CoreV1Api);
    try {
        // Optimize: Skip service check, just check pods.
        const pods = await k8sApi.listNamespacedPod({
            namespace: 'temporal-prod',
            labelSelector: 'app.kubernetes.io/component=server,app.kubernetes.io/name=prometheus',
            limit: 1
        });

        const runningPods = pods.items.filter((pod: V1Pod) => pod.status?.phase === 'Running');
        if (runningPods.length > 0) {
            return { healthy: true, message: 'Prometheus operational' };
        }
        return { healthy: false, message: 'Prometheus pods not running' };
    } catch (error: any) {
        return { healthy: false, message: `Prometheus check failed: ${error?.message || error}` };
    }
}
