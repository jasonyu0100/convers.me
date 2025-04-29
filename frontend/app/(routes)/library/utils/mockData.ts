import { LibraryCollection, LibraryProcess, ProcessDirectory } from '../types';

// WORKFLOW PROCESSES
const WORKFLOW_PROCESSES: LibraryProcess[] = [
  {
    id: 'project-kickoff',
    title: 'Project Kickoff',
    description: 'Start your new project with proper planning and alignment.',
    category: 'project-management',
    icon: 'RocketLaunch', // Changed from JSX to string identifier
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
    icon: 'ChatBubbleLeftRight', // Changed from JSX to string identifier
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
  // Additional processes would be defined here
];

// RESEARCH PROCESSES
const RESEARCH_PROCESSES: LibraryProcess[] = [
  {
    id: 'user-research-study',
    title: 'User Research Study',
    description: 'Conduct comprehensive user research to inform product decisions with evidence-based insights.',
    category: 'research',
    icon: 'AcademicCap', // Changed from JSX to string identifier
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
  // Additional research processes would be defined here
];

// DESIGN PROCESSES
const DESIGN_PROCESSES: LibraryProcess[] = [
  {
    id: 'ux-design-system',
    title: 'UX Design System Creation',
    description: 'Build a comprehensive design system that ensures consistency and accelerates product development.',
    category: 'design',
    icon: 'LightBulb', // Changed from JSX to string identifier
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
  // Additional design processes would be defined here
];

// PROCESS DIRECTORIES
const PROJECT_MANAGEMENT_DIRECTORY: ProcessDirectory = {
  id: 'project-processes',
  name: 'Project Management Essentials',
  description: 'Core processes for effective project planning, execution, and delivery.',
  processes: WORKFLOW_PROCESSES.slice(0, 2),
  color: 'from-blue-500 to-purple-500',
};

const DESIGN_DIRECTORY: ProcessDirectory = {
  id: 'design-processes',
  name: 'Design Excellence',
  description: 'Frameworks for creating exceptional user experiences and visual systems.',
  processes: DESIGN_PROCESSES,
  color: 'from-purple-500 to-pink-600',
};

const RESEARCH_DIRECTORY: ProcessDirectory = {
  id: 'research-processes',
  name: 'Research Methodologies',
  description: 'Structured approaches to gather insights and inform evidence-based decisions.',
  processes: RESEARCH_PROCESSES,
  color: 'from-indigo-500 to-blue-700',
};

// LIBRARY COLLECTIONS
export const LIBRARY_DATA: LibraryCollection[] = [
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
    directories: [PROJECT_MANAGEMENT_DIRECTORY],
    createdAt: '2023-11-15',
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
    directories: [RESEARCH_DIRECTORY, DESIGN_DIRECTORY],
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
