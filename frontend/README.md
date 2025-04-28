# Convers.me Frontend

The modern frontend for the Convers.me platform, built with Next.js 14, React, TypeScript, and Tailwind CSS. This application provides a comprehensive suite of collaboration tools including calendaring, process management, live AI-assisted sessions, and more.

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm or yarn
- Backend API running (see `/backend` directory)
- OpenAI API key for live sessions (see CLAUDE.md)

### Installation

1. Install dependencies:

```bash
# Using npm
npm install

# Using yarn
yarn
```

2. Environment setup:

Copy the example environment file and modify as needed:

```bash
cp .env.example .env.local
```

Required environment variables:

```
NEXT_PUBLIC_API_URL=http://localhost:8000 # Backend API URL
OPENAI_API_KEY=your_key_here # For live AI sessions
```

3. Start the development server:

```bash
# Using npm
npm run dev

# Using yarn
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

See [project_structure.md](project_structure.md) for a detailed overview of the codebase organization.

## Main Routes

The application includes the following main routes:

- **/calendar**: View and manage events in month/week views
- **/feed**: Activity feed with posts and updates
- **/insight**: Analytics and performance metrics
- **/library**: Content organization and discovery
- **/live**: Real-time collaboration with AI assistance
- **/login**: Authentication and user registration
- **/plan**: Create and manage plans
- **/process**: Create and manage processes/workflows
- **/profile**: User information and activity
- **/room**: Virtual meeting spaces and discussions
- **/schedule**: Schedule management and ticketing
- **/settings**: User settings and preferences
  - **/settings/admin**: Admin control panel
  - **/settings/change-password**: Password management
  - **/settings/notifications**: Notification preferences
  - **/settings/profile**: Profile management
  - **/settings/security**: Security settings

## Architecture

### Core Features

- **AI Assistance**: OpenAI integration for live collaboration sessions
- **Process Management**: Structured workflows with steps and substeps
- **Real-time Updates**: WebSocket-based updates for collaborative features
- **Rich Media Support**: Audio, video, and image handling throughout the application

### UI Components

The comprehensive UI component library in `app/components/ui/` includes:

- **Button, Inputs**: Form components with full TypeScript support
- **Avatar, Tags**: User and metadata visualization components
- **Cards**: Content display components for various data types
- **Charts**: Interactive data visualization components
- **Loading**: Loading indicators, skeletons, and error boundaries
- **Dialog**: Modal and popup components with rich interaction patterns

### Routing

Next.js App Router is used for routing with custom page templates in `app/components/router/`.

### State Management

- **React Context**: For global and feature-specific state
- **Custom Hooks**: Encapsulate logic for features and data fetching
- **React Query**: For API data fetching, caching and synchronization
- **Zustand**: For global state management with minimal boilerplate

### Styling

- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **CSS Modules**: For component-specific styling when needed
- **Custom Fonts**: Creato Display font family for consistent typography
- **Gradient Backgrounds**: Custom gradient generators for vibrant UI elements
- **Dark/Light Mode**: Theme support with consistent color schemes

## Development Workflow

### Code Style

- Format code with Prettier:

  ```bash
  npm run format
  ```

- Lint code with ESLint:
  ```bash
  npm run lint
  ```

### Adding a New Route

1. Create a new directory in `app/(routes)/`
2. Create the required files following the route pattern:
   - `page.tsx`: Main page component
   - `RouteNameView.tsx`: Main view component
   - `hooks/useRouteName.tsx`: Route logic
   - `hooks/useRouteNameHeader.tsx`: Header configuration
   - `types/index.ts`: Type definitions
   - `components/`: Route-specific components

All pages use the Next.js App Router pattern with the following routes structure:

```
app/
  (routes)/
    calendar/
    feed/
    insight/
    library/
    live/
    login/
    plan/
    process/
    profile/
    room/
    schedule/
    settings/
      admin/
      change-password/
      notifications/
      profile/
      security/
