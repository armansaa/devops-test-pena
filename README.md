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

This section automates the runtime setup and application deployment on two Google Compute Engine (GCE) VMs:
- VM1: Ansible control node (public SSH access)
- VM2: App VM (private, behind NAT + Load Balancer)

### Prerequisites
- VM1 can SSH to VM2 (private IP).
- Ansible installed on VM1.

### Deployment Steps (manual)
1. Update the VM2 private IP and user in `ansible/inventory.ini`.
2. Run the playbook from VM1:
   ```bash
   cd ansible
   ansible-playbook playbooks/deploy.yml
   ```

### Deployment Steps (GitHub Actions)
1. Commit your app changes with a message containing `deploy_vm` or `deploy_all`.
2. Push to `main`.
3. GitHub Actions runs `.github/workflows/deploy-vm.yml`, SSHes into VM1, and runs Ansible.

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
On VM1, verify Ansible connectivity:
```bash
ansible -i ansible/inventory.ini app_servers -m ping
```

On VM2, verify the app:
```bash
curl http://127.0.0.1:3000/health
pm2 status
```

Verify via Load Balancer:
```bash
curl http://<LB_IP>/health
```

Reboot test (A2 requirement):
```bash
sudo reboot
# After VM2 is back:
pm2 status
```

### Deliverables Checklist
- `ansible/inventory.ini` present and points to VM2 private IP
- `ansible/ansible.cfg` present (inventory configured, host key checking disabled if needed)
- `ansible/roles/runtime/tasks/main.yml` installs Node.js + PM2 and enables startup
- `ansible/roles/app/tasks/main.yml` pulls app repo and runs with PM2
- `README.md` includes setup + verification steps
- Verified after reboot: `pm2 status` shows `node-app` running

### Makefile (Section A)
This repo includes a `Makefile` to quickly validate Part A checks.
Set variables as needed:
```bash
make a1
make a2 APP_USER=<vm2-user>
make a2-reboot APP_USER=<vm2-user>
make a3 LB_URL=http://<LB_IP>/health
make a-all APP_USER=<vm2-user> LB_URL=http://<LB_IP>/health
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
