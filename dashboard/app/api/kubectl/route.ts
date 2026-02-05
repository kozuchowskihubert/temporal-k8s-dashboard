import { NextResponse } from 'next/server';
import { KubeConfig, CoreV1Api, AppsV1Api } from '@kubernetes/client-node';

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

export async function POST(request: Request) {
    try {
        const { command, namespace = 'temporal-prod' } = await request.json();
        const kc = getKubeConfig();
        const coreApi = kc.makeApiClient(CoreV1Api);
        const appsApi = kc.makeApiClient(AppsV1Api);

        let result: any;

        switch (command) {
            case 'get-pods':
                result = await coreApi.listNamespacedPod({ namespace });
                break;
            case 'get-services':
                result = await coreApi.listNamespacedService({ namespace });
                break;
            case 'get-deployments':
                result = await appsApi.listNamespacedDeployment({ namespace });
                break;
            case 'check-frontend':
                result = await coreApi.listNamespacedPod({
                    namespace,
                    labelSelector: 'app.kubernetes.io/component=frontend'
                });
                break;
            case 'check-history':
                result = await coreApi.listNamespacedPod({
                    namespace,
                    labelSelector: 'app.kubernetes.io/component=history'
                });
                break;
            case 'check-matching':
                result = await coreApi.listNamespacedPod({
                    namespace,
                    labelSelector: 'app.kubernetes.io/component=matching'
                });
                break;
            case 'check-worker':
                result = await coreApi.listNamespacedPod({
                    namespace,
                    labelSelector: 'app.kubernetes.io/component=worker'
                });
                break;
            case 'get-web-logs':
                // Find a web pod first
                const pods = await coreApi.listNamespacedPod({
                    namespace,
                    labelSelector: 'app.kubernetes.io/component=web'
                });

                if (pods.items.length > 0) {
                    const podName = pods.items[0].metadata?.name;
                    if (podName) {
                        const logs = await coreApi.readNamespacedPodLog({
                            name: podName,
                            namespace,
                            tailLines: 50
                        });
                        // The generated client implementation for readNamespacedPodLog usually returns the string directly
                        // when the response type is text/plain, but dependent on the specific client version and generation.
                        // Safe to assume output is what we want here.
                        return NextResponse.json({ success: true, output: logs });
                    }
                }
                return NextResponse.json({ success: false, output: 'No web pods found' });

            default:
                return NextResponse.json(
                    { error: 'Invalid command' },
                    { status: 400 }
                );
        }

        // Return the API response object directly, wrapping it as data
        return NextResponse.json({ success: true, data: result });

    } catch (error: any) {
        console.error('Kubectl API Error:', error);
        return NextResponse.json(
            { error: error?.message || 'Unknown error' },
            { status: 500 }
        );
    }
}
