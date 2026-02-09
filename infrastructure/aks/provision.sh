#!/bin/bash
set -e

RESOURCE_GROUP="temporal-rg"
CLUSTER_NAME="temporal-aks"
LOCATION="eastus"

echo "Creating Resource Group: $RESOURCE_GROUP in $LOCATION..."
az group create --name $RESOURCE_GROUP --location $LOCATION

echo "Creating AKS Cluster: $CLUSTER_NAME..."
# Using --generate-ssh-keys to automatically create SSH keys
# Node count 1 for cost saving in dev/test, standard DS2_v2
az aks create \
    --resource-group $RESOURCE_GROUP \
    --name $CLUSTER_NAME \
    --node-count 2 \
    --enable-addons monitoring \
    --generate-ssh-keys \
    --tier free \
    --node-vm-size Standard_D2s_v3

echo "Getting Credentials..."
az aks get-credentials --resource-group $RESOURCE_GROUP --name $CLUSTER_NAME --overwrite-existing

echo "AKS Provisioning Complete!"
kubectl get nodes
