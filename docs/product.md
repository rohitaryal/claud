# Claud - Cloud-Based File Storage System

## Product Overview

**Claud** (pronounced _/klɔːd/_) is a modern, cloud-based file storage system designed as an alternative to traditional services like Google Drive. Built with performance, security, and user experience in mind, Claud provides a comprehensive solution for personal and collaborative file management.

---

## Key Features

### 1. **Secure File Storage**
- Upload and store files of any type
- Automatic encryption at rest
- Secure file transmission over HTTPS
- Per-user isolated storage buckets

### 2. **User Management**
- Secure user registration and authentication
- Session-based authentication with automatic expiration
- Password hashing using industry-standard algorithms
- Email and username-based login

### 3. **File Organization**
- Hierarchical folder structure
- Root-level and nested folders support
- Soft delete with recovery options
- File metadata tracking (size, type, timestamps)

### 4. **File Sharing**
- Share files with specific users
- Public link sharing with optional expiration
- Granular permission levels (read, write, admin)
- Shareable tokens for anonymous access

### 5. **Modern Architecture**
- Fast, responsive React-based frontend
- High-performance Hono.js backend
- PostgreSQL for reliable data storage
- Docker-based deployment for easy setup

---

## Technology Stack

### Frontend
- **React** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe development
- **Modern CSS** - Responsive design

### Backend
- **Hono.js** - Ultra-fast web framework
- **Node.js/Bun** - JavaScript runtime
- **TypeScript** - Type-safe server code
- **PostgreSQL** - Relational database

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Service orchestration
- **PostgreSQL 16** - Database server

---

## Architecture

### System Components

```
┌─────────────────┐
│   Web Browser   │
│   (Frontend)    │
└────────┬────────┘
         │ HTTP/HTTPS
         │
┌────────▼────────┐
│   Hono.js API   │
│    (Backend)    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼────┐ ┌─▼──────────┐
│  File  │ │ PostgreSQL │
│Storage │ │  Database  │
└────────┘ └────────────┘
```

### Data Flow

1. **User Registration/Login**
   - User submits credentials via frontend
   - Backend validates and creates session
   - Session token stored in secure cookie
   - User data retrieved from PostgreSQL

2. **File Upload**
   - User selects file in frontend
   - File sent to backend via multipart form
   - Backend validates and stores file
   - Metadata saved to PostgreSQL
   - File stored in user's bucket

3. **File Sharing**
   - User initiates share via frontend
   - Backend creates share record in database
   - Share token/link generated
   - Recipient gains access based on permissions

---

## Database Schema

The system uses a well-designed relational schema with four main tables:

### Core Tables
1. **users** - User accounts and authentication
2. **sessions** - Active user sessions
3. **files** - File metadata and organization
4. **file_shares** - Sharing and permissions

For detailed schema information, see [schema.md](./schema.md).

---

## Security Features

### Authentication
- **Secure password hashing** using bcrypt/argon2
- **Session-based authentication** with automatic expiration
- **HTTP-only cookies** to prevent XSS attacks
- **IP and user agent tracking** for anomaly detection

### Data Protection
- **UUID-based user IDs** never exposed in public APIs
- **Parameterized SQL queries** to prevent SQL injection
- **File access validation** before any operation
- **Soft delete** with recovery period before permanent deletion

### File Security
- **Isolated storage buckets** per user
- **Permission-based access control** (read/write/admin)
- **Encrypted connections** for all data transmission
- **Share token expiration** for temporary access

---

## API Structure

### Authentication Endpoints
- `POST /auth/register` - Create new user account
- `POST /auth/login` - Authenticate user
- `POST /auth/logout` - End user session
- `GET /auth/me` - Get current user info

### File Management Endpoints
- `POST /files/upload` - Upload new file
- `GET /files` - List user's files
- `GET /files/:id` - Get file details
- `GET /files/:id/download` - Download file
- `DELETE /files/:id` - Delete file (soft delete)
- `PUT /files/:id` - Update file metadata

### Sharing Endpoints
- `POST /files/:id/share` - Share file with user
- `POST /files/:id/share/public` - Create public share link
- `GET /share/:token` - Access shared file
- `DELETE /share/:id` - Remove share access

