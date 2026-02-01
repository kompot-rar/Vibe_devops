import React from 'react';
import { RoadmapItem } from '../types';
import { CheckCircle2, Activity, ShieldCheck, Cpu, Code2, Database } from 'lucide-react';

const ROADMAP_DATA: RoadmapItem[] = [
  {
    id: '1',
    title: 'Linux & Workstation',
    description: 'Kompletne środowisko pracy. Arch Linux, konfiguracja Dotfiles, zarządzanie SSH oraz biegłość w Vim i Bash Scripting.',
    tools: ['Arch Linux', 'Bash', 'SSH', 'Vim'],
    status: 'completed'
  },
  {
    id: '2',
    title: 'Infrastruktura Homelab',
    description: 'W pełni operacyjny klaster Proxmox. Hardware, podstawy sieci (OSI, VLANs) oraz fizyczna budowa serwerowni.',
    tools: ['Proxmox', 'Hardware', 'Networking', 'LXC'],
    status: 'completed'
  },
  {
    id: '3',
    title: 'Teoria Sieci',
    description: 'Fundamenty komunikacji. Model OSI (L2-L7), protokoły TCP/UDP, DNS oraz diagnostyka pakietów (tcpdump/Wireshark).',
    tools: ['OSI', 'TCP/IP', 'DNS', 'Wireshark'],
    status: 'completed'
  },
  {
    id: '4',
    title: 'Automatyzacja & Python',
    description: 'Tworzenie narzędzi w Pythonie (Boto3) i Bashu do automatyzacji zadań administracyjnych oraz monitoringu.',
    tools: ['Python', 'Boto3', 'Scripting', 'Automation'],
    status: 'in-progress'
  },
  {
    id: '5',
    title: 'Infrastructure as Code',
    description: 'Zarządzanie infrastrukturą jako kod. Terraform do provisioningu VM-ek oraz konfiguracja przez Ansible.',
    tools: ['Terraform', 'Ansible', 'IaC', 'Cloud'],
    status: 'in-progress'
  },
  {
    id: '6',
    title: 'Konteneryzacja',
    description: 'Głębokie wejście w Docker i Docker Compose. Budowa wydajnych obrazów i środowisk deweloperskich.',
    tools: ['Docker', 'Compose', 'DevEnv', 'Distroless'],
    status: 'pending'
  },
  {
    id: '7',
    title: 'CI/CD Pipelines',
    description: 'Automatyzacja wdrażania aplikacji. GitLab CI, GitHub Actions oraz konfiguracja runnerów.',
    tools: ['GitLab CI', 'GitHub Actions', 'Pipelines', 'Tests'],
    status: 'pending'
  },
  {
    id: '8',
    title: 'Kubernetes Core',
    description: 'Orkiestracja kontenerów. Instalacja K3s, zarządzanie aplikacjami przez Helm i konfiguracja sieci klastra.',
    tools: ['K3s', 'Helm', 'Ingress', 'K8s'],
    status: 'pending'
  },
  {
    id: '9',
    title: 'Advanced Ops',
    description: 'Poziom ekspercki. GitOps (ArgoCD), zaawansowany monitoring (ELK) i certyfikacja CKA.',
    tools: ['ArgoCD', 'ELK', 'Prometheus', 'CKA'],
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
            
            return (
              <div key={item.id} className={`relative flex flex-col md:flex-row items-center justify-between group ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                
                {/* Timeline Dot */}
                <div className={`
                  absolute left-4 md:left-1/2 w-3 h-3 -translate-x-[5px] md:-translate-x-[5px] rounded-full z-10 transition-all duration-500
                  ${isCompleted ? 'bg-thinkpad-red shadow-[0_0_10px_rgba(224,6,19,0.5)]' : isInProgress ? 'bg-white animate-pulse' : 'bg-neutral-800'}
                `}></div>

                {/* Spacer */}
                <div className="w-full md:w-1/2"></div>

                {/* Content Card */}
                <div className={`w-full md:w-[45%] pl-12 md:pl-0 ${isLeft ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
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
                    
                    <p className="text-neutral-500 text-sm mb-6 font-light leading-relaxed">
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
      </div>
    </div>
  );
};

export default Roadmap;