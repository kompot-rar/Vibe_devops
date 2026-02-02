import React, { useEffect, useState, useMemo } from 'react';

const REAL_DEVOPS_CODE = `
# Kubernetes Production Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vibe-core-system
  namespace: production
  labels:
    app: vibe-core
    tier: backend
    version: v2.4.5-stable
spec:
  replicas: 12
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0
  selector:
    matchLabels:
      app: vibe-core
  template:
    metadata:
      labels:
        app: vibe-core
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - vibe-core
              topologyKey: kubernetes.io/hostname
      containers:
      - name: main-server
        image: registry.gitlab.com/kompot/vibe/core:latest
        resources:
          limits:
            cpu: "2000m"
            memory: "4Gi"
          requests:
            cpu: "500m"
            memory: "1Gi"
        env:
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: host
        ports:
        - containerPort: 8080
          name: http
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10

# Terraform AWS Infrastructure
resource "aws_eks_cluster" "main" {
  name     = "vibe-production-cluster-01"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids = module.vpc.private_subnets
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = ["0.0.0.0/0"]
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }

  tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
    Owner       = "Kompot"
  }
}

# Python Boto3 Automation Script
import boto3
import json
import logging

def lambda_handler(event, context):
    ec2 = boto3.client('ec2')
    instances = ec2.describe_instances(
        Filters=[{'Name': 'tag:Environment', 'Values': ['Dev']}]
    )
    
    to_stop = []
    for reservation in instances['Reservations']:
        for instance in reservation['Instances']:
            if instance['State']['Name'] == 'running':
                to_stop.append(instance['InstanceId'])
    
    if len(to_stop) > 0:
        print(f"Stopping instances: {to_stop}")
        ec2.stop_instances(InstanceIds=to_stop)
        return {
            'statusCode': 200,
            'body': json.dumps(f'Stopped {len(to_stop)} instances')
        }
    return {'statusCode': 200, 'body': 'No instances to stop'}

# Go High Performance Service
package main

import (
    "fmt"
    "net/http"
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
    requestDuration := prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "Time spent processing HTTP requests",
            Buckets: prometheus.DefBuckets,
        },
        []string{"method", "route"},
    )
    prometheus.MustRegister(requestDuration)

    http.Handle("/metrics", promhttp.Handler())
    http.HandleFunc("/api/v1/status", func(w http.ResponseWriter, r *http.Request) {
        timer := prometheus.NewTimer(requestDuration.WithLabelValues(r.Method, r.URL.Path))
        defer timer.ObserveDuration()
        
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusOK)
        w.Write([]byte('{"status": "healthy", "uptime": "99.999%"}'))
    })

    // 0xCAFEBABE_KOMPOT_WAS_HERE_0xDEADBEEF - HIDDEN_IN_BINARY
    fmt.Println("Starting server on :8080")
    if err := http.ListenAndServe(":8080", nil); err != nil {
        panic(err)
    }
}

# Bash CI/CD Pipeline
#!/bin/bash
set -eo pipefail

echo "Starting deployment pipeline..."
if [ -z "$CI_COMMIT_SHA" ]; then
  echo "Error: CI_COMMIT_SHA not set"
  exit 1
fi

docker build -t $REGISTRY/$IMAGE:$CI_COMMIT_SHA .
trivy image --severity HIGH,CRITICAL $REGISTRY/$IMAGE:$CI_COMMIT_SHA

if [ $? -eq 0 ]; then
  echo "Security scan passed. Pushing image..."
  docker push $REGISTRY/$IMAGE:$CI_COMMIT_SHA
  
  echo "Updating K8s manifest..."
  sed -i "s/image:.*$/image: $REGISTRY\/$IMAGE:$CI_COMMIT_SHA/g" deployment.yaml
  kubectl apply -f deployment.yaml
else
  echo "Security vulnerability detected! Aborting."
  exit 1
fi
`;

const CursorCodeEffect: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const codeContent = useMemo(() => {
    // Repeat the code block enough times to ensure it covers 4k screens fully
    // when wrapped
    let content = "";
    for (let i = 0; i < 20; i++) {
      content += REAL_DEVOPS_CODE + "\n";
      if (i % 5 === 0) {
        content += "\n// 🐇 EASTER EGG: FOLLOW THE WHITE RABBIT -> 0x539\n";
        content += "// SYSTEM_OVERRIDE_INITIATED_BY_KOMPOT\n";
      }
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
        className="absolute inset-0 text-xs leading-tight font-mono text-thinkpad-red opacity-10 break-all columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-8 text-right"
        style={{
          whiteSpace: 'pre-wrap', // Allows wrapping of long lines
          maskImage: `radial-gradient(circle 500px at ${mousePos.x}px ${mousePos.y}px, black 20%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(circle 500px at ${mousePos.x}px ${mousePos.y}px, black 20%, transparent 100%)`,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        }}
      >
        {codeContent}
      </div>
    </div>
  );
};

export default CursorCodeEffect;
