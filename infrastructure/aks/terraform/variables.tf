variable "resource_group_name" {
  description = "Name of the resource group"
  default     = "temporal-rg"
}

variable "location" {
  description = "Azure region"
  default     = "East US"
}

variable "cluster_name" {
  description = "Name of the AKS cluster"
  default     = "temporal-aks"
}

variable "node_count" {
  description = "Number of nodes in the default node pool"
  default     = 2
}

variable "vm_size" {
  description = "VM size for the nodes"
  default     = "Standard_DS2_v2"
}
