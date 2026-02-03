import React, { useState, useEffect, useRef } from 'react';
import { RoadmapItem } from '../types';
import { Check, Activity, ShieldCheck, Cpu, Code2, Database } from 'lucide-react';

const ROADMAP_DATA: RoadmapItem[] = [
  {
    id: '1',
    title: 'Linux & Workstation',
    description: 'Inżynieria środowiska pracy. Arch Linux, zarządzanie konfiguracją (Dotfiles), bezpieczne SSH oraz biegłość w Vim.',
    tools: ['Arch Linux', 'Bash', 'SSH', 'Vim'],
    status: 'completed'
  },
  {
    id: '2',
    title: 'Infrastruktura Homelab',
    description: 'W pełni operacyjny klaster Proxmox. Hardware server-grade, wirtualizacja (LXC/KVM) i zarządzanie storage-em.',
    tools: ['Proxmox', 'ZFS', 'Hardware', 'LXC'],
    status: 'completed'
  },
  {
    id: '13',
    title: 'Linux Internals & Debugging',
    description: 'Diagnostyka głęboka. Analiza syscalli, rozwiązywanie problemów z pamięcią (OOM), I/O oraz debugging sieciowy.',
    tools: ['strace', 'tcpdump', 'journalctl', 'sysctl'],
    status: 'completed'
  },
  {
    id: '3',
    title: 'Sieci',
    description: 'Architektura sieciowa. Model OSI, segmentacja (VLAN), routing, DNS oraz głęboka analiza pakietów (Wireshark).',
    tools: ['OSI', 'VLAN', 'DNS', 'Wireshark'],
    status: 'completed'
  },
  {
    id: '5',
    title: 'Infrastructure as Code',
    description: 'Zarządzanie infrastrukturą jako kod. Terraform do provisioningu VM-ek oraz konfiguracja przez Ansible.',
    tools: ['Terraform', 'Ansible', 'IaC', 'Cloud'],
    status: 'completed'
  },
  {
    id: '7',
    title: 'CI/CD Pipelines',
    description: 'Automatyzacja wdrażania aplikacji. GitLab CI, GitHub Actions oraz konfiguracja własnych runnerów.',
    tools: ['GitLab CI', 'GitHub Actions', 'Pipelines', 'Tests'],
    status: 'completed'
  },
  {
    id: '4',
    title: 'Automatyzacja & Python',
    description: 'Programowanie infrastruktury. Skrypty w Pythonie, automatyzacja zadań (Bash) i interakcja z API.',
    tools: ['Python', 'Boto3', 'API', 'Automation'],
    status: 'in-progress'
  },
  {
    id: '6',
    title: 'Konteneryzacja',
    description: 'Inżynieria obrazów. Tworzenie bezpiecznych i lekkich kontenerów (Multi-stage), zarządzanie rejestrami i budowanie wewnątrz klastra.',
    tools: ['Docker', 'Kaniko', 'BuildKit', 'Distroless'],
    status: 'in-progress'
  },
  {
    id: '8',
    title: 'Kubernetes Core',
    description: 'Orkiestracja kontenerów. Instalacja K3s, zarządzanie i konfiguracja sieci klastra.',
    tools: ['K3s', 'Helm', 'Ingress', 'K8s'],
    status: 'pending'
  },
  {
    id: '14',
    title: 'DatabaseOps & Storage',
    description: 'Utrzymanie aplikacji stanowych. Klastry HA baz danych (Postgres), strategie Backup & Restore (PITR) i replikacja.',
    tools: ['PostgreSQL', 'Redis', 'MinIO', 'pgBackRest'],
    status: 'pending'
  },
  {
    id: '11',
    title: 'SRE & Observability',
    description: 'Pełna obserwowalność. Monitoring (Prometheus/Grafana), logi (ELK), Distributed Tracing i kultura SRE.',
    tools: ['Prometheus', 'Grafana', 'ELK', 'OpenTelemetry'],
    status: 'pending'
  },
  {
    id: '15',
    title: 'Hybrid Cloud & AWS',
    description: 'Wyjście poza Homelab. Budowa hybrydowej infrastruktury, VPN do chmury, backupy off-site na S3 oraz zarządzanie tożsamością (IAM).',
    tools: ['AWS', 'S3', 'IAM', 'WireGuard'],
    status: 'pending'
  },
  {
    id: '9',
    title: 'Certyfikacja CKA',
    description: 'Administracja zaawansowana. GitOps (ArgoCD), zarządzanie cyklem życia klastra, RBAC i certyfikacja CKA.',
    tools: ['ArgoCD', 'RBAC', 'Etcd', 'CKA'],
    status: 'pending'
  },
  {
    id: '10',
    title: 'DevSecOps',
    description: 'Bezpieczeństwo jako kod. Skanowanie podatności, zarządzanie sekretami (Vault) oraz compliance (OPA/Kyverno).',
    tools: ['Vault', 'Trivy', 'OPA', 'Snyk'],
    status: 'pending'
  },
  {
    id: '12',
    title: 'Platform Engineering',
    description: 'Budowa wewnętrznych platform deweloperskich (IDP). Backstage, samoobsługa dla devów i automatyzacja cyklu życia infrastruktury.',
    tools: ['Backstage', 'Crossplane', 'Pulumi', 'IDP'],
    status: 'pending'
  }
];

