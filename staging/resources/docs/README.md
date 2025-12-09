# Grand City HQ Guest Pass Management System

A comprehensive visitor management system with QR code generation, real-time check-in, and multi-role access control.

## Features

- **Multi-Role Authentication**: Executive, Staff, Guard, Receptionist, and Admin roles
- **QR Code Generation**: Automatic QR code generation for visitor passes
- **Digital Passes**: Professional digital visitor passes with download capability
- **Real-time Check-in**: QR code scanning for visitor check-in
- **Approval Workflow**: Executive approval system for visitor requests
- **Walk-in Registration**: Support for both scheduled and walk-in visitors
- **Pass Sharing**: WhatsApp and SMS sharing capabilities
- **Admin Dashboard**: System-wide analytics and visitor statistics

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start

# Access the application
Open http://localhost:3000 in your browser
```

### Production Deployment

#### Option 1: Deploy to Heroku

1. Install Heroku CLI
2. Create a new Heroku app:
   ```bash
   heroku create grand-city-guest-pass
   ```
3. Deploy:
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push heroku main
   ```

#### Option 2: Deploy to Railway

1. Install Railway CLI
2. Deploy:
   ```bash
   railway login
   railway init
   railway up
   ```

#### Option 3: Deploy to Vercel

1. Install Vercel CLI
2. Deploy:
   ```bash
   vercel --prod
   ```

## Environment Variables

No environment variables are required for basic operation. The system uses localStorage for data persistence.

## Security Features

- Content Security Policy (CSP) headers
- X-Frame-Options protection
- X-Content-Type-Options protection
- Secure camera permission handling
- Local data encryption (browser-based)

## Browser Compatibility

- Chrome/Chromium (Recommended)
- Firefox
- Safari
- Edge

## Mobile Support

- Responsive design for mobile devices
- Camera access for QR code scanning
- Touch-friendly interface

## System Requirements

- Node.js 16.0.0 or higher
- Modern web browser with localStorage support
- Camera access (for QR scanning features)

## Usage

1. **Login**: Select your role (Executive, Staff, Guard, Receptionist, or Admin)
2. **Schedule Visitors**: Staff can schedule new visitor appointments
3. **Approve Visits**: Executives can approve or reject visitor requests
4. **Check-in Visitors**: Guards can scan QR codes or manually validate passes
5. **Generate Passes**: Digital passes can be downloaded, shared via WhatsApp/SMS

## Data Persistence

All data is stored locally in the browser using localStorage. For production use, consider implementing a backend database.

## License

MIT License - Grand City HQ
