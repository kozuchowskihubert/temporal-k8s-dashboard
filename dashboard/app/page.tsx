import CommandPanel from './components/CommandPanel';
import ConnectivityStatus from './components/ConnectivityStatus';
import MetricsChart from './components/MetricsChart';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Temporal Cluster Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Monitor your Temporal deployment health and performance
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Cluster Status"
            value="Healthy"
            icon="✅"
            subtitle="All services operational"
          />
          <MetricCard
            title="Total Shards"
            value="512"
            icon="📊"
            subtitle="Distributed across instances"
          />
          <MetricCard
            title="Memory Usage"
            value="~120 MiB"
            icon="💾"
            subtitle="Per instance average"
          />
        </div>

        {/* Connectivity Status Section */}
        <section className="mb-8 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
          <ConnectivityStatus />
        </section>

        {/* Metrics Chart Section */}
        <section className="mb-8 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
          <MetricsChart />
        </section>

        {/* Command Panel Section */}
        <section className="mb-8 bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <CommandPanel />
        </section>

        <section className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatRow label="Goroutines" value="~10K" />
            <StatRow label="Environments" value="Staging + Production" />
            <StatRow label="Database" value="NEON PostgreSQL" />
            <StatRow label="Monitoring" value="Prometheus + Grafana" />
          </div>
        </section>

        <section className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4">Architecture</h2>
          <div className="space-y-3 text-gray-300">
            <InfoRow label="Deployment" value="Kubernetes (k3d)" />
            <InfoRow label="Chart Version" value="0.73.1" />
            <InfoRow label="Server Version" value="1.29.1" />
            <InfoRow label="Connection" value="Direct (no pooler)" />
          </div>
        </section>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Temporal Cluster • Managed with Kubernetes</p>
        </footer>
      </div>
    </main>
  );
}

function MetricCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: string;
  subtitle: string;
}) {
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-gray-500 text-sm">{subtitle}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400">{label}:</span>
      <span className="font-mono text-sm bg-gray-900/50 px-3 py-1 rounded">
        {value}
      </span>
    </div>
  );
}
