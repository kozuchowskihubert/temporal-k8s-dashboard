# Quick Start Guide

Get your Temporal cluster up and running in minutes.

## ⚡ Quick Deploy (5 minutes)

### Option 1: Manual Deployment

```bash
# 1. Navigate to project directory
cd /Users/haos/psql-kube-prod

# 2. Deploy Temporal (Dry Run first)
cd ci-cd
./Deploy-Temporal.ps1 -DryRun

# 3. Deploy for Real
./Deploy-Temporal.ps1

# 4. Verify deployment
./Verify-Temporal.ps1
```

### Option 2: CI/CD Deployment

```bash
# 1. Set up GitHub secrets (one-time setup)
# - KUBE_CONFIG: Your base64-encoded kubeconfig
# - NEON_DB_PASSWORD: your_neon_password_here

# 2. Push to GitHub
git init
git add .
git commit -m "Deploy Temporal cluster"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main

# GitHub Actions will automatically deploy!
```

## 🎯 First Steps After Deployment

### 1. Access Web UI

```bash
kubectl port-forward -n temporal-prod svc/temporal-web 8080:8080
```

Open: http://localhost:8080

### 2. Register Default Namespace

```bash
kubectl exec -n temporal-prod deployment/temporal-admintools -- \
  tctl namespace register default
```

### 3. Connect Your Workers

**Connection endpoint**: `temporal-frontend.temporal-prod.svc.cluster.local:7233`

Example (Go):
```go
c, err := client.Dial(client.Options{
    HostPort: "temporal-frontend.temporal-prod.svc.cluster.local:7233",
})
```

## 📊 Check Status

```bash
# Pod status
kubectl get pods -n temporal-prod

# Service endpoints
kubectl get svc -n temporal-prod

# Resource usage
kubectl top pods -n temporal-prod
```

## 🔧 Common Commands

```bash
# View logs
kubectl logs -n temporal-prod -l app.kubernetes.io/component=frontend

# Scale frontend
kubectl scale deployment temporal-frontend -n temporal-prod --replicas=5

# Access admin CLI
kubectl exec -it -n temporal-prod deployment/temporal-admintools -- bash
```

## ❓ Troubleshooting

**Pods not starting?**
```bash
kubectl describe pod <pod-name> -n temporal-prod
```

**Connection issues?**
```bash
cd ci-cd
./Verify-Temporal.ps1
```

**Need logs?**
```bash
kubectl logs -n temporal-prod -l app.kubernetes.io/name=temporal --tail=100
```

## 📚 Next Steps

- [Full README](README.md) - Complete documentation
- [GitHub Secrets Setup](.github/SECRETS.md) - CI/CD configuration
- [Temporal Docs](https://docs.temporal.io/) - Learn more
