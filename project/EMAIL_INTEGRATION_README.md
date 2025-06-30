# JobTracker - Email Integration Setup

This guide will help you set up the email integration feature that automatically scans your Gmail inbox for job application emails.

## Features

- 📥 **Automatic Job Application Tracking** - Scans your Gmail inbox for job-related emails
- ✅ **Smart Categorization** - Automatically categorizes emails into:
  - ✅ Offers
  - ❌ Rejections  
  - 🕒 Interviews
  - ⏳ No Response (Ghosted)
- 🔄 **Smart Updates** - Updates job status based on email replies
- 📊 **Application Counter** - Shows total applications sent
- 📅 **Timeline View** - Tracks when jobs were applied to and updated

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/gmail/callback` (for development)
     - `https://yourdomain.com/api/auth/gmail/callback` (for production)

**Your current OAuth 2.0 Client ID is configured as:**
- Client ID: `219730423697-5pp8cqrbrcep0m6tkt4d3uq9f8fnniqk.apps.googleusercontent.com`
- Make sure the redirect URI above is added to your Google Cloud Console

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
# Email Integration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Firebase (existing)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
npm run dev
```

## Using Email Integration

### Connecting Your Gmail Account

1. Navigate to the "Email Integration" tab in the sidebar
2. Click "Connect Gmail"
3. Authorize the application to access your Gmail account
4. The app will request permission to:
   - Read your email messages
   - Modify email labels (for tracking processed emails)

### Manual Email Scan

1. Click "Scan Now" to manually scan your inbox
2. The app will analyze emails from the last 30 days
3. Job-related emails will be automatically categorized and added to your job tracker

### Automatic Scanning

1. Enable "Automatic Scanning" to scan your inbox every hour
2. New job applications will be automatically detected and added
3. Status updates will be applied based on email content

## How It Works

### Email Detection

The system looks for emails containing job-related keywords:
- "job", "application", "position", "role", "interview"
- "hiring", "recruiter", "hr", "human resources"
- "talent", "career", "opportunity"

### Company Extraction

Companies are identified through:
- Email domain analysis (excluding common email providers)
- Email signature parsing
- Natural language processing of email content

### Status Determination

- **Applied**: Confirmation emails, "thank you for applying"
- **Interviewing**: Interview invitations, calendar invites
- **Offered**: Job offers, congratulatory messages
- **Rejected**: Rejection notifications, "unfortunately"
- **Ghosted**: No response after 2+ weeks

### Smart Updates

The system tracks email threads and updates job status when:
- Interview invitations are received
- Offer letters arrive
- Rejection emails are sent
- Follow-up emails indicate status changes

## Privacy & Security

- OAuth 2.0 secure authentication
- Minimal required permissions (read-only access)
- Local storage of credentials (encrypted)
- No email content stored on servers
- Full control over data deletion

## Troubleshooting

### Common Issues

1. **OAuth Error**: Check that redirect URIs match in Google Cloud Console
2. **No Emails Found**: Verify Gmail API is enabled and credentials are correct
3. **False Positives**: Adjust confidence thresholds in email analysis settings
4. **Missing Jobs**: Check that emails contain sufficient job-related keywords

### Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure Gmail API quotas haven't been exceeded
4. Try disconnecting and reconnecting your Gmail account

## Future Enhancements

- Support for Outlook/Exchange integration
- Advanced NLP for better job extraction
- Machine learning-based categorization
- Integration with job board APIs
- Automated follow-up scheduling
- Email template generation

## Contributing

Feel free to contribute improvements to the email integration feature:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
