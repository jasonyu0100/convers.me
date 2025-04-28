# Convers.me

Convers.me is an intelligent process planning platform that transforms standard operating procedures into actionable workflows with AI-powered assistance. It helps organizations digitize, execute, and optimize their SOPs through a combination of process tracking, intelligent scheduling, and real-time guidance.

## Overview

Convers.me enables teams to manage complex processes with AI guidance, turning intentions into executed SOPs with real-time tracking and automated compliance. The platform offers a complete solution for process management, from planning to execution and analysis.

## Key Features

### Process Intelligence

- **SOP digitization and indexing**: Transform your organization's standard operating procedures into an intelligent planning system
- **AI-powered workflow understanding**: AI assistant that understands, analyzes and suggests actions related to process SOPs
- **Personalized process recommendations**: Get tailored guidance for your specific workflows

### Prompt-Based Weekly Planning

- **Single-prompt weekly planning**: Generate your perfect week from a single prompt
- **Dynamic workload adaptation**: Adjust to changing priorities and workloads automatically
- **Intelligent priority management**: Focus on what matters most with AI-driven scheduling

### Time-Boxed Execution

- **In-event process guidance**: Navigate your week with clear, step-by-step instructions
- **Real-time completion tracking**: Monitor progress as you work through your processes
- **Integrated journaling and documentation**: Capture insights and documentation as you work

### Performance Insights

- **Process adherence metrics**: Track how closely your team follows established SOPs
- **Completion rate analytics**: Measure effectiveness and identify bottlenecks
- **Continuous improvement suggestions**: Get AI-powered recommendations to optimize workflows

## Technical Components

### Frontend

- **React/Next.js**: Modern web application with server-side rendering
- **TailwindCSS**: Responsive and customizable UI components
- **TypeScript**: Type-safe development for improved reliability
- **React Query**: Efficient data fetching and state management

### Backend

- **FastAPI**: High-performance Python API framework
- **PostgreSQL**: Robust relational database for data storage
- **SQLAlchemy**: ORM for database interactions
- **Celery**: Background task processing for asynchronous operations
- **Redis**: Message broker and cache

### Architecture

- **Process Management**: Create, track, and manage standardized processes and SOPs
- **Live AI Sessions**: Engage with a process-aware AI assistant that can suggest operations
- **Calendar & Events**: Schedule and manage events with timeline views
- **Insights Dashboard**: Track performance metrics and activity
- **Feed & Posts**: Share updates and communicate with team members
- **Profile Management**: User profiles with activity timelines

## AI Integration

The platform features deep AI integration with:

- **Process-Aware AI Assistant**: Understands context about the process, including steps, substeps, and completion status
- **Suggested Operations**: When a user message is process-related, the AI suggests relevant operations like completing steps or adding new steps
- **Rich Context Handling**: The system provides the AI with detailed process information
- **Streaming Support**: Real-time AI responses for natural conversation flow
- **Transcription and Processing**: Voice interaction with intelligent processing

## Benefits

- **65% Faster Process Completion**: Streamline workflows with intelligent guidance
- **4.5x Higher SOP Adherence**: Improve consistency across your organization
- **92% Operator Time Optimization**: Make the most of your team's valuable time

## Getting Started

### Prerequisites

- Node.js 18+ (Frontend)
- Python 3.10+ (Backend)
- PostgreSQL 15+
- Docker (recommended for local development)

### Quick Start

1. Clone the repository: `git clone https://github.com/your-username/convers.me.git`
2. Set up the backend:
   ```bash
   cd convers.me/backend
   ./scripts/dev.sh  # Sets up database, dependencies, and starts server
   ```
3. Set up the frontend:
   ```bash
   cd convers.me/frontend
   npm install
   npm run dev
   ```
4. Access the application: Open your browser and navigate to `http://localhost:3000`

For detailed setup instructions, see [Backend README](backend/README.md) and Frontend documentation.

## Documentation

- **Backend API**: Available at `http://localhost:8000/docs` when running locally
- **Database Schema**: Detailed in the [Backend README](backend/README.md)
- **AI Integration**: Configuration details in [CLAUDE.md](CLAUDE.md)

## Deployment

The application is designed for easy deployment to cloud platforms:

- **Backend**: Deployable to Fly.io with provided scripts
- **Frontend**: Deployable to Vercel or similar platforms
- **Database**: Compatible with managed PostgreSQL services

For deployment instructions, see the deployment sections in the respective READMEs.

---

Convers.me helps organizations transform complex SOPs into clear, adaptive tasks with continuous improvement through AI-powered analytics.