const Roadmap: React.FC = () => {
  const [displayText, setDisplayText] = useState('');
  const [startTyping, setStartTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStartTyping(true);
      }
    }, { threshold: 0.1 });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!startTyping) return;

    let currentIndex = 0;
    let isDeleting = false;
    let timeoutId: NodeJS.Timeout;

    const type = () => {
      const fullText = "NEVER STOP LEARNING";
      
      if (!isDeleting && currentIndex <= fullText.length) {
        setDisplayText(fullText.substring(0, currentIndex));
        currentIndex++;
        timeoutId = setTimeout(type, 100);
      } else if (isDeleting && currentIndex >= 0) {
        setDisplayText(fullText.substring(0, currentIndex));
        currentIndex--;
        timeoutId = setTimeout(type, 50);
      } else if (currentIndex > fullText.length) {
        isDeleting = true;
        currentIndex = fullText.length; // Pause at end
        timeoutId = setTimeout(type, 3000);
      } else if (currentIndex < 0) {
        isDeleting = false;
        currentIndex = 0;
        timeoutId = setTimeout(type, 1000);
      }
    };

    timeoutId = setTimeout(type, 500);
    return () => clearTimeout(timeoutId);
  }, [startTyping]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-20">
        <h2 className="text-4xl font-bold text-white mb-6 font-mono tracking-tighter">
          <span className="text-thinkpad-red">/</span> Roadmap
        </h2>
        <p className="text-neutral-400 max-w-2xl mx-auto font-mono text-sm leading-relaxed">
          Praktyczna ścieżka rozwoju. Zero teorii, 100% wdrażania na produkcję.
        </p>
      </div>

      <div className="relative">
        {/* Central Line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-thinkpad-red via-neutral-800 to-transparent md:-translate-x-1/2"></div>

        <div className="space-y-16">
          {ROADMAP_DATA.map((item, index) => {
            const isLeft = index % 2 === 0;
            const isCompleted = item.status === 'completed';
            const isInProgress = item.status === 'in-progress';
            const isLast = index === ROADMAP_DATA.length - 1;
            const isSecondToLast = index === ROADMAP_DATA.length - 2;
            
            return (
              <div key={item.id} className={`relative flex flex-col md:flex-row items-center justify-between group ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                
                {/* Timeline Dot */}
                <div className={`
                  absolute left-4 md:left-1/2 w-3 h-3 -translate-x-[5px] md:-translate-x-[5px] rounded-full z-10 transition-all duration-500
                  ${isCompleted ? 'bg-thinkpad-red shadow-[0_0_10px_rgba(224,6,19,0.5)]' : isInProgress ? 'bg-white animate-pulse' : 'bg-neutral-800'}
                  ${isLast || isSecondToLast ? 'bg-neutral-800/50' : ''}
                `}></div>

                {/* Spacer */}
                <div className="w-full md:w-1/2"></div>

                {/* Content Card */}
                <div className={`w-full md:w-[45%] pl-12 md:pl-0 ${isLeft ? 'md:pr-12 md:text-right' : 'md:pl-12'}
                  ${isLast ? 'opacity-30 blur-[2px] grayscale hover:opacity-100 hover:blur-0 hover:grayscale-0 transition-all duration-700' : ''}
                  ${isSecondToLast ? 'opacity-60 blur-[1px] hover:opacity-100 hover:blur-0 transition-all duration-500' : ''}
                `}>
                  <div className={`
                    relative p-6 bg-neutral-900/40 border-y border-neutral-900 transition-all duration-300 rounded-sm group-hover:bg-neutral-900/80
                    ${isCompleted ? 'border-l-2 border-l-thinkpad-red md:border-l-thinkpad-red md:border-r-0' : 'border-l-2 border-l-neutral-800'}
                    ${isLeft && isCompleted ? 'md:border-l-0 md:border-r-2 md:border-r-thinkpad-red' : ''}
                    ${isInProgress ? 'border-l-2 border-l-white md:border-l-white md:border-r-0' : ''}
                    ${isLeft && isInProgress ? 'md:border-l-0 md:border-r-2 md:border-r-white' : ''}
                  `}>
                    <div className={`flex items-center gap-3 mb-3 ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                      <h3 className={`text-lg font-bold font-mono tracking-tight uppercase ${isCompleted ? 'text-white' : 'text-neutral-500'}`}>
                        {item.title}
                      </h3>
                      {isCompleted && (
                        <div className="relative flex items-center justify-center w-8 h-8">
                          <div className="absolute inset-0 bg-thinkpad-red/20 blur-[8px] rounded-full"></div>
                          <Check size={22} className="text-thinkpad-red relative z-10" strokeWidth={4} />
                        </div>
                      )}
                      {isInProgress && <Activity size={24} className="text-white animate-pulse stroke-[3px] drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]" />}
                    </div>
                    
                    <p className="text-neutral-400 text-sm mb-6 font-light leading-relaxed">
                      {item.description}
                    </p>

                    <div className={`flex flex-wrap gap-2 ${isLeft ? 'md:justify-end' : ''}`}>

                      {item.tools.map(tool => (
                        <span key={tool} className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 bg-black border border-neutral-800 text-neutral-500 rounded-sm hover:text-white hover:border-neutral-600 transition-colors cursor-default">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Terminal Text Animation */}
        <div ref={containerRef} className="relative flex flex-col items-center justify-center mt-20 pb-12 h-12">
            <div className="flex items-center gap-2 font-mono text-sm tracking-widest text-neutral-500">
                <span className="text-thinkpad-red font-bold">$</span>
                <span className="uppercase">{displayText}</span>
                <span className="w-2 h-4 bg-thinkpad-red animate-pulse"></span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Roadmap;