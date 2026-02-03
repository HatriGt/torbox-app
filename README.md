# TorBox Manager

A modern, power-user focused alternative to the default TorBox UI. Built with Next.js for speed and efficiency.

## Features

### Core Download Management

- **Batch Upload**: Upload multiple torrent or NZB files and supported hoster or magnet links with a single click
- **Smart Downloads**: Cherry-pick specific files across multiple torrents
- **Multi-Format Support**: Manage torrents, Usenet (NZB), and web downloads all in one interface
- **File Selection**: Selectively download individual files from torrents
- **Download History**: Track and manage your download links with expiration tracking
- **Shareable Download Links**: Create redirect links (e.g. `your-domain.com/dl/abc123`) that point to the real file without using your VPS bandwidth; when the underlying link expires, visitors see a custom "link expired" message instead of the TorBox site (requires backend)
- **Archived Downloads**: View and manage your archived download items

### Search & Discovery

- **Smart Search**: Search across multiple torrent sites directly from the interface
- **RSS Feed Management**:
  - Add and manage multiple RSS feeds
  - Automatic filtering with custom rules (title, description, category)
  - Auto-download based on filters

### Automation

- **Automation Rules**: Create smart automation rules for torrent management
- **Server-Side 24/7 Automation**: Multi-user backend with persistent storage
  - Each user's automation rules run continuously on the server
  - Per-user API key storage (encrypted)
  - SQLite database for data persistence
  - Rules execute independently for each user

### User Experience

- **Customizable Interface**: 
  - Resizable columns
  - Customizable table views
  - Card and list view modes
  - Status filtering
- **Multiple API Key Management**: Switch between multiple TorBox API keys
- **Notifications**: Real-time notification system for download events
- **Speed Charts**: Visualize download/upload speeds with interactive charts
- **Dark Mode**: Built-in dark mode support
- **Progressive Web App (PWA)**: Install as a standalone app
- **File Handler**: Direct file handling for `.torrent` and `.nzb` files

### User Management

- **User Profile**: View account information and settings
- **User Stats**: Track usage statistics

### Internationalization

- **Multi-Language Support**: Available in 6 languages
  - English (en)
  - German (de)
  - Spanish (es)
  - French (fr)
  - Japanese (ja)
  - Polish (pl)

## Getting Started

### Docker Deployment (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/jittarao/torbox-app.git
cd torbox-app
```

2. Set required environment variables (create a `.env` file or export them):
```bash
# Required: Your public application URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
FRONTEND_URL=https://your-domain.com

# Required: Encryption key for API key storage (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your_32_byte_hex_encryption_key_here
```

3. Start the application:
```bash
docker compose up -d
```

4. Open your application URL and login with your TorBox API key.

**Default Ports:**
- Frontend: `3003` (mapped from container port 3000)
- Backend: `3004` (mapped from container port 3001)

**Note**: The backend is enabled by default. Each user logs in with their own TorBox API key, and their automation rules run 24/7 on the server.

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/jittarao/torbox-app.git
cd torbox-app
```

2. Install dependencies:
```bash
bun install
```

3. Run the development server:
```bash
bun run dev
```

4. Open [http://localhost:3000](http://localhost:3000) and login with your TorBox API key to begin.

## Deployment Architecture

The application uses a **multi-user backend architecture**:

- **Frontend**: Next.js application (port 3003 by default)
- **Backend**: Express.js server with SQLite database (port 3004 by default)
- **User Authentication**: Each user logs in with their own TorBox API key
- **Per-User Storage**: API keys are encrypted and stored per user
- **24/7 Automation**: Each user's automation rules run independently on the server

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_APP_URL` | Public URL of your application | - | Yes |
| `FRONTEND_URL` | Frontend URL for CORS (usually same as NEXT_PUBLIC_APP_URL) | - | Yes |
| `ENCRYPTION_KEY` | 32-byte hex key for encrypting user API keys | - | Yes |
| `BACKEND_URL` | Backend URL (internal, for frontend communication) | `http://torbox-backend:3001` | No |
| `BACKEND_DISABLED` | Disable backend (set to `true` for frontend-only mode) | `false` | No |

**Generate Encryption Key:**
```bash
openssl rand -hex 32
```

### User Authentication & API Key Setup

1. Users visit your application URL
2. Each user enters their own TorBox API key to login
3. API keys are validated and encrypted before storage
4. Each user's automation rules are stored separately
5. Rules run 24/7 on the server using each user's API key

**Getting a TorBox API Key:**
- Visit [torbox.app/settings](https://torbox.app/settings)
- Generate your API key
- Use it to login to the application

## Requirements

- **Docker Deployment**:
  - Docker and Docker Compose
  - Domain name (for production) or localhost (for development)
  - Encryption key (generate with `openssl rand -hex 32`)

- **Local Development**:
  - Node.js 18.0 or later (or Bun)
  - TorBox API key (users provide their own)

## Tech Stack

### Frontend
- **Next.js 15** with App Router
- **React 19** with hooks
- **Tailwind CSS** for styling
- **Zustand** for state management
- **next-intl** for internationalization
- **Chart.js** for data visualization
- **@dnd-kit** for drag-and-drop functionality
- **next-pwa** for Progressive Web App support

### Backend
- **Express.js** web framework
- **SQLite** for local database with per-user data isolation
- **node-cron** for task scheduling (per-user automation engines)
- **Helmet** for security headers
- **CORS** for cross-origin requests
- **Multi-user authentication** with encrypted API key storage

## Project Structure

```
torbox-app/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── [locale]/     # Internationalized routes
│   │   └── api/          # API route handlers
│   ├── components/       # React components
│   │   ├── downloads/      # Download management components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── i18n/             # Internationalization config
│   ├── stores/           # Zustand stores
│   └── utils/            # Utility functions
├── backend/              # Multi-user backend server
│   ├── src/
│   │   ├── automation/   # Per-user automation engines
│   │   ├── database/     # Database, migrations, and user management
│   │   └── api/          # TorBox API client
└── public/               # Static assets
```

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure all new features are properly internationalized

## License

[GNU Affero General Public License v3.0](https://choosealicense.com/licenses/agpl-3.0/)

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

Built with ❤️ for the TorBox community.