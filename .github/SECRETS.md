# GitHub Secrets Configuration Guide

This document explains how to set up the required GitHub secrets for the CI/CD pipeline.

## Required Secrets

### 1. KUBE_CONFIG

Your Kubernetes cluster configuration file, base64-encoded.

**Steps to create:**

```bash
# Method 1: From your local kubeconfig
cat ~/.kube/config | base64

# Method 2: If using a specific context
kubectl config view --minify --flatten | base64

# Copy the output and add it to GitHub Secrets
```

**Add to GitHub**:
1. Go to your repository on GitHub
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Name: `KUBE_CONFIG`
5. Value: Paste the base64-encoded kubeconfig
6. Click "Add secret"

### 2. NEON_DB_PASSWORD

Your NEON database password.

**Value**: `npg_GQlk2J9ALuHw` (your current password)

**Add to GitHub**:
1. Go to Settings > Secrets and variables > Actions
2. Click "New repository secret"
3. Name: `NEON_DB_PASSWORD`
4. Value: `npg_GQlk2J9ALuHw`
5. Click "Add secret"

## Verifying Secrets

Once added, you can verify secrets are configured:

1. Go to Settings > Secrets and variables > Actions
2. You should see:
   - `KUBE_CONFIG`
   - `NEON_DB_PASSWORD`

**Note**: You cannot view secret values after creation (security feature).

## Testing the CI/CD Pipeline

After adding secrets:

```bash
# Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial Temporal deployment setup"

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to trigger the workflow
git push -u origin main
```

## Security Best Practices

1. **Rotate Secrets Regularly**: Update NEON password and kubeconfig periodically
2. **Limit Access**: Only grant repository access to trusted users
3. **Use Environment Protection**: Enable environment protection rules in GitHub
4. **Monitor Activity**: Review Actions logs for unauthorized deployments

## Troubleshooting

### "Error: invalid kubeconfig"

- Ensure kubeconfig is properly base64-encoded
- Verify kubeconfig can connect to your cluster locally first
- Check for any special characters that might not encode properly

### "Error: authentication failed"

- Verify NEON password is correct
- Check if password has expired or been rotated
- Test connection manually: `psql 'postgresql://neondb_owner:PASSWORD@...'`

## Alternative: Use GitHub Environments

For better control, use GitHub Environments:

1. Go to Settings > Environments
2. Create a "production" environment
3. Add secrets to the environment
4. Enable required reviewers for production deployments
