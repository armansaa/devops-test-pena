SHELL := /bin/bash

INVENTORY ?= ansible/inventory.ini
GROUP ?= app_servers
APP_USER ?=
LB_URL ?=
IMAGE ?= devops-test-pena:local
B1_PORT ?= 3000

.PHONY: help a1 a2 a2-reboot a3 a-all b1-build b1-run b1

help:
	@echo "Usage: make <target> [APP_USER=...] [LB_URL=...]"
	@echo "Targets:"
	@echo "  a1    - Verify Ansible connectivity to VM2"
	@echo "  a2    - Verify runtime (node/pm2) and app health on VM2"
	@echo "  a2-reboot - Reboot VM2 and verify PM2 app is back"
	@echo "  a3    - Verify app via Load Balancer"
	@echo "  a-all - Run a1, a2, a3"
	@echo "  b1-build - Build Docker image for the app"
	@echo "  b1-run   - Run container and verify /health locally"
	@echo "  b1       - Run b1-build and b1-run"

# A1: Ansible connectivity

a1:
	ansible -i $(INVENTORY) $(GROUP) -m ping

# A2: Runtime + app health on VM2

a2:
	@if [ -z "$(APP_USER)" ]; then \
		echo "APP_USER is required. Example: make a2 APP_USER=armansaa"; \
		exit 2; \
	fi
	ansible -i $(INVENTORY) $(GROUP) -b --become-user=$(APP_USER) -m shell -a "node -v && pm2 -v"
	ansible -i $(INVENTORY) $(GROUP) -b --become-user=$(APP_USER) -m shell -a "pm2 status && pm2 list | grep -q node-app"
	ansible -i $(INVENTORY) $(GROUP) -m uri -a "url=http://127.0.0.1:3000/health return_content=yes"

# A2: Reboot verification
a2-reboot:
	@if [ -z "$(APP_USER)" ]; then \
		echo "APP_USER is required. Example: make a2-reboot APP_USER=armansaa"; \
		exit 2; \
	fi
	ansible -i $(INVENTORY) $(GROUP) -b -m reboot -a "reboot_timeout=600"
	ansible -i $(INVENTORY) $(GROUP) -b --become-user=$(APP_USER) -m shell -a "pm2 status && pm2 list | grep -q node-app"

# A3: Load Balancer check

a3:
	@if [ -z "$(LB_URL)" ]; then \
		echo "LB_URL is required. Example: make a3 LB_URL=http://<LB_IP>/health"; \
		exit 2; \
	fi
	@curl -fsS $(LB_URL)
	@echo ""

# Run all Part A checks

a-all: a1 a2 a3
	@echo "All Part A checks completed."

# B1: Docker build + run verification

b1-build:
	docker build -t $(IMAGE) app

b1-run:
	@cid=$$(docker run -d -p $(B1_PORT):3000 $(IMAGE)); \
	sleep 2; \
	curl -fsS http://127.0.0.1:$(B1_PORT)/health; \
	echo ""; \
	docker rm -f $$cid >/dev/null

b1: b1-build b1-run
	@echo "B1 checks completed."
