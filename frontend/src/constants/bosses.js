export const BOSSES = [
  {
    id: 'architect',
    title: 'The Nitpicking System Architect',
    shortName: 'Architect',
    description: 'Demands rock-solid layouts. Focuses on system scalability, database partitioning, caching, single points of failure (SPOFs), and system trade-offs.',
    difficulty: '⭐⭐⭐⭐',
    specialties: ['System Design', 'Scalability', 'Microservices', 'Trade-offs'],
    welcome: "Ah, another architect hopeful. Let me examine your structural integrity...",
    icon: '🏛️',
    placeholder: 'Describe your system design, database replication, caching layer, and scaling plan...',
    challenges: [
      "Design a highly available and scalable URL shortening service (like bit.ly). Explain your database choice, caching strategy, and how you handle key generation.",
      "Design a real-time collaborative document editing system (like Google Docs). Address how you resolve edit conflicts and scale connection handling.",
      "Design a global video streaming platform (like Netflix). Address content distribution, video encoding pipelines, and low-latency streaming."
    ],
    theme: {
      color: 'indigo',
      borderHover: 'hover:border-indigo-500/80 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]',
      tagColor: 'bg-indigo-950/30 text-indigo-300 border-indigo-500/10',
      vsColor: 'border-indigo-500/40 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]',
      hudAccent: 'bg-indigo-500',
      borderAccent: 'border-indigo-500/30',
      textAccent: 'text-indigo-400',
      focusRing: 'focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20',
      execButton: 'bg-indigo-600 border border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]'
    }
  },
  {
    id: 'cto',
    title: 'The Chaotic Startup CTO',
    shortName: 'CTO',
    description: 'Demands clean code and pragmatic execution. Focuses on code quality, testing strategy, engineering velocity, and technical debt tradeoffs.',
    difficulty: '⭐⭐⭐',
    specialties: ['Code Quality', 'Best Practices', 'Team Leadership', 'Pragmatism'],
    welcome: "Welcome to the trenches. Show me code that doesn't embarrass itself.",
    icon: '🚀',
    placeholder: 'Detail your code review feedback, testing priorities, and management approach...',
    challenges: [
      "A senior developer on your team refuses to write unit tests, claiming they slow down delivery. How do you handle this?",
      "The product team wants to release a new feature immediately, but the code has significant technical debt and no automated test coverage. What is your recommendation?",
      "Your team is experiencing high turnover, and developers complain about burn-out and unclear requirements. How do you address this?"
    ],
    theme: {
      color: 'rose',
      borderHover: 'hover:border-rose-500/80 hover:shadow-[0_0_30px_rgba(244,63,94,0.2)]',
      tagColor: 'bg-rose-950/30 text-rose-300 border-rose-500/10',
      vsColor: 'border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]',
      hudAccent: 'bg-rose-500',
      borderAccent: 'border-rose-500/30',
      textAccent: 'text-rose-400',
      focusRing: 'focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/20',
      execButton: 'bg-rose-600 border border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:bg-rose-500 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]'
    }
  },
  {
    id: 'pm',
    title: 'The Pedantic Product Manager',
    shortName: 'Product Manager',
    description: 'Demands product-market fit. Focuses on user metrics, Minimum Viable Product (MVP) scope, roadmap prioritization, and customer-centric design.',
    difficulty: '⭐⭐',
    specialties: ['User Experience', 'MVP Strategy', 'Scope Management', 'Metrics & Analytics'],
    welcome: "Let's align our roadmap. Show me how you trade off engineering complexity for user value...",
    icon: '📋',
    placeholder: 'Detail your feature prioritization, user experience solutions, and scope-management decisions...',
    challenges: [
      "We need to launch a new chat feature next week. The design team has proposed complex custom emojis, file sharing, and message search. How do you define the Minimum Viable Product (MVP)?",
      "Our daily active user count is dropping. The data shows users drop off during the sign-up funnel. What technical or UX improvements would you propose to reduce this drop-off rate?",
      "Marketing wants us to integrate three different analytics SDKs to track user behavior, but developers are concerned about app performance and bundle size. How do you resolve this conflict?"
    ],
    theme: {
      color: 'amber',
      borderHover: 'hover:border-amber-500/80 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]',
      tagColor: 'bg-amber-950/30 text-amber-300 border-amber-500/10',
      vsColor: 'border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
      hudAccent: 'bg-amber-500',
      borderAccent: 'border-amber-500/30',
      textAccent: 'text-amber-400',
      focusRing: 'focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20',
      execButton: 'bg-amber-600 border border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:bg-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]'
    }
  },
  {
    id: 'qa',
    title: 'The Rigorous QA Lead',
    shortName: 'QA Lead',
    description: 'Demands rock-solid quality. Focuses on edge cases, load testing, security vulnerabilities, automated regression checks, and failure recovery.',
    difficulty: '⭐⭐⭐',
    specialties: ['Edge Cases', 'Test Automation', 'Load Testing', 'Security'],
    welcome: "My mission is to break your assumptions. Prove to me that your logic is bulletproof under pressure...",
    icon: '🛡️',
    placeholder: 'Detail your test plan, edge case handling, performance verification, and mitigation strategies...',
    challenges: [
      "You are designing an API for processing payments. A user double-clicks the submit button, sending two identical requests simultaneously. How do you prevent duplicate charges?",
      "Your web application experiences a sudden 10x traffic spike due to a viral marketing campaign. What steps do you take to identify bottleneck sources and prevent database locks?",
      "A critical security audit reports that your application is vulnerable to SQL injection and Cross-Site Scripting (XSS). How do you patch these vulnerabilities system-wide?"
    ],
    theme: {
      color: 'teal',
      borderHover: 'hover:border-teal-500/80 hover:shadow-[0_0_30px_rgba(20,184,166,0.2)]',
      tagColor: 'bg-teal-950/30 text-teal-300 border-teal-500/10',
      vsColor: 'border-teal-500/40 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.2)]',
      hudAccent: 'bg-teal-500',
      borderAccent: 'border-teal-500/30',
      textAccent: 'text-teal-400',
      focusRing: 'focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20',
      execButton: 'bg-teal-600 border border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:bg-teal-500 hover:shadow-[0_0_20px_rgba(20,184,166,0.4)]'
    }
  }
];
