import React, { useEffect, useState, useMemo } from 'react';

const DEVOPS_COMMANDS = [
  "git push origin main",
  "git checkout -b dev",
  "docker-compose up -d --build",
  "kubectl get pods -A",
  "terraform apply -auto-approve",
  "ansible-playbook site.yml",
  "systemctl restart nginx",
  "npm run build",
  "cargo build --release",
  "python3 -m venv venv",
  "source venv/bin/activate",
  "aws s3 sync . s3://bucket",
  "gcloud container clusters get-credentials",
  "helm install my-release ./chart",
  "cat /etc/os-release",
  "htop",
  "vim /etc/hosts",
  "ping 8.8.8.8",
  "dig google.com",
  "netstat -anp | grep 80",
  "kill -9 $(lsof -t -i:3000)",
  "rm -rf node_modules && npm install",
  "git commit -m 'wip'",
  "git merge --no-ff feature/login",
  "export KUBECONFIG=~/.kube/config",
  "echo 'Hello World' > /dev/null",
  "chmod 777 script.sh",
  "chown -R user:group /var/www",
  "ps aux | grep node",
  "whoami",
  "uptime",
  "free -h",
  "df -h",
  "ip addr show",
  "journalctl -u docker -f",
  "sudo rm -rf / --no-preserve-root",
  ":(){ :|:& };:",
];

const CursorCodeEffect: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Generate content once and memoize it
  const codeContent = useMemo(() => {
    let content = "";
    // Generate even more content to be absolutely sure it covers ultra-wide screens
    for (let i = 0; i < 2000; i++) {
      const cmd = DEVOPS_COMMANDS[Math.floor(Math.random() * DEVOPS_COMMANDS.length)];
      const padding = " ".repeat(Math.floor(Math.random() * 5) + 3);
      content += `${cmd}${padding}`;
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
        className="absolute inset-0 text-xl leading-relaxed font-mono text-thinkpad-red opacity-15"
        style={{
          whiteSpace: 'normal',
          wordBreak: 'break-all',
          overflowWrap: 'anywhere',
          maskImage: `radial-gradient(circle 350px at ${mousePos.x}px ${mousePos.y}px, black 20%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(circle 350px at ${mousePos.x}px ${mousePos.y}px, black 20%, transparent 100%)`,
        }}
      >
        {codeContent}
      </div>
    </div>
  );
};

export default CursorCodeEffect;
