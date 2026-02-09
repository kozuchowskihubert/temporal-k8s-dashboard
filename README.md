# Temporal Production Cluster Deployment

Production-ready Temporal cluster deployment on Kubernetes with NEON PostgreSQL backend.

## 📋 Overview

Resilient Temporal cluster (v0.73.1) deployment on Kubernetes with:
- **Database**: NEON PostgreSQL with SSL/TLS
- **High Availability**: Multi-replica deployment
- **Automation**: GitHub Actions CI/CD with Dry-Run validation

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Kubernetes Cluster (k3d)"
        subgraph "Temporal Services"
            Frontend[Frontend<br/>3 replicas]
            History[History<br/>3 replicas]
            Matching[Matching<br/>3 replicas]
            Worker[Worker<br/>2 replicas]
        end
        
        subgraph "Monitoring Stack"
            Grafana[Grafana<br/>Dashboards]
            Prometheus[Prometheus<br/>Metrics]
            Alertmanager[Alertmanager]
        end
        
        Web[Web UI<br/>2 replicas]
        Admintools[Admin Tools<br/>CLI]
    end
    
    subgraph "External Services"
        NeonDB[(NEON PostgreSQL<br/>Direct Connection<br/>SSL/TLS)]
    end
    
    subgraph "Clients"
        App[Applications]
        Dashboard[Dashboard<br/>Next.js]
    end
    
    App -->|Workflow Execution| Frontend
    Dashboard -->|Monitoring| Web
    Dashboard -->|Metrics API| Prometheus
    
    Frontend --> History
    Frontend --> Matching
    History --> Worker
    
    Frontend -->|Store/Query| NeonDB
    History -->|Store/Query| NeonDB
    Matching -->|Store/Query| NeonDB
    Worker -->|Store/Query| NeonDB
    
    Prometheus -->|Scrape Metrics| Frontend
    Prometheus -->|Scrape Metrics| History
    Prometheus -->|Scrape Metrics| Matching
    Prometheus -->|Scrape Metrics| Worker
    Grafana -->|Query| Prometheus
    
    style NeonDB fill:#00e5cc
    style Grafana fill:#f46800
    style Prometheus fill:#e6522c
    style Frontend fill:#6469ff
    style Dashboard fill:#0070f3
```

## 🔄 Deployment Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant Actions as GitHub Actions
    participant K8s as Kubernetes
    participant Helm as Helm
    participant Neon as NEON DB
    
    Dev->>GH: Push Code / Create PR
    GH->>Actions: Trigger Workflow
    
    alt Dry Run Mode (Default)
        Actions->>Actions: Validate .env secrets
        Actions->>Helm: helm template --debug
        Actions->>Actions: Output validation results
        Actions-->>Dev: ✓ Dry run passed
    else Production Deploy
        Actions->>Actions: Load secrets
        Actions->>K8s: Create namespace
        Actions->>K8s: Create db secret
        Actions->>Helm: helm upgrade --install
        Helm->>K8s: Deploy Temporal pods
        K8s->>K8s: Run schema setup job
        K8s->>Neon: Initialize schemas
        Neon-->>K8s: ✓ Schema ready
        K8s->>K8s: Start services
        Actions->>K8s: kubectl get pods
        Actions-->>Dev: ✓ Deployment successful
    end
```

## 📊 Data Flow

```mermaid
graph LR
    subgraph "Application Layer"
        Client[Client App<br/>Temporal SDK]
    end
    
    subgraph "Temporal Cluster"
        Frontend[Frontend Service<br/>:7233]
        History[History Service<br/>Workflow State]
        Matching[Matching Service<br/>Task Queues]
        Worker[Worker Service<br/>Activity Execution]
    end
    
    subgraph "Persistence"
        Default[(Default Store<br/>temporal DB)]
        Visibility[(Visibility Store<br/>temporal_visibility DB)]
    end
    
    Client -->|1. Start Workflow| Frontend
    Frontend -->|2. Store Event| Default
    Frontend -->|3. Add to Queue| Matching
    Matching -->|4. Poll Task| Worker
    Worker -->|5. Execute Activity| Worker
    Worker -->|6. Return Result| History
    History -->|7. Update State| Default
    History -->|8. Index for Search| Visibility
    Frontend -->|9. Query Result| Client
    
    style Client fill:#4CAF50
    style Frontend fill:#6469ff
    style Default fill:#00e5cc
    style Visibility fill:#00e5cc
```


## 📁 Project Structure

```
.
├── backend/                  # Infrastructure & DB Config
│   ├── temporal/             # Temporal Cluster Config
│   │   ├── temporal-values-neon.yaml  # Helm values
│   │   └── temporal-namespace.yaml    # K8s Namespace
│   └── database/             # Database Config
│       ├── temporal-db-secret.yaml    # Secret templates
│       └── *.sql                      # Sample schemas
├── frontend/                 # Client Applications (Placeholder)
└── ci-cd/                    # Deployment Scripts
    ├── Deploy-Temporal.ps1    # Manual deployment
    └── Verify-Temporal.ps1    # Cluster verification
```

## 🚀 Deployment

### Option 1: CI/CD (Recommended)

GitHub Actions workflow is configured in `.github/workflows/deploy-temporal.yml`.
Defaults to **Dry-Run** mode for safety.

To deploy to production:
1. Go to "Actions" tab
2. Select "Deploy Temporal to Kubernetes"
3. Click "Run workflow"
4. Set "Dry run mode" to `false`

### Option 2: Manual Deployment

```bash
cd ci-cd

# Dry Run (Validate Only)
./Deploy-Temporal.ps1 -DryRun

# Production Deploy
./Deploy-Temporal.ps1
```

## ⚙️ Configuration

- **Cluster Config**: `backend/temporal/temporal-values-neon.yaml`
- **Database Secrets**: `backend/database/temporal-db-secret.yaml`
- **Schemas**: See `backend/database/*.sql` for reference

## 📊 Monitoring

**Grafana Performance Dashboards** are enabled.

```bash
# Access Grafana Dashboard (User: admin)
# 1. Get Password
kubectl get secret -n temporal-prod temporal-grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo

# 2. Port Forward
kubectl port-forward -n temporal-prod svc/temporal-grafana 3000:80

# 3. Open http://localhost:3000
```

## 📚 Documentation
- [Quick Start Guide](QUICKSTART.md)
- [Secret Setup](.github/SECRETS.md)
