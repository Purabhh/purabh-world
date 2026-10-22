// Structured resume content — the single source of truth for every landmark.
// Landmark builders read from here, so updating a bullet here updates the world.
import { config } from '../core/constants.js';

export const profile = {
  name: 'Purabh Singh',
  tagline: 'I like to code, build AI agents and infrastructure, make video games and 3D models, and generally just enjoy solving problems.',
  school: 'CS @ Rutgers',
  // longer bio for the tour's welcome card
  about: "I like to code all kinds of things. I got started making video games and 3D models, which I still do today, and these days I also build AI agents and AI infrastructure, with some recent dabbling in complex blockchain systems. I find pretty much all of tech interesting, even outside my niche, and lately I've been getting into low latency systems. FastRust is my newest big project, and with my coursework you can expect more C and Rust stuff soon.",
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
// Write-ups for the Projects district, keyed by GitHub repo name. When a repo
// matches, its kiosk card shows these lines instead of the one-line GitHub blurb.
// `live` adds a "Visit site" link; `house: true` builds that kiosk as a house.
export const projectDetails = {
  "2d-Tutor": {
    lines: [
      "My first attempt at an interactive AI tutor, built with Next.js, TypeScript and Supabase. It's where I started thinking about teaching with a character you walk around with, instead of a chat box.",
      "Now known as Mochee, which replaces it.",
    ],
  },
  Anomalyy: {
    lines: [
      "A school project for CS 210 (Data Management for Data Science). It's a pipeline that scans 10 years of stock price data for AAPL, MSFT, TSLA, AMZN and the S&P 500, and flags unusual trading days using three unsupervised machine learning methods.",
      "Each flag is checked against FOMC meeting dates and GDELT news sentiment. It could be sharper with a paid market data feed, a richer news API, and volatility signals from options prices.",
    ],
  },
  "CHESS-GAME": {
    lines: [
      "Gambit: hands-free 3D chess against a Stockfish bot, inspired by a hatred of the touch-move rule. You play without touching anything.",
      "Say your move (\"knight f3\"), point at the board through your webcam, or use hand gestures: pinch and drag a piece, thumbs up to confirm, open palm to cancel. Every input feeds one move flow, so you can say \"knight\" and point at the square.",
      "Toon pieces that fight on every capture, chess clocks (30, 10 or 5 minutes), takebacks, draw offers, a bot from 400 to 2800 Elo, and a spoken answer to \"what did it play?\".",
      "Vite, three.js, chess.js, Stockfish in a Web Worker, and MediaPipe hand tracking, all in the browser. Multiplayer and an Elo rating system are coming soon.",
    ],
    live: 'https://gambit-amber.vercel.app',
  },
  "REPO-ARCHAEOLOGIST": {
    lines: [
      "A command line tool that scans a git repository for things that have gone stale.",
      "It finds dead functions and classes, files nobody has touched in months or years, dependencies that are installed but never imported, and old branches that were never merged. Each finding gets a decay score from 0 to 100, so the riskiest parts show up first.",
      "It works on Python and JavaScript/TypeScript, and it can export a markdown report.",
    ],
  },
  "polymarket-prophet": {
    lines: [
      "A read-only command line tool that pulls live prediction market prices from Polymarket.",
      "It's still in progress: the model ensemble runs on heuristics until it's trained, and the news and economic data aren't feeding into it yet. Next up are training on resolved markets, adding those data sources, and comparing prices with other prediction markets.",
    ],
  },
  "gesture-whiteboard": {
    lines: [
      "A collaborative whiteboard you draw on with your hand, using just a webcam. Point with your index finger to draw, make a peace sign to erase, open your palm to pan, and make a fist to lift the pen.",
      "Create a room, share the code, and friends can join with video and audio. There's also a sandbox mode for drawing alone, and an infinite canvas. The gesture detection is ported from Chris Alexis's gesture-drone project.",
    ],
  },
  vaultdb: {
    lines: [
      "VaultDB, a native desktop knowledge base. It turns an Obsidian vault into a local vector database that finds connections you never wrote down.",
      "Built in Rust and React on Tauri, so the app is about 10 MB native, versus 150 MB+ for an Electron app. The ingestion pipeline parses markdown, frontmatter, [[wikilinks]], tags and aliases, and chunks notes into roughly 512-token segments. Each chunk is embedded locally with Ollama (nomic-embed-text, 768-dim).",
      "Each vault is stored as its own Qdrant collection, with semantic search over all notes. The graph view combines explicit wiki-links with vector-similarity edges, which surfaces related notes that Obsidian's graph misses.",
      "Fully offline: no cloud, no accounts.",
    ],
  },
  PassportClub: {
    lines: [
      'A shared travel scrapbook for you and your friends. Every trip gets its own chronicle, and every country you visit gets its own page in it.',
      'Each person can keep a personal scrapbook that holds every country they have been to. You invite friends in with a link, and they pick a name and join with no signup.',
      'Everyone in the group posts photos and videos from their trips, so the scrapbook fills up as the crew travels.',
      'Started as a small project inspired by a group trip to Colombia with friends, built to keep those memories in one place.',
    ],
    // live: 'http://137.184.65.14/', // droplet down; card falls back to the Vercel homepage
  },
  Mochee: {
    lines: [
      '3D AI study buddy built at HackRU Fall 2026. Upload your lecture notes and an animated 3D tutor teaches them back to you: he walks, points at the notes and whiteboard, narrates in a real voice, and runs a quick check at the end.',
      'Document Q&A with Gemini where every answer cites the exact page it came from, and says so when the notes do not cover the question.',
      'React 19 + TypeScript with react-three-fiber, Rapier physics, and a zustand-driven state machine controlling a Blender-rigged character with 58 animations.',
      'ElevenLabs voice that starts playing as audio streams in, with server-side caching and a daily cost cap.',
      'Study and Play modes with coins, a shop, and a boss battle for each topic.',
    ],
    live: 'https://138-197-85-46.sslip.io/',
  },
  FastRust: {
    lines: [
      'Open-source Rust web framework built from scratch on Hyper and Tokio, pairing FastAPI-style ergonomics with Rust performance.',
      'Custom trie router with typed extractors (Path, Query, JSON, State) and macro-based routing across 7 HTTP methods.',
      'Middleware stack (CORS, bearer auth, logging), OpenAPI 3.1 generation, and live Swagger UI.',
      'Benchmarked with Criterion: 172 ns static and 849 ns parameterized route lookups, 1.4–2.4 µs request dispatch.',
    ],
  },
  internpilot: {
    house: true,
    lines: [
      'Local-first job application tracker I built for my own search.',
      'Pulls new intern and new-grad postings from public GitHub aggregator repos and filters them to my niche (fintech, banks, payments, trading).',
      'Polls Gmail on a schedule and classifies replies with rules + Claude Haiku, automatically moving tracker cards from applied to interview to offer or rejection.',
      'Next.js 15, TypeScript, SQLite + Drizzle, node-cron, Zod, Vitest.',
    ],
  },
  stormlink: {
    lines: [
      'Multi-agent AI disaster-response app built at HackUSF 2026.',
      'Google ADK orchestrator routes natural-language questions to Data Monitor and Resource Matcher agents that pull live NOAA weather alerts and nearby shelters, hospitals, and food banks.',
      'Next.js 16 + React 19 frontend with a Leaflet map, 5–250 mile radius search, and a live panel visualizing each agent handoff.',
      'Voice-accessible answers through ElevenLabs text-to-speech.',
    ],
  },
  LeaseLink: {
    lines: [
      'Built a full-stack Tinder-style housing marketplace connecting renters and landlords through mutual interest.',
      'Full-stack React + Tailwind, Express.js, PostgreSQL, and Google OAuth.',
      'Led backend development of a gated real-time chat (WebSockets) and landlord approval workflows.',
    ],
  },
};

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
    name: 'PassportClub',
    description: 'A shared travel scrapbook for you and your friends: anyone with the invite link joins, posts photos and videos to each country, and sees what everyone shared. No passwords or signups. A boarding-pass landing, a stamp page for every country, and a shared passport that fills up as the crew travels.',
    language: 'HTML', stars: 0, url: 'https://github.com/Purabhh/PassportClub', homepage: 'https://passport-bros.vercel.app', updated: '2026-06-28',
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
    name: 'CHESS-GAME',
    description: 'Gambit: hands-free 3D chess vs Stockfish with voice, webcam pointing and hand gestures. Multiplayer and Elo coming soon.',
    language: 'JavaScript', stars: 0, url: 'https://github.com/Purabhh/CHESS-GAME', homepage: 'https://gambit-amber.vercel.app', updated: '2026-10-20',
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
