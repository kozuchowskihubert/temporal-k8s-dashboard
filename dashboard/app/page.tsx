import CommandPanel from './components/CommandPanel';
import ConnectivityStatus from './components/ConnectivityStatus';
import MetricsChart from './components/MetricsChart';
import CommandList from './components/CommandList';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex justify-center">
      <div className="w-full max-w-7xl px-8 py-16 space-y-16">
        <header className="text-center space-y-6">
          <div className="inline-block px-5 py-2 bg-white/5 border border-white/20 rounded-full">
            <span className="text-gray-300 text-sm font-semibold tracking-widest">PRODUCTION CLUSTER</span>
          </div>
          <h1 className="text-8xl font-bold text-white leading-tight tracking-tight">
            Temporal Kubernetes
            <br />
            Dashboard
          </h1>
          <p className="text-gray-400 text-xl font-light max-w-3xl mx-auto leading-relaxed">
            Real-time monitoring and management for your Temporal workflow deployment
          </p>
          <p className="text-gray-600 text-base max-w-2xl mx-auto leading-relaxed">
            Track cluster health, pod metrics, service connectivity, and execute kubectl commands
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
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-semibold text-white">Service Connectivity</h2>
            <p className="text-gray-500 text-lg">Real-time health checks for all cluster services and dependencies</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <ConnectivityStatus />
          </div>
        </section>

        {/* Metrics Chart Section */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-semibold text-white">Pod Metrics</h2>
            <p className="text-gray-500 text-lg">Component-level pod health and distribution across your Temporal cluster</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <MetricsChart />
          </div>
        </section>

        {/* CLI Command Reference */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-semibold text-white">Quick Commands</h2>
            <p className="text-gray-500 text-lg">Common kubectl commands for managing your Temporal deployment</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-10 border border-white/10">
            <CommandList />
          </div>
        </section>

        {/* Command Panel Section */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-semibold text-white">Execute Commands</h2>
            <p className="text-gray-500 text-lg">Run kubectl commands directly from your browser and view real-time output</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-10 border border-white/10">
            <CommandPanel />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-10 border border-white/10 space-y-6">
            <div>
              <h2 className="text-3xl font-semibold text-white mb-2">Quick Stats</h2>
              <p className="text-gray-500 text-base">System-level metrics and configuration</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <StatRow label="Goroutines" value="~10K" />
              <StatRow label="Environments" value="Staging + Production" />
              <StatRow label="Database" value="NEON PostgreSQL" />
              <StatRow label="Monitoring" value="Prometheus + Grafana" />
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-10 border border-white/10 space-y-6">
            <div>
              <h2 className="text-3xl font-semibold text-white mb-2">Architecture</h2>
              <p className="text-gray-500 text-base">Deployment configuration and infrastructure</p>
            </div>
            <div className="space-y-4 text-gray-300">
              <InfoRow label="Deployment" value="Kubernetes (k3d)" />
              <InfoRow label="Chart Version" value="0.73.1" />
              <InfoRow label="Server Version" value="1.29.1" />
              <InfoRow label="Connection" value="Direct (no pooler)" />
            </div>
          </section>
        </div>

        <footer className="text-center text-gray-600 text-sm pt-8 border-t border-white/5">
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
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-lg p-6 border border-cyan-500/20 hover:border-cyan-400/60 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 transform hover:-translate-y-1">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-300 text-sm font-semibold uppercase tracking-wider">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-4xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{value}</p>
      <p className="text-gray-400 text-sm">{subtitle}</p>
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
