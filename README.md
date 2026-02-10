<div align="center">
<img src="public/DEMO.png" alt="demo" width="800">

# DevOps from ZERO to HERO journey

![Status Active](https://img.shields.io/badge/Status-Active-success?style=flat-square)
![Linux](https://img.shields.io/badge/OS-Linux-FCC624?style=flat-square&logo=linux&logoColor=black)
![AI Assisted](https://img.shields.io/badge/Workflow-AI_Assisted-8A2BE2?style=flat-square)
![Infrastructure First](https://img.shields.io/badge/Infrastructure-Hardened-00C853?style=flat-square)

[**LIVE DEMO: devops.mrozy.org**](https://devops.mrozy.org) &nbsp;&nbsp;&nbsp; [**DEV PREVIEW: dev-devops.mrozy.org**](https://dev-devops.mrozy.org/)

</div>

---

## Project Overview
This repository serves as a **Proof of Work** and a living documentation of my journey towards becoming a Junior DevOps Engineer. It is not just a blog application; it is a fully functional platform running entirely on my personal **Homelab**, demonstrating practical skills in systems administration, network security, and automated deployment.

The goal is to bridge the gap between theoretical knowledge and production-grade implementation, following a structured DevOps roadmap.

## Engineering Philosophy

### Infrastructure as Code & GitOps
Every component of this system is treated as code. The project emphasizes reproducibility and stability over manual configuration. The infrastructure is running on a **3-node K3s Kubernetes cluster**, managed via **ArgoCD** for full GitOps implementation.

> **Note:** The full Infrastructure as Code (Ansible, Terraform, Kubernetes manifests) documentation and source code is maintained in a separate repository to ensure separation of concerns.

### The "Vibe Coding" Protocol
While the core infrastructure is built with rigorous DevOps standards, the frontend application follows an **AI-Assisted Development methodology**. Originally initiated as a static AI Studio template for a simple landing page, the project has been extensively transformed and engineered by me into a **full-featured blog engine**.

Key enhancements include:
*   **AI Studio Debloat:** Complete removal of legacy AI templates, chat widgets, and unused API keys to minimize attack surface and codebase size.
*   **Dynamic Routing:** Full support for clean slug-based URLs.
*   **Markdown Core:** Automated processing of Markdown-based blog posts.
*   **Open Graph Automation:** Automated build-time generation of dynamic social preview images and metadata injection for enhanced social sharing.
*   **Custom Infrastructure Integration:** Re-engineered for automated deployment and hosting.

This strategic choice allows for:
1.  **Rapid Prototyping:** Drastically minimizing time-to-market for visual components.
2.  **Resource Allocation:** Shifting engineering focus from UI boilerplate to critical backend architecture, CI/CD pipelines, and security hardening.

## Technical Architecture

### Core Components
*   **Infrastructure:** Private Homelab cluster.
*   **Virtualization:** Proxmox VE Cluster.
*   **Containerization & Orchestration:** **K3s Kubernetes Cluster** (3 nodes) with **ArgoCD**.
*   **Networking:** Zero Trust architecture using Cloudflare Tunnels; no exposed inbound ports.
*   **Storage:** Network File System (NFS) for shared persistent storage across nodes.

### CI/CD Strategy
The deployment pipeline is designed to simulate enterprise environments:
*   **Source Control:** Git-based workflow with feature branching strategies.
*   **Automation:** Integrated pipelines for build, test, and deployment phases.
*   **Monitoring:** Real-time observability of application health and system metrics.