```

### Using the UI Component Library

Import components from the UI library:

```tsx
import { Button, Avatar, Tag } from '@/app/components/ui';
```

### API Integration

The application uses a custom API client for backend communication:

```tsx
import { api } from '@/app/services/api';

// Fetch data
const events = await api.get('/events');

// Create data
await api.post('/events', newEvent);
```

### Working with Mock Data

During development, you can use the mock data available in public directories:

```tsx
// Example images
import { profilePicture } from '@/public/profile/profile-picture-1.jpg';

// Example audio/video for testing media features
import { stockAudio } from '@/public/audio/stock-audio-1.mp3';
```

## TypeScript

Types are organized by feature area in `app/types/`. Shared types are in `app/types/shared/`.

### Type System Overview

The project uses a three-part type system:

1. **API Types** - Auto-generated from the OpenAPI schema (`app/types/api.ts`)
2. **Database Types** - Core database models (`app/types/database.ts`)
3. **Schema Types** - Bridge between API and UI (`app/types/schema/index.ts`)

### OpenAPI Type Generation

The project uses [openapi-typescript](https://github.com/drwpow/openapi-typescript) to generate TypeScript types from the backend's OpenAPI schema.

To generate or update the types:

1. Make sure the backend server is running at http://localhost:8000
2. Run the following command:

```bash
npm run generate-types
```

This will:

1. Fetch the OpenAPI schema from the backend
2. Fix any reference issues in the schema
3. Generate TypeScript types at `app/types/api.ts`

### Using Generated Types

You can use the types in your API calls in several ways:

#### Direct API Types

```typescript
import type { components, paths } from '@/app/types/api';

// Use response types
type User = components['schemas']['UserRead'];

// Use request body types
type LoginRequest = paths['/auth/token']['post']['requestBody']['content']['application/x-www-form-urlencoded'];

// Use in API calls
const response = await apiClient.get<components['schemas']['UserRead']>('/users/me');
```

#### Schema Types (recommended for UI components)

```typescript
import { UserSchema, ApiUserSchema } from '@/app/types/schema';

// Original schema types (backward compatibility)
function UserComponent({ user }: { user: UserSchema }) {
  // ...
}

// New API-generated schema types (preferred for new code)
function UserComponent({ user }: { user: ApiUserSchema }) {
  // ...
}
```

### Database Types

Core database models are defined in `app/types/database.ts` and are used by the schema conversion system. For most application code, you should use the schema types or API types rather than directly using the database types.

## Building for Production

```bash
# Using npm
npm run build

# Using yarn
yarn build
```

## Deployment

The application can be deployed to Vercel or other hosting providers.

### Vercel Deployment

```bash
vercel
```

## Troubleshooting

### Common Issues

- **API Connection Issues**: Ensure the backend API is running and check `.env.local` for correct API URL
- **Type Errors**: Run `npm run type-check` to check for TypeScript errors
- **Build Errors**: Check console for detailed error messages

## Performance Optimization

- **Code Splitting**: Next.js automatically handles code splitting for optimal bundle sizes
- **Image Optimization**: Next.js Image component for responsive and optimized images
- **Streaming**: React Server Components support streaming rendering for improved TTFB
- **Lazy Loading**: Dynamic imports for route components and heavy dependencies
- **Suspense Boundaries**: Strategic suspense boundaries for incremental loading
- **Edge Caching**: Deployment with edge caching for global performance
- **Web Vitals Monitoring**: Performance tracking with Core Web Vitals metrics

## Contributing

1. Follow the project structure and naming conventions
2. Add tests for new features and maintain existing test coverage
3. Ensure type safety with proper TypeScript types (no `any` types)
4. Follow the UI component patterns and reuse existing components
5. Update documentation as needed when adding new features
6. Format code with Prettier before committing
7. Test all changes in both development and production builds

## AI Integration

See [CLAUDE.md](../CLAUDE.md) for details on the OpenAI integration for live sessions and process assistance. The system provides:

- Process-aware AI Assistant capabilities
- Suggested operations based on user messages
- Rich context handling for intelligent responses
- Streaming support for real-time interaction
- Voice transcription with contextual understanding
