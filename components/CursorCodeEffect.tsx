import React, { useEffect, useState, useMemo } from 'react';

const DEVOPS_TOKENS = [
  "sudo", "rm -rf /", "docker run", "kubectl apply", "terraform init", "git push --force", 
  "rollback", "segmentation_fault", "kernel_panic", "OOMKilled", "CrashLoopBackOff", 
  "ImagePullBackOff", "NetworkPolicy", "Ingress", "Egress", "0x7F", "SIGKILL", 
  "SIGTERM", "chmod 777", "chown root:root", "systemctl restart", "journalctl -xe", 
  "grep -r", "awk", "sed", "pipefail", "set -e", "#!/bin/bash", "python3", "node", 
  "npm install", "yarn build", "cargo build --release", "make install", "apt-get update", 
  "yum install", "apk add", "dnf install", "pacman -Syu", "emerge", "zypper", 
  "brew install", "cgroup", "namespace", "overlay2", "btrfs", "zfs", "raid0", 
  "raid1", "raid5", "raid10", "lvm", "ext4", "xfs", "ntfs", "fat32", "swap", 
  "pagefile", "virtual_memory", "heap_dump", "stack_trace", "core_dump", "buffer_overflow", 
  "sql_injection", "xss", "csrf", "ddos", "mitm", "phishing", "ransomware", "trojan", 
  "worm", "virus", "spyware", "adware", "rootkit", "bootloader", "bios", "uefi", 
  "secure_boot", "tpm", "luks", "aes-256", "rsa-4096", "sha-512", "bcrypt", "argon2", 
  "pbkdf2", "hmac", "jwt", "oauth2", "openid", "saml", "ldap", "kerberos", "radius", 
  "tacacs+", "ssh-keygen", "authorized_keys", "known_hosts", "id_rsa", "pem", "crt", 
  "csr", "ca", "pki", "x509", "tls1.3", "ssl", "tcp", "udp", "icmp", "arp", "dhcp", 
  "dns", "http", "https", "ftp", "sftp", "smtp", "imap", "pop3", "snmp", "ntp", 
  "bgp", "ospf", "rip", "eigrp", "mpls", "vlan", "vxlan", "gre", "ipsec", "vpn", 
  "wireguard", "openvpn", "tor", "i2p", "freenet", "ipfs", "bittorrent", "magnet", 
  "dht", "gossip", "paxos", "raft", "byzantine", "blockchain", "bitcoin", "ethereum", 
  "smart_contract", "solidity", "web3", "metaverse", "nft", "dao", "defi", "cex", 
  "dex", "amm", "yield_farming", "staking", "mining", "proof_of_work", "proof_of_stake"
];

const CursorCodeEffect: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const codeContent = useMemo(() => {
    let content = "";
    const totalTokens = 3000; // Enough to fill a 4k screen with dense text
    
    for (let i = 0; i < totalTokens; i++) {
      // Easter eggs inserted at specific indices
      if (i === 404) {
        content += " ERROR_404_BRAIN_NOT_FOUND ";
        continue;
      }
      if (i === 1337) {
        content += " 0xCAFEBABE_KOMPOT_WAS_HERE_0xDEADBEEF ";
        continue;
      }
      
      const token = DEVOPS_TOKENS[Math.floor(Math.random() * DEVOPS_TOKENS.length)];
      
      // Randomly decide format: plain, with brackets, function call, or hex
      const format = Math.random();
      if (format > 0.9) content += `0x${Math.floor(Math.random()*16777215).toString(16).toUpperCase()} `;
      else if (format > 0.8) content += `${token}(); `;
      else if (format > 0.7) content += `<${token}> `;
      else if (format > 0.6) content += `[${token}] `;
      else content += `${token} `;
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
        className="absolute inset-0 text-[10px] leading-tight font-mono text-thinkpad-red opacity-10 break-all"
        style={{
          maskImage: `radial-gradient(circle 300px at ${mousePos.x}px ${mousePos.y}px, black 40%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(circle 300px at ${mousePos.x}px ${mousePos.y}px, black 40%, transparent 100%)`,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace" 
        }}
      >
        {codeContent}
      </div>
    </div>
  );
};

export default CursorCodeEffect;
