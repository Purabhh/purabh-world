// Structured resume content — the single source of truth for every landmark.
// Landmark builders read from here, so updating a bullet here updates the world.
import { config } from '../core/constants.js';

export const profile = {
  name: 'Purabh Singh',
  tagline: 'I build fintech, blockchain & AI',
  school: 'CS @ Rutgers',
  location: 'New Brunswick, NJ',
  email: 'purabhsingh123@gmail.com',
  github: 'https://github.com/Purabhh',
  linkedin: config.LINKEDIN_URL || 'https://www.linkedin.com',
  resume: config.RESUME_FILE,
};

export const education = {
  school: 'Rutgers University',
  degree: 'B.S. Computer Science, Minor in Data Science',
  dates: 'Aug 2023 – May 2027',
  location: 'New Brunswick, NJ',
  honors: ["Dean's List", 'Coursework: Data Structures, Algorithms, Computer Architecture, Discrete Structures I & II, AI, Databases'],
};

// Each entry maps to one landmark in the world. Bullets mirror the Oct 2026
// resume (Resume.pdf in the project root) one-to-one; edit both together.
export const experience = [
  {
    id: 'bny', org: 'BNY', role: 'Software Engineering Intern',
    dates: 'June 2026 – Aug 2026', location: 'Pittsburgh, PA', accent: 'bny',
    bullets: [
      "Built an immutable fintech payments audit trail on a private Hyperledger Besu blockchain (Solidity, Web3j), validating and recording $2B+ in cleared debits and credits for real-time reconciliation across 3 fragmented systems with zero payment-latency impact, tested end-to-end using Apache ActiveMQ Artemis to simulate live message-queue traffic, fronted by an Angular/ethers.js UI that reads directly from Besu for live ledger visibility during backend downtime.",
      "Developed a real-time SWIFT MT/MX \"blotter\" dashboard for an Agile payments team, tracing every message as it moved through the platform's Java/Spring Boot systems, delivering first-ever end-to-end visibility into message flow across 15M+ daily messages.",
      "Built an Angular observability and troubleshooting dashboard for cross-functional ops teams, pulling from Splunk logs to monitor the health and security posture of all 11 payment-platform systems, surfacing per-system vulnerability counts and month-over-month trends and auto-generating Jira tickets from flagged issues to cut manual triage time by 60%.",
    ],
    tags: ['Java', 'Spring Boot', 'Hyperledger Besu', 'Solidity', 'Web3j', 'ActiveMQ Artemis', 'Angular', 'ethers.js', 'Splunk', 'SWIFT'],
  },
  {
    id: 'essex', org: 'Essex Securities', role: 'Software Engineering Intern',
    dates: 'May 2025 – Aug 2025', location: 'Jersey City, NJ', accent: 'essex',
    bullets: [
      "Built an AI agent using LangChain and RAG (pgvector semantic search, FastAPI endpoints) to automate extraction and comparison of actual vs estimated EPS from quarterly earnings reports, cutting manual review time by over 70%.",
      "Built an MVP BTC-USD spot exchange in Python (FastAPI, asyncio, PostgreSQL) with a price-time-priority matching engine supporting limit/market orders, partial fills, self-trade prevention, and sequenced WebSocket market data.",
      "Designed an append-only double-entry ledger with atomic per-trade settlement, pre-trade risk holds, and crash recovery that rebuilds the order book, with automated invariant checks proving every balance reconciles.",
      "Automated limit order execution via Bloomberg EMSX API integration, reducing manual entry time by 20%.",
    ],
    tags: ['LangChain', 'RAG', 'pgvector', 'FastAPI', 'PostgreSQL', 'asyncio', 'WebSockets', 'Bloomberg EMSX'],
  },
  {
    id: 'azonix', org: 'Azonix Tech', role: 'Software Engineering Intern',
    dates: 'May 2024 – Aug 2024', location: 'Remote', accent: 'azonix',
    bullets: [
      "Built a real-time facial-recognition pipeline on a live 30 FPS edge video feed, using OpenCV and an ONNX-optimized InsightFace embedding model to detect and identify enrolled individuals in under 45 ms per frame at 96%+ accuracy.",
      "Engineered an IoT telemetry platform ingesting 5,000+ MQTT messages/sec from 500 concurrent sensor devices, persisting time-series data to TimescaleDB for sub-second querying and streaming anomaly detection.",
      "Trained an ML (XGBoost) predictive-maintenance model on 100K+ rows of device telemetry to forecast equipment failures roughly 6 hours in advance, reaching 0.92 AUC and cutting projected unplanned downtime by 40%.",
    ],
    tags: ['OpenCV', 'ONNX', 'InsightFace', 'MQTT', 'TimescaleDB', 'XGBoost'],
  },
];

