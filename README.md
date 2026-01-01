# Tutorly

A modern, comprehensive tutoring management application built with React and TypeScript. Tutorly helps tutors efficiently manage their students, schedule lessons, track earnings, and organize their teaching business.

## Features

- **Dashboard**: Overview of your tutoring business with key metrics, charts, and quick actions
- **Student Management**: Track student information, progress, schedules, and status
- **Schedule Management**: Visual weekly schedule with recurring and one-time lessons
- **Lessons**: Manage and track individual lessons and sessions
- **Earnings Tracking**: Monitor income with detailed transaction history and analytics
- **Settings**: Customize your profile and application preferences

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd tutorly
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally

## Project Structure

```
tutorly/
├── components/          # Reusable UI components
│   ├── AddSessionModal.tsx
│   ├── Layout.tsx
│   ├── Modal.tsx
│   └── Toast.tsx
├── contexts/            # React context providers
│   ├── DemoDataContext.tsx
│   ├── EarningsContext.tsx
│   ├── ScheduleContext.tsx
│   ├── StudentsContext.tsx
│   └── UserProfileContext.tsx
├── data/                # Demo data and static content
│   └── demoData.ts
├── screens/             # Main application screens
│   ├── Dashboard.tsx
│   ├── Earnings.tsx
│   ├── Lessons.tsx
│   ├── Login.tsx
│   ├── Schedule.tsx
│   ├── Settings.tsx
│   └── Students.tsx
├── utils/               # Utility functions
│   └── earningsCalculations.ts
├── App.tsx              # Main application component
├── index.tsx            # Application entry point
├── types.ts             # TypeScript type definitions
└── vite.config.ts       # Vite configuration
```

## Development

The application uses React Context API for state management, with separate contexts for:
- User profile data
- Student information
- Schedule items
- Earnings and transactions
- Demo data

All components are written in TypeScript with strict type checking enabled.

## License

This project is private and proprietary.
