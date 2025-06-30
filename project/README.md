# JobTracker - Advanced Job Application Management

A modern, comprehensive job application tracking system with Gmail integration, built with Next.js, Firebase, and Tailwind CSS.

## 🌟 Features

### Core Job Management
- **Complete CRUD Operations**: Add, edit, delete, and update job applications
- **Multiple Views**: Switch between table view and kanban board view
- **Job Details Modal**: Click on any job to view comprehensive details including email content
- **Status Tracking**: Track applications through Applied → Interviewing → Offered/Rejected/Ghosted
- **Rich Data**: Store company info, job titles, application dates, notes, and job links
- **Smart Filtering**: Filter by status, search by company/position, date range filtering

### 🔄 Gmail Integration
- **OAuth Authentication**: Secure Google OAuth 2.0 integration
- **Automatic Email Scanning**: Scan your Gmail inbox for job-related emails
- **Smart Detection**: AI-powered parsing to extract:
  - Company names
  - Job titles/positions
  - Application status
  - Email metadata
- **Direct Gmail Links**: One-click access to original emails from the dashboard
- **Auto-Import Badges**: Visual indicators for email-imported jobs
- **Background Scanning**: Optional automatic hourly scans

### 🎯 Enhanced Email Filtering
- **Job Board Notification Filtering**: Automatically filters out promotional emails from:
  - LinkedIn job alerts and recommendations
  - Indeed job digest and notifications
  - Glassdoor job alerts
  - ZipRecruiter and other job board notifications
  - Generic "jobs you may like" emails
- **Smart Company Extraction**: Improved company name detection that:
  - Filters out generic terms like "Team", "HR", "Notifications"
  - Distinguishes between actual companies and automated systems
  - Extracts real company names from email signatures and content
- **Enhanced Job Title Recognition**: Advanced pattern matching for:
  - Application confirmations and responses
  - Interview scheduling emails
  - Offer letters and rejections
  - Direct recruiter outreach
- **Confidence Scoring**: Refined algorithm to reduce false positives while capturing more legitimate job emails

*See [EMAIL_FILTERING_IMPROVEMENTS.md](./EMAIL_FILTERING_IMPROVEMENTS.md) for detailed technical information.*

### 📊 Analytics & Insights
- **Application Statistics**: Total applications, weekly/monthly trends
- **Status Distribution**: Visual breakdown of application statuses
- **Success Rate Tracking**: Calculate offer rates and response rates
- **Source Analytics**: Compare manual vs auto-imported applications
- **Timeline Visualization**: Track application activity over time

### 🎨 User Experience
- **Modern UI**: Clean, professional design with shadcn/ui components
- **Dark/Light Mode**: System-aware theme switching
- **Responsive Design**: Works perfectly on desktop and mobile
- **Real-time Updates**: Live data synchronization with Firebase
- **Intuitive Navigation**: Easy-to-use sidebar and navigation
- **Tooltips & Hints**: Helpful UI guidance throughout the app

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Firebase project with Firestore enabled
- Google Cloud project with Gmail API enabled

### Installation

1. **Clone and install dependencies**:
   ```bash
   cd project
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your configuration:
   ```env
   # Gmail Integration
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   NEXT_PUBLIC_BASE_URL=http://localhost:3000

   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

3. **Configure Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Gmail API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/gmail/callback` (development)
     - `https://yourdomain.com/api/auth/gmail/callback` (production)

4. **Set up Firebase**:
   - Create a Firebase project
   - Enable Firestore Database
   - Enable Authentication
   - Add your domain to authorized domains

5. **Run the application**:
   ```bash
   npm run dev
   ```

## 📖 Usage Guide

### Getting Started
1. **Sign In**: Use Firebase authentication to create your account
2. **Connect Gmail**: Go to Email Integration → Connect Gmail
3. **Authorize Access**: Grant permission to scan your Gmail inbox
4. **Scan Emails**: Click "Scan Emails" to import existing job applications
5. **Manage Jobs**: Add new applications manually or let auto-scan handle it

### Viewing Job Details
- **Click any job** in the table or kanban board to open the detailed view
- **Job Information**: Complete job details, status, dates, and links
- **Email Content**: For auto-imported jobs, view the original email content
- **Direct Actions**: Edit the job or open the original email in Gmail
- **Rich Notes**: View and edit detailed notes about the application

### Email Integration Workflow
1. **Initial Setup**: Connect your Gmail account (one-time setup)
2. **First Scan**: Manual scan to import historical job emails (last 30 days)
3. **Ongoing Monitoring**: Enable auto-scan for continuous monitoring
4. **Review Imports**: Check auto-imported jobs and adjust as needed
5. **Manual Curation**: Add jobs not captured by email scanning

### Best Practices
- **Enable Auto-Scan**: Let the system continuously monitor your inbox
- **Review Imports**: Check auto-imported jobs for accuracy
- **Use Rich Notes**: Add detailed notes about interviews, contacts, etc.
- **Update Status**: Keep job statuses current for accurate analytics
- **Check Gmail Links**: Use direct email links to reference original communications
- **View Full Details**: Click on jobs to see complete information and email content

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 13+ with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context + React hooks
- **Authentication**: Firebase Auth integration

### Backend
- **API Routes**: Next.js API routes for Gmail integration
- **Database**: Firebase Firestore for real-time data
- **Email Integration**: Google APIs for Gmail access
- **Authentication**: Google OAuth 2.0

### Key Components
- `app/page.tsx` - Main dashboard and job management
- `components/job-table.tsx` - Tabular view of applications
- `components/kanban-board.tsx` - Kanban-style board view
- `components/email-integration-dashboard.tsx` - Gmail integration controls
- `contexts/EmailIntegrationContext.tsx` - Email state management
- `lib/client-email.ts` - Client-side email API wrapper
- `app/api/email/` - Server-side Gmail integration APIs

## 🔧 Technical Details

### Email Parsing Algorithm
The system uses sophisticated parsing to extract job information:

1. **Job Detection**: Searches for job-related keywords and domains
2. **Company Extraction**: Parses email domains and sender information
3. **Position Extraction**: Uses regex patterns to find job titles
4. **Status Determination**: Analyzes email content for status indicators
5. **Confidence Scoring**: Assigns confidence levels to parsed data

### Security Features
- **OAuth 2.0**: Secure Google authentication
- **Token Management**: Automatic token refresh handling
- **CORS Protection**: Proper origin validation
- **Environment Isolation**: Separate development/production configs

### Performance Optimizations
- **Background Scanning**: Non-blocking email processing
- **Batch Operations**: Efficient Firestore writes
- **Client-side Caching**: Reduced API calls
- **Lazy Loading**: Progressive data loading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Hosted on [Vercel](https://vercel.com/)
- Database by [Firebase](https://firebase.google.com/)

---

**Happy job hunting! 🎯**