export const achievements = [
  { title: 'MusaLabs Hackathon, Winner', detail: '1st of 50+ teams, sponsored by Microsoft Azure.' },
  { title: "Dean's List", detail: 'Spring 2025.' },
];

// Featured projects shown in the Projects district. Curated from github.com/Purabhh
// (descriptions distilled from each repo's README; stars/dates from the GitHub API,
// last synced 2026-09-11). Order = kiosk order; the tour card lists the first 5.
// LeaseLink + FastRust are the projects on the main resume; VaultDB + Anomalyy are
// the two on the alternate (data-science) variant.
export const projectsFallback = [
  {
    name: 'LeaseLink',
    description: "Built a full-stack Tinder-style housing marketplace connecting renters and landlords through mutual interest, with a React + Tailwind frontend, Express.js backend, PostgreSQL database, and Google OAuth authentication. Led backend development of a gated real-time chat system via WebSockets and implemented landlord approval workflows, streamlining property discovery and communication.",
    language: 'TypeScript', stars: 1, url: 'https://github.com/Purabhh/LeaseLink', homepage: 'https://www.leaselink.pro/', color: '#ffd34e', metallic: true, updated: '2025-08-21',
  },
  {
    name: 'FastRust',
    description: "Created an open source, from-scratch Rust web framework on Hyper and Tokio that pairs FastAPI-style ergonomics with Rust-native performance, featuring a custom trie data structure for routing with static-over-parameter precedence, typed extractors (Path, Query, JSON, State), and macro-based routing across 7 HTTP methods. Layered on an onion-style middleware stack (CORS, bearer auth, logging) with OpenAPI 3.1 generation and a live Swagger UI, benchmarked with Criterion at sub-microsecond trie-router lookups (172 ns static, 849 ns parameterized) and 1.4 to 2.3 µs request dispatch.",
    language: 'Rust', stars: 3, url: 'https://github.com/Purabhh/FastRust', homepage: '', updated: '2026-06-29',
  },
  {
    name: 'VaultDB',
    description: "Built a desktop app (Tauri, Rust + React/TypeScript) that turns an Obsidian markdown vault into a locally-searchable vector database, generating embeddings with Ollama and indexing them in Qdrant entirely on-device. Designed a dual-layer semantic graph visualizer (react-force-graph-2d, d3-force) that blends explicit wiki-links with vector-similarity edges, surfacing note connections Obsidian itself can't show.",
    language: 'TypeScript', stars: 0, url: 'https://github.com/Purabhh/vaultdb', homepage: '', updated: '2026-04-16',
  },
  {
    name: 'Anomalyy',
    description: "Built an unsupervised anomaly-detection pipeline that flags unusual trading days across major stocks using Z-Score, Isolation Forest, and Local Outlier Factor in consensus, engineered from 40+ technical indicators. Classified detected anomalies by likely cause (macro events, sector contagion, sentiment spikes) by cross-referencing FOMC dates and GDELT news-sentiment data pulled via Google BigQuery.",
    language: 'Python', stars: 0, url: 'https://github.com/Purabhh/Anomalyy', homepage: '', updated: '2026-05-08',
  },
  {
    name: 'CoolFinder',
    description: 'Find air-conditioned places across Europe during heat waves: an interactive Leaflet map of cafes, restaurants, hotels, and shops with confirmed / possible / unconfirmed AC status, live search and type filters, a heat-warning banner, geolocation, and user ratings. React 19 + Vite, Tailwind v4, Node/Express API.',
    language: 'JavaScript', stars: 0, url: 'https://github.com/Purabhh/coolfinder', homepage: 'https://coolfinder.vercel.app', updated: '2026-07-02',
  },
  {
    name: 'PassportBros',
    description: 'A shared travel scrapbook for you and your friends: anyone with the invite link joins, posts photos and videos to each country, and sees what everyone shared. No passwords or signups. Postgres, Cloudflare R2 for media, with a boarding-pass landing.',
    language: 'HTML', stars: 0, url: 'https://github.com/Purabhh/PassportBros', homepage: 'https://passport-bros.vercel.app', updated: '2026-06-28',
  },
  {
    name: 'GestureBoard',
    description: 'A collaborative whiteboard you draw on with your fingers and a webcam: MediaPipe hand tracking with a Kalman-smoothed fingertip, gestures for draw / erase / pan / undo / color, an infinite canvas, multiple boards per room, and peer-to-peer WebRTC video and audio. Rooms are ephemeral and wiped when everyone leaves.',
    language: 'JavaScript', stars: 0, url: 'https://github.com/Purabhh/gesture-whiteboard', homepage: '', updated: '2026-04-08',
  },
  {
    name: 'StockVizzy',
    description: 'A stock chart visualizer built for AI agents and automation tools: pulls live Yahoo Finance data for any ticker (stocks, ETFs, crypto, forex, indices) and renders dark-themed price + volume charts via CLI, interactive prompts, or a Python import. Headless PNG export and structured JSON to stdout for agent parsing.',
    language: 'Python', stars: 0, url: 'https://github.com/Purabhh/stockvizzy', homepage: '', updated: '2026-04-04',
  },
  {
    name: 'Repo Archaeologist',
    description: 'A pip-installable Python CLI that scans git repositories for dead code, stale files, unused dependencies, and abandoned branches, then scores the risk and writes a markdown report.',
    language: 'Python', stars: 0, url: 'https://github.com/Purabhh/REPO-ARCHAEOLOGIST', homepage: '', updated: '2026-03-11',
  },
  {
    name: 'Chess Game',
    description: 'A browser chess game with voice-to-speech controls. Work in progress, actively building it out.',
    language: 'HTML', stars: 0, url: 'https://github.com/Purabhh/CHESS-GAME', homepage: '', updated: '2025-07-07',
  },
  // Kept last on purpose so it lands at the back of the Projects grid.
  {
    name: 'Adventure Catalyst',
    description: 'A custom Minecraft modpack built and balanced in Java: new mechanics, rebalanced maps, new block types, and creative elements that enhance the player experience.',
    language: 'Java', stars: 0, url: 'https://adventurecatalyst.net/', homepage: '',
  },
];

export const skills = {
  Languages: ['Python', 'Java', 'TypeScript', 'JavaScript', 'SQL', 'C++', 'C', 'C#', 'Go', 'Ruby', 'Rust'],
  Frontend: ['React', 'Angular', 'Next.js', 'Swift'],
  Backend: ['Node.js', 'Express', 'NestJS', 'Spring Boot', 'FastAPI', 'LangChain', 'Pandas', 'Kafka', 'RabbitMQ', 'ActiveMQ Artemis'],
  'DevOps / Cloud': ['AWS', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Splunk', 'Datadog'],
  Blockchain: ['Solidity', 'Hyperledger Besu', 'Web3j', 'ethers.js', 'Web3.js'],
  Database: ['PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'DynamoDB', 'Elasticsearch', 'Oracle', 'Qdrant', 'TimescaleDB'],
};
