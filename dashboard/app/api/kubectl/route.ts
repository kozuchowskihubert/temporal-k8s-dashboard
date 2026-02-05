import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Whitelist of safe kubectl commands
const ALLOWED_COMMANDS = {
    'get-pods': 'kubectl get pods -n temporal-prod -o json',
    'get-services': 'kubectl get svc -n temporal-prod -o json',
    'get-deployments': 'kubectl get deployments -n temporal-prod -o json',
    'check-frontend': 'kubectl get pods -n temporal-prod -l app.kubernetes.io/component=frontend -o json',
    'check-history': 'kubectl get pods -n temporal-prod -l app.kubernetes.io/component=history -o json',
    'check-matching': 'kubectl get pods -n temporal-prod -l app.kubernetes.io/component=matching -o json',
    'check-worker': 'kubectl get pods -n temporal-prod -l app.kubernetes.io/component=worker -o json',
    'get-web-logs': 'kubectl logs -n temporal-prod -l app.kubernetes.io/component=web --tail=50',
};

export async function POST(request: Request) {
    try {
        const { command, namespace = 'temporal-prod' } = await request.json();

        // Validate command
        if (!ALLOWED_COMMANDS[command as keyof typeof ALLOWED_COMMANDS]) {
            return NextResponse.json(
                { error: 'Invalid command' },
                { status: 400 }
            );
        }

        // Execute command
        const cmd = ALLOWED_COMMANDS[command as keyof typeof ALLOWED_COMMANDS].replace(
            'temporal-prod',
            namespace
        );

        const { stdout, stderr } = await execAsync(cmd);

        if (stderr && !stdout) {
            return NextResponse.json(
                { error: stderr },
                { status: 500 }
            );
        }

        // Try to parse as JSON, otherwise return raw output
        try {
            const data = JSON.parse(stdout);
            return NextResponse.json({ success: true, data });
        } catch {
            return NextResponse.json({ success: true, output: stdout });
        }
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
