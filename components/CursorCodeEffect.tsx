import React, { useEffect, useState } from 'react';

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
  "sudo rm -rf / --no-preserve-root", // A little easter egg joke
  ":(){ :|:& };:", // Fork bomb
];

const CursorCodeEffect: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [codeContent, setCodeContent] = useState('');

  useEffect(() => {
    // Generate content only once on mount
    let content = "";
    // Generate a massive block of text to ensure it covers screens of all sizes
    // Using simple concatenation with padding to let it wrap naturally
    for (let i = 0; i < 600; i++) {
        const cmd = DEVOPS_COMMANDS[Math.floor(Math.random() * DEVOPS_COMMANDS.length)];
        // Add random padding between commands
        const padding = " ".repeat(Math.floor(Math.random() * 4) + 2);
        content += `${cmd}${padding}`;
    }
    setCodeContent(content);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden select-none"
      style={{
        zIndex: 0,
      }}
    >
      <div 
        className="w-full h-full text-lg leading-relaxed font-mono text-thinkpad-red break-words opacity-20"
        style={{
            // Use flex wrap or just block with break-words
            whiteSpace: 'normal', 
            maskImage: `radial-gradient(circle 300px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
            WebkitMaskImage: `radial-gradient(circle 300px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
        }}
      >
        {codeContent}
      </div>
    </div>
  );
};

export default CursorCodeEffect;