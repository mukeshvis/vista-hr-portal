# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start development server:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
npm run start
```

**Code quality:**
```bash
npm run lint
```

**Database operations:**
```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema changes to database
npm run db:migrate     # Run database migrations
npm run db:studio      # Open Prisma Studio for database management
npm run db:seed        # Seed the database with initial data
```

## Architecture Overview

This is a **Next.js 15 HR Portal** application with the following key architectural components:

### Database & ORM
- **Prisma ORM** with MySQL database
- Core HR models: `User`, `employee`, `department`, `attendance`, `payroll_data`, `payslip`
- Database schema focuses on comprehensive HR management including employee records, attendance tracking, payroll processing, and leave management

### Authentication & Authorization
- **NextAuth.js v5** (beta) for authentication
- Custom middleware for route protection (`src/middleware.ts`)
- Protected routes: `/dashboard`, `/admin`, `/profile`
- Auth routes: `/login`, `/register`
- Session-based authentication with automatic redirects

### UI Framework
- **Tailwind CSS v4** for styling
- **Radix UI** components for accessible UI primitives
- **Lucide React** for icons
- Custom UI components in `src/components/ui/` following shadcn/ui patterns
- Component architecture: `button`, `card`, `input`, `dropdown-menu`, `tabs`, etc.

### Project Structure
```
src/
├── app/                    # Next.js 15 App Router
│   ├── api/auth/          # NextAuth.js API routes
│   ├── dashboard/         # Main HR dashboard with comprehensive metrics
│   ├── login/            # Authentication pages
│   └── layout.tsx        # Root layout with providers
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (shadcn/ui style)
│   ├── sidebar.tsx      # Navigation sidebar
│   └── top-navigation.tsx # Header navigation
├── lib/                 # Utility libraries
│   ├── auth/           # Authentication configuration
│   └── actions/        # Server actions
├── middleware.ts       # Route protection middleware
└── types/             # TypeScript type definitions
```

### Key Features
- **HR Dashboard**: Comprehensive analytics with employee metrics, attendance overview, payroll status, and pending approvals
- **Employee Management**: Full employee lifecycle with detailed records including personal info, salary, attendance policies
- **Attendance Tracking**: Clock in/out system with late arrival tracking and work-from-home support
- **Payroll System**: Complete payroll processing with allowances, deductions, tax calculations, and payslip generation
- **Leave Management**: Leave request system with different leave types (annual, emergency, medical)

### Development Notes
- Uses TypeScript with strict mode enabled
- Path aliases configured: `@/*` maps to `./src/*`
- Environment variables managed through `.env` file (see `.env.example`)
- MySQL database connection required for full functionality
- PostCSS configuration for Tailwind CSS processing

### Database Requirements
The application expects a MySQL database with comprehensive HR tables including employee records, attendance data, payroll information, and departmental structure. Run `npm run db:push` to sync the Prisma schema with your database.