import React, { useEffect, useState, useMemo } from 'react';

const DEVOPS_SNIPPETS = [
  `
# Dockerfile for High-Performance Production Environment
FROM node:20-alpine AS builder
WORKDIR /app
# Installing dependencies with clean install to ensure reproducible builds across all environments
COPY package*.json ./
RUN npm ci --only=production --no-audit --prefer-offline --progress=false --loglevel=error
COPY . .
# Building the application with production flags and optimization settings enabled for maximum performance
RUN npm run build -- --prod --configuration=production --output-hashing=all --optimization=true

FROM nginx:alpine-slim
# Copying build artifacts to Nginx directory and setting up custom configuration for caching and security headers
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Adding healthcheck to ensure container is healthy before traffic is routed by the load balancer
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;", "-c", "/etc/nginx/nginx.conf"]
`,
  `
# Terraform Infrastructure Provisioning - AWS Region eu-central-1
resource "aws_instance" "high_availability_web_cluster_node" {
  ami           = "ami-0c55b159cbfafe1f0" # Amazon Linux 2 LTS Candidate 2 - optimized for container workloads
  instance_type = "t3.medium" # Upgraded for better burst performance during peak traffic
  subnet_id     = aws_subnet.public_subnet_az1.id
  key_name      = aws_key_pair.deployer_key.key_name
  vpc_security_group_ids = [aws_security_group.web_traffic.id, aws_security_group.internal_management.id]
  
  tags = {
    Name = "Vibe-DevOps-Cluster-Production-Node-Primary"
    Environment = "Production"
    ManagedBy = "Terraform"
    CostCenter = "DevOps-R&D-Department-2026"
    SecurityLevel = "High-Compliance-Tier-1"
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = 50
    iops        = 3000
    throughput  = 125
    delete_on_termination = true
    encrypted   = true
    kms_key_id  = aws_kms_key.storage_encryption.arn
  }

  user_data = <<-EOF
              #!/bin/bash
              echo "Initializing system configuration and security updates..." >> /var/log/user-data.log
              yum update -y && yum install -y docker git htop vim jq curl wget
              systemctl start docker && systemctl enable docker
              usermod -aG docker ec2-user
              echo "Deploying initial application bootstrap configuration..."
              docker run -d -p 80:80 --name vibe-proxy --restart always nginx:alpine
              EOF
}
`,
  `
# Kubernetes Deployment - Mission Critical Service
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vibe-devops-core-service-v2
  namespace: production-workloads
  annotations:
    kubernetes.io/change-cause: "Updating to version 2.4.5 with critical security patches and performance improvements"
    prometheus.io/scrape: "true"
    prometheus.io/port: "3000"
    prometheus.io/path: "/metrics"
  labels:
    app: vibe-core
    tier: backend
    version: v2.4.5
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0 # Zero downtime deployment policy
  selector:
    matchLabels:
      app: vibe-core
      tier: backend
  template:
    metadata:
      labels:
        app: vibe-core
        tier: backend
    spec:
      serviceAccountName: vibe-service-account
      securityContext:
        fsGroup: 1000
        runAsUser: 1000
        runAsNonRoot: true
      containers:
      - name: vibe-container-main
        image: registry.gitlab.com/kompot/vibe-devops/core:v2.4.5-stable
        imagePullPolicy: Always
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        ports:
        - containerPort: 3000
          name: http-api
          protocol: TCP
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: http-api
          initialDelaySeconds: 15
          periodSeconds: 20
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: http-api
          initialDelaySeconds: 5
          periodSeconds: 10
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: vibe-db-credentials
              key: connection-string
        - name: FEATURE_FLAGS
          value: "enable_new_ui=true,optimize_search=true,dark_mode_default=true"
`,
  `
#!/bin/bash
# Advanced Cluster Auto-remediation and Scaling Script
# Author: Kompot | Date: 2026-02-02 | Version: 3.1.0

set -e
set -o pipefail

CLUSTER_NAME="vibe-cluster-production-eu-central-1"
REGION="eu-central-1"
LOG_FILE="/var/log/vibe-ops/cluster-monitor.log"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_CHANNEL/YOUR_TOKEN"

log_message() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] [INFO] $1" | tee -a "$LOG_FILE"
}

error_handler() {
    local line_no=$1
    echo "Error occurred in script at line $line_no" | tee -a "$LOG_FILE"
    curl -X POST -H 'Content-type: application/json' --data "{\"text\":\"🚨 Critical Alert: Auto-scaling script failed on server $(hostname) at line $line_no\"}" "$SLACK_WEBHOOK_URL"
}

trap 'error_handler $LINENO' ERR

log_message "Starting health checks for cluster: $CLUSTER_NAME in region $REGION..."

# Verify connectivity to the Kubernetes API server
if ! kubectl get nodes --context "$CLUSTER_NAME" --request-timeout=5s > /dev/null 2>&1; then
    log_message "WARNING: API Server is unresponsive. Attempting to rotate kubeconfig credentials..."
    aws eks update-kubeconfig --region "$REGION" --name "$CLUSTER_NAME"
fi

NODE_COUNT=$(kubectl get nodes --context "$CLUSTER_NAME" --no-headers | grep -c 'Ready')
log_message "Current active node count: $NODE_COUNT. Checking metrics server..."

# Check High CPU Load on Nodes
HIGH_CPU_NODES=$(kubectl top nodes --no-headers | awk '$3 > 80% {print $1}')

if [ -n "$HIGH_CPU_NODES" ]; then
    log_message "High CPU usage detected on nodes: $HIGH_CPU_NODES. Triggering auto-scaler..."
    # Complex logic to trigger scaling event would go here
    echo "$HIGH_CPU_NODES" | xargs -I {} echo "Tainting node {} to prevent new scheduling..."
else
    log_message "Cluster load is within normal operating parameters. No action required."
fi
`,
  `
// TypeScript Application Logic - Complex State Management
interface DetailedDevOpsEngineer {
  readonly id: string;
  fullName: string;
  certifications: Array<'CKA' | 'CKAD' | 'CKS' | 'AWS-PRO' | 'Terraform-Associate'>;
  skills: {
    primary: string[];
    secondary: string[];
    learning: string[];
  };
  metrics: {
    coffeeConsumptionLiters: number;
    linesOfCodeWritten: number;
    productionIncidentsCaused: number; // Hopefully zero
    productionIncidentsResolved: number;
  };
  preferences: {
    editor: 'VSCode' | 'Vim' | 'Neovim' | 'IntelliJ';
    theme: 'Dark' | 'Light' | 'Dracula' | 'Monokai';
    tabsOrSpaces: 'Tabs' | 'Spaces'; // The eternal debate
  };
}

const deployToProduction = async (
  configuration: DeploymentConfig, 
  dryRun: boolean = false
): Promise<DeploymentResult> => {
  const startTime = performance.now();
  console.log(\`Starting deployment process for version \${configuration.version} at \${new Date().toISOString()}\`);

  try {
    // Phase 1: Validation
    if (!validateConfiguration(configuration)) {
      throw new ValidationError("Configuration integrity check failed. Missing required environment variables.");
    }

    // Phase 2: Artifact Preparation
    const artifactUrl = await buildAndPushArtifacts(configuration.sourcePath, configuration.targetRegistry);
    console.log(\`Artifacts successfully pushed to \${artifactUrl}. Proceeding to infrastructure update...\`);

    if (dryRun) {
      console.log("Dry run mode active. Skipping actual deployment commands.");
      return { success: true, message: "Dry run completed successfully", duration: performance.now() - startTime };
    }

    // Phase 3: Rollout
    await kubernetesClient.apps.v1.createNamespacedDeployment(configuration.namespace, createDeploymentSpec(artifactUrl));
    
    return {
      success: true,
      deploymentId: crypto.randomUUID(),
      message: "Deployment successfully rolled out to cluster.",
      timestamp: new Date()
    };

  } catch (error) {
    console.error("CRITICAL DEPLOYMENT FAILURE:", error instanceof Error ? error.message : "Unknown error");
    await rollbackToLastKnownGoodState(configuration.namespace, configuration.appName);
    process.exit(1);
  }
};
`
];

const CursorCodeEffect: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const codeContent = useMemo(() => {
    // Repeat snippets enough times to fill the screen
    let content = "";
    for (let i = 0; i < 50; i++) {
      const snippet = DEVOPS_SNIPPETS[i % DEVOPS_SNIPPETS.length];
      content += snippet + "\n";
    }
    return content;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0"
    >
      <div 
        className="absolute inset-0 text-sm leading-relaxed font-mono text-thinkpad-red opacity-10"
        style={{
          whiteSpace: 'pre-wrap', // Preserves newlines and spacing
          wordBreak: 'break-word',
          maskImage: `radial-gradient(circle 400px at ${mousePos.x}px ${mousePos.y}px, black 30%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(circle 400px at ${mousePos.x}px ${mousePos.y}px, black 30%, transparent 100%)`,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace" 
        }}
      >
        {codeContent}
      </div>
    </div>
  );
};

export default CursorCodeEffect;