---

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ or Bun
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rohitaryal/claud.git
   cd claud
   ```

2. **Start the services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - PostgreSQL: localhost:5432

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_HOST=localhost
DB_NAME=claud
DB_USER=claud
DB_PASSWORD=claud_password
DB_PORT=5432

# Application Settings
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-secret-key-here

# File Storage
STORAGE_PATH=/var/claud/storage
MAX_FILE_SIZE=104857600  # 100MB in bytes
```

### Development

**Backend Development:**
```bash
cd backend
npm install
npm run dev
```

**Frontend Development:**
```bash
cd frontend
npm install
npm run dev
```

---

## Project Structure

```
claud/
├── backend/              # Backend API server
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   │   └── db.ts    # Database configuration
│   │   ├── middlewares/ # Express middlewares
│   │   │   └── auth.ts  # Authentication middleware
│   │   ├── types/       # TypeScript type definitions
│   │   │   └── user.ts  # User type definitions
│   │   ├── utils/       # Utility functions
│   │   │   ├── db.ts    # Database utilities
│   │   │   └── cookie.ts # Cookie utilities
│   │   └── index.ts     # Application entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/            # React frontend application
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── docs/                # Documentation
│   ├── SRS.pdf         # Software Requirements Specification
│   ├── schema.md       # Database schema documentation
│   └── product.md      # This file
├── docker-compose.yaml  # Docker services configuration
└── README.md           # Project overview
```

---

## Use Cases

### Personal File Storage
- Upload documents, photos, and videos
- Organize files in folders
- Access files from any device
- Download files when needed

### Team Collaboration
- Share files with team members
- Set different permission levels
- Track file versions
- Manage shared folder access

### Public File Sharing
- Create public links for files
- Set expiration dates for shares
- Share with non-registered users
- Track file access

---

## Roadmap

### Phase 1: Core Features ✅
- User authentication
- File upload/download
- Basic file organization
- Database schema

### Phase 2: Enhanced Features (Planned)
- File search functionality
- Advanced folder management
- File preview support
- Drag-and-drop upload

### Phase 3: Collaboration (Planned)
- Real-time file sharing
- User groups and teams
- Commenting on files
- Activity notifications

### Phase 4: Advanced Features (Planned)
- File versioning
- Storage quotas
- Admin dashboard
- Usage analytics

---

## Contributing

This project is developed by a team of students as a learning project. Team members:

1. Rohit Sharma
2. Prajwal Jha
3. Aniket Sah
4. Pradeep Kumar Kohar
5. Awadesh Gupta Kaulapuri
6. Nagendra Thakur

### Contribution Guidelines
- Follow the commit guidelines in README.md
- Write descriptive commit messages
- Test your changes thoroughly
- Document new features
- Use TypeScript for type safety

---

## Performance Considerations

### Database Optimization
- Indexed columns for fast queries
- Connection pooling for efficiency
- Prepared statements to prevent SQL injection
- Efficient query design

### File Handling
- Streaming for large files
- Chunk-based uploads
- Efficient storage organization
- Soft delete for recovery

### Frontend Performance
- React lazy loading
- Optimized build with Vite
- Code splitting
- Asset optimization

---

## Monitoring and Maintenance

### Database Maintenance
- Regular backups (automated)
- Session cleanup (expired sessions)
- Soft-deleted file cleanup (after retention period)
- Index optimization

### Security Updates
- Regular dependency updates
- Security patch application
- Vulnerability scanning
- Access log monitoring

---

## Support and Documentation

- **Technical Documentation**: See `/docs` folder
- **API Documentation**: Coming soon
- **Issue Tracking**: GitHub Issues
- **Code Repository**: https://github.com/rohitaryal/claud

---

## License

This project is licensed under the terms specified in the LICENSE file.

---

## Acknowledgments

Built with modern web technologies and best practices for security, performance, and maintainability. Special thanks to the open-source community for the amazing tools and libraries that make this project possible.

---

**Version**: 1.0.0  
**Last Updated**: November 2024  
**Status**: Active Development
