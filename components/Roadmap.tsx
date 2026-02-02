import React from 'react';
import { RoadmapItem } from '../types';
import { CheckCircle2, Activity, ShieldCheck, Cpu, Code2, Database } from 'lucide-react';

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
    description: 'W pełni operacyjny klaster Proxmox. Hardware server-grade, wirtualizacja (LXC/KVM) i zarządzanie storage-em (ZFS).',
    tools: ['Proxmox', 'ZFS', 'Hardware', 'LXC'],
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
    description: 'Programowanie infrastruktury. Skrypty w Pythonie (Boto3), automatyzacja zadań (Bash) i interakcja z API.',
    tools: ['Python', 'Boto3', 'API', 'Automation'],
    status: 'in-progress'
  },
  {
    id: '6',
    title: 'Konteneryzacja',
    description: 'Standard OCI. Budowa zoptymalizowanych obrazów (Multi-stage), Docker Compose i bezpieczeństwo kontenerów.',
    tools: ['Docker', 'Compose', 'DevEnv', 'Distroless'],
    status: 'in-progress'
  },
  {
    id: '8',
    title: 'Kubernetes Core',
    description: 'Orkiestracja kontenerów. Instalacja K3s, zarządzanie aplikacjami przez Helm i konfiguracja sieci klastra.',
    tools: ['K3s', 'Helm', 'Ingress', 'K8s'],
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
                      {isCompleted && <CheckCircle2 size={24} className="text-thinkpad-red drop-shadow-[0_0_8px_rgba(224,6,19,0.5)]" />}
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

        {/* Never Stop Learning Badge */}
        <div className="relative flex justify-center mt-24 pb-12">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-24 bg-thinkpad-red/5 blur-[40px] rounded-full pointer-events-none"></div>
          <div className="relative z-10 px-6 py-2 bg-black border border-neutral-800 rounded-full">
            <span className="font-mono text-xs tracking-[0.3em] text-neutral-600 uppercase bg-clip-text text-transparent bg-gradient-to-r from-neutral-600 via-neutral-400 to-neutral-600 animate-pulse">
              Never Stop Learning
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roadmap;