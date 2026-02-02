import React, { useEffect, useState, useMemo } from 'react';

const DEVOPS_SNIPPETS = [
  `
# Dockerfile for Production
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`,
  `
# Terraform Infrastructure
resource "aws_instance" "web_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  
  tags = {
    Name = "Vibe-DevOps-Cluster"
    Environment = "Production"
    ManagedBy = "Terraform"
  }

  user_data = <<-EOF
              #!/bin/bash
              echo "Hello, World" > index.html
              nohup python -m SimpleHTTPServer 80 &
              EOF
}
`,
  `
# Kubernetes Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vibe-devops-app
  labels:
    app: vibe
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vibe
  template:
    metadata:
      labels:
        app: vibe
    spec:
      containers:
      - name: vibe-container
        image: kompot/vibe:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        # EASTER EGG: Kompot was here
`,
  `
#!/bin/bash
# Auto-scaling script
set -e

CLUSTER_NAME="vibe-cluster"
REGION="eu-central-1"

echo "Checking cluster status..."
kubectl get nodes --context $CLUSTER_NAME

if [ $? -eq 0 ]; then
  echo "Cluster is healthy. Deploying updates..."
  helm upgrade --install vibe-app ./charts/vibe
else
  echo "Critical Error: Cluster exploded."
  # TODO: Call Kompot to fix this mess
  exit 1
fi
`,
  `
// Typescript Interface
interface DevOpsEngineer {
  skills: string[];
  coffeeLevel: number;
  sleepHours: number; // usually 0
  canExitVim: boolean;
}

const deploy = async (config: Config): Promise<void> => {
  try {
    await validate(config);
    console.log("Deploying to prod...");
  } catch (e) {
    console.error("It works on my machine though");
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
