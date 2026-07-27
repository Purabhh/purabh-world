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
  honors: ["Dean's List"],
};

// Each entry maps to one landmark in the world.
export const experience = [
  {
    id: 'bny', org: 'BNY', role: 'Software Engineering Intern',
    dates: 'Summer 2026', location: 'Pittsburgh, PA', accent: 'bny',
    bullets: [
      "Member of BNY's mission-critical funds-control engine team, a Java 21 / Spring Boot 3.5 platform processing billions in daily payment volume across 5 concurrent JVM lanes; a single minute of downtime carries an estimated $3.2B exposure.",
      "Built an immutable audit trail using Hyperledger Besu, Solidity smart contracts, and Web3j, writing every cleared debit and credit to a private, permissioned blockchain, enabling real-time reconciliation across 3 fragmented systems with zero impact to payment latency.",
      "Developed an Angular front-end powered by ethers.js that reads directly from the Besu network, cutting network hops from 2 to 1 and delivering live balance and ledger visibility even during backend downtime.",
    ],
    tags: ['Java 21', 'Spring Boot', 'Hyperledger Besu', 'Solidity', 'Web3j', 'Angular', 'ethers.js'],
  },
  {
    id: 'essex2', org: 'Essex Securities', role: 'Software Engineering Intern',
    dates: 'May 2025 – Aug 2025', location: 'Jersey City, NJ', accent: 'essex',
    bullets: [
      "Designed a LangChain-powered AI tool that automates extraction and comparison of actual vs estimated EPS from quarterly earnings reports, cutting manual review time by over 70%. Built a retrieval-augmented generation pipeline with LLMs, pgvector semantic search, and FastAPI endpoints.",
      "Built an MVP crypto exchange entirely in Python (FastAPI, PostgreSQL, asyncio): an in-memory matching engine, REST/WebSocket APIs, and a double-entry ledger with risk controls, basic KYC, and automated trade settlement in a unified backend service.",
    ],
    tags: ['LangChain', 'RAG', 'pgvector', 'FastAPI', 'PostgreSQL', 'asyncio', 'WebSockets'],
  },
  {
    id: 'essex1', org: 'Essex Securities', role: 'Software Engineering Intern',
    dates: 'Jul 2024 – Oct 2024', location: 'Jersey City, NJ', accent: 'essex',
    bullets: [
      "Automated limit-order execution through Bloomberg EMSX API integration, streamlining workflows and reducing manual entry time by 20%.",
      "Revamped the brokerage portal with a modern UI and faster navigation; built a job board (Dropbox + Google Forms) with a dynamic, filterable front-end and embedded JD previews.",
    ],
    tags: ['Bloomberg EMSX', 'UI', 'Job board'],
  },
  {
    id: 'azonix', org: 'Azonix Tech', role: 'Software Engineering Intern',
    dates: 'Jun 2024 – Jul 2024', location: 'Chennai, India', accent: 'azonix',
    bullets: [
      "Resolved user-experience issues by identifying key flaws and deploying UI improvements to production.",
      "Streamlined EV-charger data analysis by designing a dashboard to visualize performance metrics.",
      "Implemented facial recognition on CCTV feeds, enabling 90%+ accuracy in varied conditions.",
    ],
    tags: ['UI/UX', 'Dashboards', 'Facial recognition', 'CCTV'],
  },
];

export const achievements = [
  { title: 'MusaLabs Hackathon — Winner', detail: '1st of 50+ teams, sponsored by Microsoft Azure.' },
  { title: "Dean's List", detail: 'Spring 2025.' },
];

// Featured projects shown in the Projects district. Curated from github.com/Purabhh
// (descriptions distilled from each repo's README).
export const projectsFallback = [
  {
    name: 'LeaseLink',
    description: 'Won the MusaLabs Hackathon (50+ teams, 150+ participants): a Tinder-style housing marketplace connecting renters and landlords through mutual interest. React + Tailwind, Express.js, PostgreSQL, Google OAuth, and a gated real-time WebSocket chat.',
    language: 'TypeScript', stars: 1, url: 'https://github.com/Purabhh/LeaseLink', homepage: 'https://www.leaselink.pro/', color: '#ffd34e', metallic: true, updated: '2025-08-21',
  },
  {
    name: 'FastRust',
    description: 'A Rust web framework built directly on Hyper that brings a FastAPI-style developer experience to Rust-native performance. Clean endpoint code, typed request handling, and automatic docs, while staying close to the metal.',
    language: 'Rust', stars: 4, url: 'https://github.com/Purabhh/FastRust', homepage: '', updated: '2026-03-17',
  },
  {
    name: 'VaultDB',
    description: 'A native desktop knowledge base that turns an Obsidian vault into a local vector database. Tauri (React + Rust) with Ollama embeddings, Qdrant similarity search, natural-language search, and a force-directed semantic graph. Runs entirely on local AI.',
    language: 'TypeScript', stars: 0, url: 'https://github.com/Purabhh/vaultdb', homepage: '', updated: '2026-04-16',
  },
  {
    name: 'StormLink',
    description: 'A multi-agent AI disaster-response system built at HackUSF 2026. Search any US location for live NOAA weather alerts on a map, find nearby emergency resources, and chat with a three-agent pipeline (Orchestrator, Data Monitor, Resource Matcher) that returns voice-accessible answers from live data.',
    language: 'TypeScript', stars: 2, url: 'https://github.com/Purabhh/stormlink', homepage: '', updated: '2026-04-06',
  },
  {
    name: 'PassportBros',
    description: 'A shared travel scrapbook for you and your friends: anyone with the invite link joins, posts photos and videos to each country, and sees what everyone shared. No passwords or signups. Postgres, Cloudflare R2 for media, with a boarding-pass landing.',
    language: 'HTML', stars: 0, url: 'https://github.com/Purabhh/PassportBros', homepage: 'http://137.184.65.14/', updated: '2026-05-27',
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
  Languages: ['Python', 'Java', 'TypeScript', 'SQL', 'C++', 'JavaScript', 'HTML'],
  Frontend: ['React', 'Angular', 'Swift', 'Next.js', 'AJAX'],
  Backend: ['Node.js', 'NestJS', 'LangChain', 'Express', 'Spring Boot', 'Pandas', 'Docker'],
  Blockchain: ['Solidity', 'Hyperledger Besu', 'Web3j', 'ethers.js', 'Web3.js'],
  Database: ['PostgreSQL', 'MySQL', 'SQLite'],
};
