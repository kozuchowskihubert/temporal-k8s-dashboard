import { NextResponse } from 'next/server';
import { KubeConfig, CoreV1Api, V1Pod } from '@kubernetes/client-node';

// Force dynamic execution
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function getKubeConfig(): KubeConfig {
    const kc = new KubeConfig();

    const k8sServer = process.env.K8S_SERVER?.trim();
    const k8sToken = process.env.K8S_TOKEN?.trim();

    if (k8sServer && k8sToken) {
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
            users: [{ name: 'remote-user', token: k8sToken }],
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

    kc.loadFromDefault();
    return kc;
}

export async function GET() {
    try {
        const kc = getKubeConfig();
        const k8sApi = kc.makeApiClient(CoreV1Api);

        // Fetch Pods
        const podsByComponent = await getPodCounts(k8sApi);

        // Fetch Prometheus Metrics
        const resources = await getPrometheusMetrics(kc);

        // Merge Metrics
        Object.keys(podsByComponent).forEach((comp) => {
            if (resources[comp]) {
                podsByComponent[comp].cpu = resources[comp].cpu;
                podsByComponent[comp].memory = resources[comp].memory;
            }
        });

        return NextResponse.json({
            pods: podsByComponent,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('Metrics API Error:', error);
        return NextResponse.json(
            { error: error?.message || 'Unknown error' },
            { status: 500 }
        );
    }
}

async function getPodCounts(k8sApi: CoreV1Api) {
    try {
        const res = await k8sApi.listNamespacedPod({ namespace: 'temporal-prod' });
        const podsByComponent: Record<string, any> = {};

        res.items.forEach((pod: V1Pod) => {
            const labels = pod.metadata?.labels || {};
            const component =
                labels['app.kubernetes.io/component'] ||
                labels['app.kubernetes.io/name'] ||
                labels['app'];

            if (!component) return;

            if (!podsByComponent[component]) {
                podsByComponent[component] = {
                    total: 0,
                    running: 0,
                    pending: 0,
                    failed: 0,
                    cpu: 0,
                    memory: 0
                };
            }

            podsByComponent[component].total++;
            const phase = pod.status?.phase?.toLowerCase();
            if (phase === 'running') podsByComponent[component].running++;
            else if (phase === 'pending') podsByComponent[component].pending++;
            else if (phase === 'failed') podsByComponent[component].failed++;
        });

        return podsByComponent;
    } catch (error) {
        console.error('Failed to list pods:', error);
        return {};
    }
}

async function getPrometheusMetrics(kc: KubeConfig) {
    // We access Prometheus via the K8s API Proxy to avoid exposing it publicly
    // Path: /api/v1/namespaces/{namespace}/services/{service}:{port}/proxy/api/v1/query
    const namespace = 'temporal-prod';
    const service = 'temporal-prod-prometheus-server';
    const port = 80;
    const path = `/api/v1/namespaces/${namespace}/services/http:${service}:${port}/proxy/api/v1/query`;

    const metrics: Record<string, { cpu: number; memory: number }> = {};

    try {
        const opts = {
            headers: {
                // In some k8s versions / client-node versions, headers might be needed
            }
        }

        // 1. Query CPU Usage (cores)
        // rate(container_cpu_usage_seconds_total)[2m] summed by component
        const cpuQuery = `sum(rate(container_cpu_usage_seconds_total{namespace="${namespace}", container!="POD", container!=""}[2m])) by (app_kubernetes_io_component)`;

        // 2. Query Memory Usage (bytes)
        // container_memory_working_set_bytes summed by component
        const memQuery = `sum(container_memory_working_set_bytes{namespace="${namespace}", container!="POD", container!=""}) by (app_kubernetes_io_component)`;

        const [cpuRes, memRes] = await Promise.all([
            queryPrometheus(kc, path, cpuQuery),
            queryPrometheus(kc, path, memQuery)
        ]);

        // Process CPU
        cpuRes?.data?.result?.forEach((r: any) => {
            const comp = r.metric.app_kubernetes_io_component;
            if (comp) {
                if (!metrics[comp]) metrics[comp] = { cpu: 0, memory: 0 };
                metrics[comp].cpu = parseFloat(r.value[1]);
            }
        });

        // Process Memory
        memRes?.data?.result?.forEach((r: any) => {
            const comp = r.metric.app_kubernetes_io_component;
            if (comp) {
                if (!metrics[comp]) metrics[comp] = { cpu: 0, memory: 0 };
                metrics[comp].memory = parseFloat(r.value[1]);
            }
        });

        return metrics;

    } catch (error) {
        console.error('Failed to query Prometheus:', error);
        return {};
    }
}

async function queryPrometheus(kc: KubeConfig, path: string, query: string) {
    try {
        // Use the raw request capability of the KubeConfig fetch implementation
        // This handles authentication (tokens, certs) automatically
        // Note: fetchImpl is not directly exposed on KubeConfig in a convenient way for arbitrary paths 
        // in all versions, but makeApiClient(CoreV1Api).request is. 
        // Actually, simplest is to use the cluster server URL and fetch with opts.

        const cluster = kc.getCurrentCluster();
        const user = kc.getCurrentUser();

        if (!cluster) throw new Error("No cluster defined");

        const url = `${cluster.server}${path}?query=${encodeURIComponent(query)}`;

        const opts: any = {};
        await kc.applyToFetchOptions(opts);

        const response = await fetch(url, opts);

        if (!response.ok) {
            const text = await response.text();
            console.error(`Prometheus query failed: ${response.status} - ${text}`);
            return null;
        }

        return await response.json();

    } catch (e) {
        console.error('Error executing Prometheus query:', e);
        return null;
    }
}
