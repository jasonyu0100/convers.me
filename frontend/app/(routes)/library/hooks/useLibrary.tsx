'use client';

import {
  AcademicCapIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  DocumentTextIcon,
  LightBulbIcon,
  PresentationChartBarIcon,
  RocketLaunchIcon,
  StarIcon,
  UserGroupIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { useLibraryContext, LibraryProcess, LibraryCollection, ProcessDirectory } from './useLibraryContext';

// Original processes from before
const WORKFLOW_PROCESSES: LibraryProcess[] = [
  {
    id: 'project-kickoff',
    title: 'Project Kickoff',
    description: 'Start your new project with proper planning and alignment.',
    category: 'project-management',
    icon: <RocketLaunchIcon className='h-6 w-6' />,
    benefits: [
      'Never miss critical initial steps when launching a new project',
      'Automatically create recurring check-in meetings with stakeholders',
      'Log decisions and action items for easy reference later',
      'Track project progress with visual indicators',
    ],
    steps: [
      {
        title: 'Define Project Scope & Objectives',
        description: 'Document the project goals, deliverables, constraints, and success criteria.',
      },
      {
        title: 'Stakeholder Identification & Analysis',
        description: 'Identify all project stakeholders and document their expectations and influence.',
      },
      {
        title: 'Resource Planning',
        description: 'Determine the resources needed for the project including team members, tools, and budget.',
      },
      {
        title: 'Risk Assessment',
        description: 'Identify potential risks and develop mitigation strategies.',
      },
      {
        title: 'Communication Plan',
        description: 'Establish how project updates will be communicated to stakeholders.',
      },
      {
        title: 'Kickoff Meeting',
        description: 'Schedule and conduct a kickoff meeting with all team members and key stakeholders.',
      },
    ],
    saves: 2456,
    createdBy: 'Project Management Institute',
    createdAt: '2023-09-15',
  },
  {
    id: 'one-on-one',
    title: 'Effective One-on-Ones',
    description: 'Transform routine check-ins into powerful opportunities for leadership growth and team development.',
    category: 'management',
    icon: <ChatBubbleLeftRightIcon className='h-6 w-6' />,
    benefits: [
      'Build trust and psychological safety through structured yet personalized conversations',
      'Create a continuous feedback loop that enhances performance and satisfaction',
      'Maintain a searchable timeline of discussion topics and breakthroughs',
      'Generate insights on team engagement patterns across different time periods',
    ],
    steps: [
      {
        title: 'Pre-Meeting Preparation',
        description: 'Review previous notes and prepare discussion points for both ongoing and new topics.',
      },
      {
        title: 'Personal Check-in',
        description: 'Begin with a genuine inquiry into wellbeing to establish psychological safety and connection.',
      },
      {
        title: 'Progress Update',
        description: 'Review achievements and blockers since last meeting, with focus on removing obstacles.',
      },
      {
        title: 'Development Discussion',
        description: 'Dedicate time to career growth conversations and learning opportunities.',
      },
      {
        title: 'Bidirectional Feedback',
        description: 'Exchange honest, specific feedback on recent work and leadership/management style.',
      },
      {
        title: 'Action Planning',
        description: 'Collaboratively create SMART goals and commitments before the next meeting.',
      },
      {
        title: 'Documentation',
        description: 'Record key discussion points, decisions and actions in a shared, searchable format.',
      },
    ],
    saves: 1879,
    createdBy: 'Leadership Lab',
    createdAt: '2023-10-22',
  },
  {
    id: 'product-launch',
    title: 'Product Launch Playbook',
    description: 'Orchestrate a flawless product launch with this comprehensive cross-functional launch sequence.',
    category: 'product',
    icon: <ChartBarIcon className='h-6 w-6' />,
    benefits: [
      'Create a unified command center for all launch activities across departments',
      'Automatically sync timelines across marketing, sales, support and engineering',
      'Generate launch readiness dashboards that update in real-time',
      'Build an institutional knowledge base for future launches with each cycle',
    ],
    steps: [
      {
        title: 'Pre-Launch Validation',
        description: 'Confirm product-market fit with final user acceptance testing and beta feedback analysis.',
      },
      {
        title: 'Go-to-Market Strategy Alignment',
        description: 'Finalize positioning, messaging, and launch channels with interdepartmental sign-off.',
      },
      {
        title: 'Launch Asset Production',
        description: 'Create and QA all marketing, sales enablement, and customer education materials.',
      },
      {
        title: 'Technical Readiness',
        description: 'Complete infrastructure scaling, monitoring setup, and emergency response protocols.',
      },
      {
        title: 'Internal Communication',
        description: 'Brief all teams on launch timeline, responsibilities, and success metrics.',
      },
      {
        title: 'Launch Sequence Execution',
        description: 'Coordinate the timed release of product, announcements, and marketing campaigns.',
      },
      {
        title: 'Post-Launch Analysis',
        description: 'Systematically gather metrics and customer feedback to assess launch performance.',
      },
      {
        title: 'Optimization Plan',
        description: 'Develop immediate action items and long-term strategies based on launch results.',
      },
    ],
    saves: 3214,
    createdBy: 'Product Excellence Team',
    createdAt: '2023-11-05',
  },
  {
    id: 'bug-triage',
    title: 'Engineering Bug Triage Process',
    description: 'Systematically evaluate, prioritize and address software issues with maximum efficiency.',
    category: 'engineering',
    icon: <WrenchScrewdriverIcon className='h-6 w-6' />,
    benefits: [
      'Create transparent prioritization that aligns technical and business impact',
      'Build an early-warning system for critical issue patterns and regressions',
      'Reduce mean time to resolution through structured reproduction and assignment',
      'Generate team capacity insights that improve sprint planning accuracy',
    ],
    steps: [
      {
        title: 'Standardized Issue Capture',
        description: 'Document the bug with complete reproduction steps, environment details, and impact assessment.',
      },
      {
        title: 'Initial Severity Classification',
        description: 'Rate the bug on impact scale from cosmetic to critical/blocking based on defined criteria.',
      },
      {
        title: 'Technical Investigation',
        description: 'Perform root cause analysis and estimate complexity and effort for resolution.',
      },
      {
        title: 'Business Impact Evaluation',
        description: 'Determine customer impact, SLA implications, and potential revenue or reputation effects.',
      },
      {
        title: 'Priority Assignment',
        description: 'Calculate final priority based on severity, complexity, and business impact metrics.',
      },
      {
        title: 'Resource Allocation',
        description: 'Assign the properly skilled engineering resource with consideration for workload balance.',
      },
      {
        title: 'Resolution Tracking',
        description: 'Monitor progress against target resolution timeframes based on priority level.',
      },
      {
        title: 'Regression Prevention',
        description: 'Document fix, update test coverage, and record prevention measures for similar issues.',
      },
    ],
    saves: 2735,
    createdBy: 'Engineering Excellence',
    createdAt: '2023-08-17',
  },
  {
    id: 'design-sprint',
    title: 'Design Sprint Facilitation',
    description: 'Accelerate innovation through this intensive five-day collaborative problem-solving framework.',
    category: 'design',
    icon: <LightBulbIcon className='h-6 w-6' />,
    benefits: [
      'Compress months of discussion and decision-making into a single week',
      'Create a shared visual language for complex problems across disciplines',
      'Generate prototypes that validate ideas before committing development resources',
      'Build team cohesion and alignment that persists long after the sprint ends',
    ],
    steps: [
      {
        title: 'Day 1: Map',
        description: 'Create a shared understanding of the problem space, target users, and ideal long-term outcomes.',
      },
      {
        title: 'Day 2: Sketch',
        description: 'Generate diverse solution concepts individually using specialized ideation techniques.',
      },
      {
        title: 'Day 3: Decide',
        description: 'Evaluate concepts through structured critique and converge on the most promising approach.',
      },
      {
        title: 'Day 4: Prototype',
        description: 'Build a high-fidelity prototype that simulates the real experience in minimal time.',
      },
      {
        title: 'Day 5: Test',
        description: 'Validate assumptions through moderated user testing sessions with target customers.',
      },
      {
        title: 'Post-Sprint Synthesis',
        description: 'Analyze findings, document insights, and create an evidence-based roadmap for implementation.',
      },
    ],
    saves: 1923,
    createdBy: 'Design Innovation Lab',
    createdAt: '2023-06-30',
  },
];

// Create research processes
const RESEARCH_PROCESSES: LibraryProcess[] = [
  {
    id: 'user-research-study',
    title: 'User Research Study',
    description: 'Conduct comprehensive user research to inform product decisions with evidence-based insights.',
    category: 'research',
    icon: <AcademicCapIcon className='h-6 w-6' />,
    benefits: [
      'Build deep understanding of user needs, behaviors, and pain points',
      'Create a searchable repository of user insights for cross-team reference',
      'Generate data-driven requirements that reduce development rework',
      'Identify unmet needs that create new product opportunities',
    ],
    steps: [
      {
        title: 'Research Objective Definition',
        description: 'Clearly articulate the research questions and goals that will guide the study.',
      },
      {
        title: 'Methodology Selection',
        description: 'Choose appropriate research methods based on objectives, timeline, and resources.',
      },
      {
        title: 'Participant Recruitment',
        description: 'Identify and recruit participants that represent your target user segments.',
      },
      {
        title: 'Research Protocol Development',
        description: 'Create detailed scripts, tasks, and discussion guides for consistent execution.',
      },
      {
        title: 'Study Execution',
        description: 'Conduct research sessions with systematic data collection and documentation.',
      },
      {
        title: 'Data Analysis',
        description: 'Process collected data to identify patterns, insights, and actionable findings.',
      },
      {
        title: 'Insight Synthesis',
        description: 'Transform raw findings into structured insights that inform product decisions.',
      },
      {
        title: 'Recommendations & Implementation',
        description: 'Develop concrete recommendations and integrate findings into product planning.',
      },
    ],
    saves: 2185,
    createdBy: 'User Research Institute',
    createdAt: '2023-07-12',
  },
  {
    id: 'competitive-analysis',
    title: 'Competitive Analysis Framework',
    description: 'Systematically evaluate market competitors to identify strategic opportunities and threats.',
    category: 'research',
    icon: <AcademicCapIcon className='h-6 w-6' />,
    benefits: [
      'Create a comprehensive market landscape view to inform strategic planning',
      'Identify unexploited market gaps and differentiation opportunities',
      'Generate competitive intelligence dashboards for ongoing monitoring',
      'Build feature comparison matrices to guide product roadmap priorities',
    ],
    steps: [
      {
        title: 'Competitor Identification',
        description: 'Map primary, secondary, and emerging competitors in your market space.',
      },
      {
        title: 'Evaluation Criteria Selection',
        description: 'Define the key dimensions and metrics for competitor comparison.',
      },
      {
        title: 'Product/Service Assessment',
        description: 'Analyze competitor offerings, features, and capabilities against established criteria.',
      },
      {
        title: 'Market Positioning Analysis',
        description: 'Evaluate messaging, positioning, and unique value propositions.',
      },
      {
        title: 'Business Model Examination',
        description: 'Research pricing strategies, revenue models, and go-to-market approaches.',
      },
      {
        title: 'SWOT Analysis',
        description: 'Identify strengths, weaknesses, opportunities, and threats for each competitor.',
      },
      {
        title: 'Competitive Strategy Synthesis',
        description: 'Develop strategic recommendations based on competitive landscape insights.',
      },
      {
        title: 'Monitoring System Creation',
        description: 'Establish ongoing competitive intelligence gathering and alerting mechanisms.',
      },
    ],
    saves: 1987,
    createdBy: 'Market Research Alliance',
    createdAt: '2023-08-22',
  },
];

// Create design processes
const DESIGN_PROCESSES: LibraryProcess[] = [
  {
    id: 'ux-design-system',
    title: 'UX Design System Creation',
    description: 'Build a comprehensive design system that ensures consistency and accelerates product development.',
    category: 'design',
    icon: <LightBulbIcon className='h-6 w-6' />,
    benefits: [
      'Establish a single source of truth for design assets and patterns',
      'Accelerate design and development with reusable components',
      'Ensure consistent user experience across products and platforms',
      'Facilitate collaboration between design and engineering teams',
    ],
    steps: [
      {
        title: 'Design Audit',
        description: 'Inventory existing design patterns and inconsistencies across products.',
      },
      {
        title: 'Design Principles',
        description: 'Define core principles that will guide all design decisions and evaluations.',
      },
      {
        title: 'Visual Language Foundation',
        description: 'Establish color systems, typography, spacing, and grid frameworks.',
      },
      {
        title: 'Component Library Creation',
        description: 'Design and document reusable UI components with usage guidelines.',
      },
      {
        title: 'Pattern Documentation',
        description: 'Create interactive documentation of interaction patterns and workflows.',
      },
      {
        title: 'Technical Implementation',
        description: 'Develop code-based components that implement the design system.',
      },
      {
        title: 'Governance Structure',
        description: 'Establish processes for maintaining and evolving the design system.',
      },
      {
        title: 'Adoption & Training',
        description: 'Roll out the system with appropriate training and support materials.',
      },
    ],
    saves: 2312,
    createdBy: 'Design Systems Collective',
    createdAt: '2023-05-18',
  },
  {
    id: 'product-design-process',
    title: 'Product Design Process',
    description: 'A comprehensive end-to-end framework for designing user-centered digital products.',
    category: 'design',
    icon: <LightBulbIcon className='h-6 w-6' />,
    benefits: [
      'Transform complex user needs into intuitive, elegant solutions',
      'Create designs that balance user needs with business objectives',
      'Build a sequential design process that minimizes costly iterations',
      'Establish measurement frameworks to evaluate design effectiveness',
    ],
    steps: [
      {
        title: 'Discovery & Research',
        description: 'Gather user insights, business requirements, and technical constraints.',
      },
      {
        title: 'Problem Definition',
        description: 'Clearly articulate the design challenge and success criteria.',
      },
      {
        title: 'Ideation & Exploration',
        description: 'Generate diverse design concepts that address the defined problem.',
      },
      {
        title: 'Information Architecture',
        description: 'Structure content and functionality for intuitive navigation and flow.',
      },
      {
        title: 'Interaction Design',
        description: 'Define specific interactions, behaviors, and user flows.',
      },
      {
        title: 'Visual Design',
        description: 'Develop the aesthetic language that enhances usability and brand alignment.',
      },
      {
        title: 'Prototyping & Testing',
        description: 'Create testable prototypes and validate with representative users.',
      },
      {
        title: 'Design Specification',
        description: 'Prepare detailed documentation for development implementation.',
      },
    ],
    saves: 2156,
    createdBy: 'Product Design Academy',
    createdAt: '2023-09-10',
  },
];

// Create more processes for other categories
const SALES_PROCESSES: LibraryProcess[] = [
  {
    id: 'sales-discovery',
    title: 'Consultative Discovery Framework',
    description: 'Transform surface-level conversations into deep customer insights that drive value-based selling.',
    category: 'sales',
    icon: <BriefcaseIcon className='h-6 w-6' />,
    benefits: [
      'Build a comprehensive customer intelligence database that grows with each interaction',
      'Create instant visibility into decision-making structures within prospect organizations',
      'Generate qualification scoring that accurately predicts deal viability',
      'Develop personalized value propositions based on consistent data patterns',
    ],
    steps: [
      {
        title: 'Pre-Call Research',
        description: 'Compile prospect intelligence from multiple sources into an actionable briefing document.',
      },
      {
        title: 'Rapport Building',
        description: 'Establish authentic connection using personalized insights and value-focused opening.',
      },
      {
        title: 'Current State Assessment',
        description: 'Document existing processes, pain points, and costs of maintaining status quo.',
      },
      {
        title: 'Future State Vision',
        description: 'Co-create a detailed vision of ideal outcomes and quantifiable success metrics.',
      },
      {
        title: 'Stakeholder Mapping',
        description: 'Identify all decision-makers, influencers, and potential blockers in the buying committee.',
      },
      {
        title: 'Decision Process Analysis',
        description: 'Document evaluation criteria, budget parameters, and internal approval workflows.',
      },
      {
        title: 'Value Proposition Alignment',
        description: 'Connect specific solution capabilities to prioritized business outcomes and metrics.',
      },
      {
        title: 'Next Steps Planning',
        description: 'Establish mutual action plan with clear commitments from both parties.',
      },
    ],
    saves: 2187,
    createdBy: 'Revenue Excellence Team',
    createdAt: '2023-05-14',
  },
  {
    id: 'customer-success-onboarding',
    title: 'SaaS Customer Onboarding',
    description: 'Transform new customers into successful power users with this comprehensive onboarding framework.',
    category: 'client-management',
    icon: <BuildingOfficeIcon className='h-6 w-6' />,
    benefits: [
      'Reduce time-to-value with milestone-based implementation tracking',
      'Minimize churn risk through early adoption pattern monitoring',
      'Create success momentum with achievement celebrations and usage milestones',
      'Build systematic knowledge transfer protocols across customer teams',
    ],
    steps: [
      {
        title: 'Success Planning Workshop',
        description: 'Define concrete goals, KPIs, and success criteria aligned with customer business objectives.',
      },
      {
        title: 'Technical Implementation',
        description: 'Configure the platform, integrate with existing systems, and migrate relevant data.',
      },
      {
        title: 'Admin Training',
        description: 'Empower system administrators with advanced knowledge to manage internal deployment.',
      },
      {
        title: 'End User Enablement',
        description: 'Deliver role-based training sessions and create custom documentation resources.',
      },
      {
        title: 'Adoption Campaign',
        description: 'Launch internal marketing and gamification to drive consistent platform usage.',
      },
      {
        title: 'Success Milestone Review',
        description: 'Evaluate progress against success criteria and measure initial business impact.',
      },
      {
        title: 'Expansion Planning',
        description: 'Identify opportunities for additional use cases and value expansion.',
      },
      {
        title: 'Transition to Ongoing Success',
        description: 'Move from high-touch onboarding to regular success check-ins and growth planning.',
      },
    ],
    saves: 1876,
    createdBy: 'Customer Success Leaders',
    createdAt: '2023-07-22',
  },
];

const LEADERSHIP_PROCESSES: LibraryProcess[] = [
  {
    id: 'employee-development',
    title: 'Holistic Employee Development System',
    description: 'Nurture talent with a comprehensive approach to professional growth and career advancement.',
    category: 'management',
    icon: <AcademicCapIcon className='h-6 w-6' />,
    benefits: [
      'Create personalized growth trajectories based on individual strengths and aspirations',
      'Build institutional knowledge that survives departures and team changes',
      'Generate insights on skill gaps and learning ROI across the organization',
      'Improve retention by making growth visible and meaningful',
    ],
    steps: [
      {
        title: 'Strengths and Aspirations Assessment',
        description: 'Identify core talents, intrinsic motivators, and long-term career vision.',
      },
      {
        title: 'Skill Gap Analysis',
        description: 'Map current capabilities against both present role requirements and future career goals.',
      },
      {
        title: 'Learning Path Creation',
        description: 'Design a multi-modal development program combining formal training, mentorship, and experiences.',
      },
      {
        title: 'Goal Alignment',
        description: 'Connect individual development activities to team objectives and organizational strategy.',
      },
      {
        title: 'Experience Creation',
        description: 'Engineer specific projects, assignments and challenges that build targeted capabilities.',
      },
      {
        title: 'Progress Tracking',
        description: 'Document growth through both quantitative metrics and qualitative evidence of application.',
      },
      {
        title: 'Regular Reflection',
        description: 'Facilitate structured review sessions to extract insights and adjust development approach.',
      },
      {
        title: 'Recognition and Advancement',
        description: 'Formally acknowledge growth milestones and connect development to career progression.',
      },
    ],
    saves: 2014,
    createdBy: 'People Development Institute',
    createdAt: '2023-09-03',
  },
  {
    id: 'strategic-planning',
    title: 'Agile Strategic Planning',
    description: 'Create adaptable yet focused organizational direction in rapidly changing market conditions.',
    category: 'planning',
    icon: <PresentationChartBarIcon className='h-6 w-6' />,
    benefits: [
      'Maintain strategic clarity while preserving flexibility to respond to market shifts',
      'Create cascading alignment from vision to daily execution priorities',
      'Generate early warning indicators that identify assumption failures',
      'Build organizational resilience through scenario planning and contingency design',
    ],
    steps: [
      {
        title: 'Environmental Analysis',
        description: 'Conduct comprehensive assessment of market trends, competitive landscape, and disruption risks.',
      },
      {
        title: 'Capability Assessment',
        description: 'Inventory organizational strengths, assets, and comparative advantages versus competitors.',
      },
      {
        title: 'Strategic Direction Setting',
        description: 'Define core purpose, long-term vision, and medium-term strategic priorities and goals.',
      },
      {
        title: 'Key Results Framework',
        description: 'Establish clear success metrics that quantify progress toward strategic objectives.',
      },
      {
        title: 'Initiative Identification',
        description: 'Generate and prioritize specific programs, projects, and activities to achieve goals.',
      },
      {
        title: 'Resource Allocation',
        description: 'Align budget, talent, and organizational focus with strategic priorities.',
      },
      {
        title: 'Assumption Testing Protocol',
        description: 'Create specific checkpoints to validate strategic hypotheses and enable course correction.',
      },
      {
        title: 'Execution Rhythm',
        description: 'Establish cadence for review, learning, and adjustment at all organizational levels.',
      },
    ],
    saves: 2567,
    createdBy: 'Executive Excellence Forum',
    createdAt: '2023-04-11',
  },
];

const MARKETING_PROCESSES: LibraryProcess[] = [
  {
    id: 'content-marketing-system',
    title: 'Integrated Content Marketing System',
    description: 'Build a sustainable content engine that consistently delivers high-value assets to your audience.',
    category: 'marketing',
    icon: <DocumentTextIcon className='h-6 w-6' />,
    benefits: [
      'Create a unified content library that maintains brand consistency across all channels',
      'Build an engagement analytics dashboard for continuous improvement',
      'Streamline approval workflows to eliminate production bottlenecks',
      'Generate insight on content ROI to guide resource allocation',
    ],
    steps: [
      {
        title: 'Audience Intelligence Framework',
        description: 'Develop detailed persona profiles with content preferences, pain points, and information needs.',
      },
      {
        title: 'Strategic Content Calendar',
        description: 'Plan balanced content mix aligned with business goals, buying stages, and audience interests.',
      },
      {
        title: 'Content Brief Development',
        description: 'Create comprehensive guidelines for each content piece including keywords, angle, and CTAs.',
      },
      {
        title: 'Asset Production Workflow',
        description: 'Manage the creation process from initial draft through editing, design, and final approval.',
      },
      {
        title: 'Distribution Strategy',
        description: 'Define channel-specific publishing approach with appropriate formatting and promotion tactics.',
      },
      {
        title: 'Performance Measurement',
        description: 'Track engagement, conversion, and influence metrics for each content asset and type.',
      },
      {
        title: 'Content Optimization',
        description: 'Systematically enhance underperforming assets and expand successful content themes.',
      },
      {
        title: 'Content Repurposing',
        description: 'Transform high-performing assets into multiple formats for extended reach and value.',
      },
    ],
    saves: 1856,
    createdBy: 'Content Strategy Institute',
    createdAt: '2023-06-19',
  },
];

// Create process directories
const PROJECT_MANAGEMENT_DIRECTORY: ProcessDirectory = {
  id: 'project-processes',
  name: 'Project Management Essentials',
  description: 'Core processes for effective project planning, execution, and delivery.',
  processes: [WORKFLOW_PROCESSES[0], WORKFLOW_PROCESSES[2]],
  color: 'from-blue-500 to-purple-500',
};

const LEADERSHIP_DIRECTORY: ProcessDirectory = {
  id: 'leadership-processes',
  name: 'Leadership & People Development',
  description: 'Tools for team building, talent development, and organizational leadership.',
  processes: [WORKFLOW_PROCESSES[1], LEADERSHIP_PROCESSES[0], LEADERSHIP_PROCESSES[1]],
  color: 'from-green-500 to-teal-500',
};

const PRODUCT_DIRECTORY: ProcessDirectory = {
  id: 'product-processes',
  name: 'Product Excellence',
  description: 'Frameworks for product strategy, development, and go-to-market.',
  processes: [WORKFLOW_PROCESSES[2], WORKFLOW_PROCESSES[4]],
  color: 'from-amber-500 to-red-500',
};

const ENGINEERING_DIRECTORY: ProcessDirectory = {
  id: 'engineering-processes',
  name: 'Engineering Workflows',
  description: 'Systems for technical execution, quality assurance, and technical operations.',
  processes: [WORKFLOW_PROCESSES[3]],
  color: 'from-gray-700 to-gray-900',
};

const RESEARCH_DIRECTORY: ProcessDirectory = {
  id: 'research-processes',
  name: 'Research Methodologies',
  description: 'Structured approaches to gather insights and inform evidence-based decisions.',
  processes: [RESEARCH_PROCESSES[0], RESEARCH_PROCESSES[1]],
  color: 'from-indigo-500 to-blue-700',
};

const DESIGN_DIRECTORY: ProcessDirectory = {
  id: 'design-processes',
  name: 'Design Excellence',
  description: 'Frameworks for creating exceptional user experiences and visual systems.',
  processes: [WORKFLOW_PROCESSES[4], DESIGN_PROCESSES[0], DESIGN_PROCESSES[1]],
  color: 'from-purple-500 to-pink-600',
};

const SALES_DIRECTORY: ProcessDirectory = {
  id: 'sales-processes',
  name: 'Revenue Generation',
  description: 'Processes for sales, customer success, and account management.',
  processes: [SALES_PROCESSES[0], SALES_PROCESSES[1]],
  color: 'from-blue-600 to-indigo-700',
};

const MARKETING_DIRECTORY: ProcessDirectory = {
  id: 'marketing-processes',
  name: 'Marketing Systems',
  description: 'Frameworks for brand building, lead generation, and audience engagement.',
  processes: [MARKETING_PROCESSES[0]],
  color: 'from-pink-500 to-purple-600',
};

// Create collections
const LIBRARY_COLLECTIONS: LibraryCollection[] = [
  {
    id: 'startup-toolkit',
    title: 'Startup Success Toolkit',
    description: 'Essential processes and frameworks for early-stage ventures to build strong foundations, refine product-market fit, and scale efficiently.',
    coverImage: '/demo/demo-1.png',
    author: {
      name: 'Startup Accelerator Network',
      avatar: '/profile/profile-picture-1.jpg',
    },
    categories: ['project-management', 'product', 'engineering'],
    popularity: 3245,
    directories: [PROJECT_MANAGEMENT_DIRECTORY, PRODUCT_DIRECTORY, ENGINEERING_DIRECTORY],
    createdAt: '2023-11-15',
  },
  {
    id: 'enterprise-leadership',
    title: 'Enterprise Leadership Master Collection',
    description:
      'Comprehensive leadership frameworks for senior executives to build high-performing teams, develop talent, and execute organizational strategy.',
    coverImage: '/demo/demo-2.png',
    author: {
      name: 'Executive Leadership Institute',
      avatar: '/profile/profile-picture-2.jpg',
    },
    categories: ['management', 'planning'],
    popularity: 2873,
    directories: [LEADERSHIP_DIRECTORY, PROJECT_MANAGEMENT_DIRECTORY],
    createdAt: '2023-10-05',
  },
  {
    id: 'product-growth-system',
    title: 'Product-Led Growth Playbook',
    description: 'End-to-end systems for building, launching, and scaling products that fuel self-sustaining growth through exceptional user experience.',
    coverImage: '/demo/demo-3.png',
    author: {
      name: 'Product Growth Alliance',
      avatar: '/profile/profile-picture-3.jpg',
    },
    categories: ['product', 'engineering', 'marketing'],
    popularity: 3589,
    directories: [PRODUCT_DIRECTORY, ENGINEERING_DIRECTORY, MARKETING_DIRECTORY],
    createdAt: '2023-09-22',
  },
  {
    id: 'customer-journey-blueprint',
    title: 'Customer Journey Excellence Blueprint',
    description:
      'Orchestrate seamless customer experiences from acquisition through expansion with these integrated processes for sales, onboarding, and success.',
    coverImage: '/demo/demo-4.png',
    author: {
      name: 'Customer Experience Foundation',
      avatar: '/profile/profile-picture-4.jpg',
    },
    categories: ['sales', 'client-management', 'marketing'],
    popularity: 2156,
    directories: [SALES_DIRECTORY, MARKETING_DIRECTORY],
    createdAt: '2023-08-17',
  },
  {
    id: 'agile-transformation',
    title: 'Agile Transformation Toolkit',
    description: 'Comprehensive resources for organizations transitioning to agile methodologies across product, engineering, and operational functions.',
    coverImage: '/demo/demo-5.png',
    author: {
      name: 'Agile Excellence Consortium',
      avatar: '/profile/profile-picture-5.jpg',
    },
    categories: ['project-management', 'engineering', 'management'],
    popularity: 1987,
    directories: [PROJECT_MANAGEMENT_DIRECTORY, ENGINEERING_DIRECTORY, LEADERSHIP_DIRECTORY],
    createdAt: '2023-07-05',
  },
  {
    id: 'product-discovery',
    title: 'Product Discovery Essentials',
    description: 'Comprehensive toolkit for validating ideas, gathering insights, and making evidence-based product decisions.',
    coverImage: '/demo/demo-3.png',
    author: {
      name: 'Product Research Collective',
      avatar: '/profile/profile-picture-6.jpg',
    },
    categories: ['research', 'product', 'design'],
    popularity: 2346,
    directories: [RESEARCH_DIRECTORY, PRODUCT_DIRECTORY, DESIGN_DIRECTORY],
    createdAt: '2023-08-28',
  },
  {
    id: 'design-research-system',
    title: 'Design & Research Excellence',
    description: 'Integrated approach to user-centered design that combines robust research methodologies with advanced design practices.',
    coverImage: '/demo/demo-2.png',
    author: {
      name: 'Design Research Institute',
      avatar: '/profile/profile-picture-7.jpg',
    },
    categories: ['design', 'research'],
    popularity: 2189,
    directories: [DESIGN_DIRECTORY, RESEARCH_DIRECTORY],
    createdAt: '2023-06-15',
  },
];

export const CATEGORIES = [
  { id: 'all', name: 'All Collections' },
  { id: 'project-management', name: 'Project Management' },
  { id: 'management', name: 'Team Leadership' },
  { id: 'research', name: 'Research' },
  { id: 'design', name: 'Design' },
  { id: 'engineering', name: 'Engineering' },
  { id: 'product', name: 'Product' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'sales', name: 'Sales' },
  { id: 'client-management', name: 'Client Management' },
  { id: 'planning', name: 'Strategic Planning' },
];

export const useLibrary = () => {
  const {
    isLoading,
    error,
    selectedCategory,
    selectedCollection,
    setSelectedCategory,
    setSelectedCollection,
    handleProcessSelect,
    saveCollection,
    clearError,
  } = useLibraryContext();

  // Filter collections by category
  const filteredCollections =
    selectedCategory === 'all' ? LIBRARY_COLLECTIONS : LIBRARY_COLLECTIONS.filter((collection) => collection.categories.includes(selectedCategory));

  // Get the selected collection if there is one
  const activeCollection = selectedCollection ? LIBRARY_COLLECTIONS.find((c) => c.id === selectedCollection) || null : null;

  return {
    isLoading,
    error,
    selectedCategory,
    selectedCollection,
    setSelectedCategory,
    setSelectedCollection,
    collections: filteredCollections,
    activeCollection,
    categories: CATEGORIES,
    handleProcessSelect,
    saveCollection,
    clearError,
  };
};
