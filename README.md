# DevOps Technical Test - Hybrid Deployment

This project implements a hybrid deployment strategy for a DevOps technical test, covering both traditional deployment using Ansible/PM2 on VMs and modern containerized deployment using Docker/GKE with FluxCD GitOps.

## 🏗 Project Structure

```text
.
├── .github/workflows/      # CI Pipeline (Build & Push Docker Image)
├── ansible/                # Part A - Ansible & PM2 Configuration
│   ├── roles/              # Ansible Roles (runtime & app)
│   ├── playbooks/          # Main Deployment Playbook
│   ├── inventory.ini       # Target Server Inventory
│   └── ansible.cfg         # Ansible Configuration
├── app/                    # Sample Node.js Express Application
│   ├── Dockerfile          # Container Definition
│   └── index.js            # Main Logic
├── charts/node-app/        # Part B - Helm Chart for Kubernetes
└── flux/                   # Part B - FluxCD GitOps Manifests
```

## 🚀 Part A: Traditional Deployment (Ansible + PM2)

This section automates the runtime setup and application deployment on a Google Compute Engine (GCE) VM.

### Prerequisites
- SSH access to the GCE VM.
- Ansible installed on your local machine or jump host.

### Deployment Steps
1. Update the VM External IP and Username in `ansible/inventory.ini`.
2. Run the Playbook:
   ```bash
   cd ansible
   ansible-playbook playbooks/deploy.yml
   ```

### Features
- Automated installation of Node.js 20 & PM2.
- PM2 startup configuration (systemd persistence).
- Zero-downtime application restart management.

---

## ☸️ Part B: Modern Deployment (Docker + FluxCD GitOps)

A modern containerized strategy where the Kubernetes cluster automatically synchronizes with the Git repository.

### Tech Stack
- **CI**: GitHub Actions (Build & Push to GCR).
- **CD**: FluxCD (GitOps Controller).
- **Automation**: Flux Image Automation (Auto-detect & update image tags).
- **Package Manager**: Helm (via Flux HelmRelease).

### GitOps Workflow
1. **Push Code**: Developer pushes changes to the `main` branch.
2. **CI Build**: GitHub Actions builds the Docker image and pushes it to Google Container Registry (GCR).
3. **Detection**: Flux `ImageRepository` detects the new tag in GCR.
4. **Auto-Update**: Flux `ImageUpdateAutomation` updates the image tag in `charts/node-app/values.yaml` and commits the change back to Git.
5. **Sync**: Flux `HelmRelease` detects the Git commit and reconciles the state in the Kubernetes cluster.

### Setup FluxCD
```bash
flux bootstrap github \
  --owner=<GITHUB_USER> \
  --repository=devops-test-pena \
  --branch=main \
  --path=flux/clusters/devops-test \
  --personal
```

---

## 🧪 Verification

### Part A (VM Deployment)
Access the application via the VM External IP:
```bash
curl http://<VM_IP>:3000
```

### Part B (K8s Deployment)
Get the LoadBalancer External IP and access the application:
```bash
kubectl get svc node-app-service
curl http://<K8S_EXTERNAL_IP>
```

## 📊 Visibility & Monitoring
The application provides basic monitoring endpoints:
- `http://<IP>/health` - Health check status.
- `http://<IP>/metrics` - Basic system and performance metrics.
