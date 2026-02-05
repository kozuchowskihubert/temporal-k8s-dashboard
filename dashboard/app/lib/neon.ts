
interface NeonProjectDetails {
    cpu: number;
    ram: number;
    region: string;
    id: string;
    name: string;
}

export async function getProjectDetails(apiKey: string, projectId: string): Promise<NeonProjectDetails | null> {
    if (!apiKey || !projectId) return null;

    try {
        const response = await fetch(`https://console.neon.tech/api/v2/projects/${projectId}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`[Neon API] Failed to fetch project details: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        const project = data.project;

        // Extract relevant details. Note: The API structure might vary, adjusting for common V2 response.
        // Neon projects have a 'compute_endpoints' or similar, but top level project object
        // often contains the region and provisioned limits.

        // Fallback/Default values if exact fields are missing in the summary
        return {
            id: project.id,
            name: project.name,
            region: project.region_id || 'unknown',
            // Neon typically defines compute in 'Compute Units' (CU). 1 CU = 1 vCPU, 4GB RAM (approx)
            // We might need to look at the branch/endpoint for current active usage, but project limits work for now.
            cpu: project.default_endpoint_settings?.autoscaling_limit_max_cu || 0,
            ram: (project.default_endpoint_settings?.autoscaling_limit_max_cu || 0) * 4, // Approx 4GB per CU
        };
    } catch (error) {
        console.error('[Neon API] Error fetching details:', error);
        return null;
    }
}
