# Technical Specifications - Grand City HQ Guest Pass Management System

## System Architecture Overview

### Technology Stack

#### Frontend Technologies
- **React 18+**: Modern React with hooks and functional components
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Babel**: JavaScript compiler for JSX transformation
- **Local Libraries**: Self-hosted JavaScript libraries for offline capability

#### Backend Technologies (Supabase System)
- **Node.js 20 LTS**: Server-side JavaScript runtime
- **Express.js**: Web application framework
- **Supabase**: Backend-as-a-service with PostgreSQL database
- **Socket.io**: Real-time bidirectional communication

#### Database Technologies
- **PostgreSQL 15+**: Primary relational database
- **Redis**: Caching and session management
- **localStorage**: Client-side data persistence (demo system)

#### Third-Party Libraries
- **QRCode.js**: QR code generation and scanning
- **html2canvas**: Screenshot and image generation
- **jsQR**: QR code decoding from camera/images
- **Socket.io-client**: Real-time client communication

## Core System Components

### 1. Authentication System

#### Local Storage Implementation
```javascript
// Role-based authentication
const [user, setUser] = useState(null);
const [role, setRole] = useState('executive');

const handleLogin = () => {
    const userData = { 
        role, 
        executiveId: role === 'executive' ? selectedExec : null,
        loginTime: new Date().toISOString()
    };
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
};
```

#### Supabase Authentication
```javascript
// JWT-based authentication
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const login = async (email, password) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });
    return { data, error };
};
```

### 2. QR Code System

#### Generation Algorithm
```javascript
const generateQRCode = async (passData) => {
    const qrData = {
        passId: passData.id,
        visitorId: passData.visitorId,
        timestamp: Date.now(),
        validUntil: passData.validUntil
    };
    
    // Encrypt data for security
    const encryptedData = btoa(JSON.stringify(qrData));
    
    return new QRCode(container, {
        text: encryptedData,
        width: 256,
        height: 256,
        colorDark: "#1B4B84",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
    });
};
```

#### Scanning and Validation
```javascript
const scanQRCode = async (imageData) => {
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (code) {
        const decryptedData = JSON.parse(atob(code.data));
        return await validatePass(decryptedData);
    }
    
    return { valid: false, error: 'Invalid QR code' };
};

const validatePass = async (passData) => {
    // Check pass exists and is valid
    const pass = await getPassFromDatabase(passData.passId);
    
    if (!pass) return { valid: false, error: 'Pass not found' };
    if (pass.status !== 'active') return { valid: false, error: 'Pass not active' };
    if (Date.now() > pass.validUntil) return { valid: false, error: 'Pass expired' };
    
    return { valid: true, pass };
};
```

### 3. Database Schema

#### Core Tables

**Users Table**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('executive', 'staff', 'guard', 'admin', 'receptionist')),
    department VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Visitors Table**
```sql
CREATE TABLE visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    company VARCHAR(100),
    cnic VARCHAR(15),
    photo_url TEXT,
    is_blacklisted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Visits Table**
```sql
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID REFERENCES visitors(id),
    host_id UUID REFERENCES users(id),
    purpose TEXT,
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(100),
    meeting_room VARCHAR(50),
    number_of_guests INTEGER DEFAULT 1,
    has_vehicle BOOLEAN DEFAULT false,
    vehicle_registration VARCHAR(20),
    special_instructions TEXT,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'checked_in', 'completed', 'cancelled', 'no_show')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Passes Table**
```sql
CREATE TABLE passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES visits(id),
    pass_code VARCHAR(20) UNIQUE NOT NULL,
    qr_code_data TEXT,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    checked_in_by UUID REFERENCES users(id),
    checked_out_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Audit Logs Table**
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. API Endpoints

#### Authentication Endpoints
```javascript
POST /api/auth/login
Request: { email: string, password: string }
Response: { token: string, user: UserObject }

POST /api/auth/logout
Headers: { Authorization: Bearer <token> }
Response: { success: boolean }

GET /api/auth/me
Headers: { Authorization: Bearer <token> }
Response: { user: UserObject }
```

#### Visitor Management Endpoints
```javascript
GET /api/visitors
Query: { search?: string, limit?: number, offset?: number }
Response: { visitors: Visitor[], total: number }

POST /api/visitors
Request: { name: string, email?: string, phone?: string, company?: string, cnic?: string }
Response: { visitor: VisitorObject }

GET /api/visitors/:id
Response: { visitor: VisitorObject }

PUT /api/visitors/:id
Request: { name?: string, email?: string, phone?: string, company?: string, cnic?: string }
Response: { visitor: VisitorObject }
```

#### Visit Management Endpoints
```javascript
GET /api/visits
Query: { date?: string, status?: string, host_id?: string, limit?: number, offset?: number }
Response: { visits: Visit[], total: number }

POST /api/visits
Request: {
    visitor_id: string,
    host_id: string,
    purpose: string,
    scheduled_date: string,
    start_time: string,
    end_time: string,
    location?: string,
    meeting_room?: string,
    number_of_guests?: number,
    has_vehicle?: boolean,
    vehicle_registration?: string,
    special_instructions?: string
}
Response: { visit: VisitObject, pass: PassObject }

PUT /api/visits/:id/status
Request: { status: string, notes?: string }
Response: { visit: VisitObject }

POST /api/visits/:id/checkin
Request: { location?: string, notes?: string }
Response: { visit: VisitObject, pass: PassObject }

POST /api/visits/:id/checkout
Request: { notes?: string }
Response: { visit: VisitObject }
```

#### Pass Management Endpoints
```javascript
GET /api/passes/:passCode/validate
Response: { valid: boolean, pass?: PassObject, visit?: VisitObject, visitor?: VisitorObject }

POST /api/passes/:id/revoke
Request: { reason?: string }
Response: { success: boolean }

GET /api/passes/generate/:visitId
Response: { pass: PassObject }
```

#### Dashboard and Analytics Endpoints
```javascript
GET /api/dashboard/stats
Response: {
    totalVisitors: number,
    checkedInVisitors: number,
    todayVisits: number,
    pendingApprovals: number,
    weeklyTrends: Array,
    topVisitors: Array
}

GET /api/reports/weekly
Query: { start_date?: string, end_date?: string, executive_id?: string }
Response: { report: WeeklyReportObject }

GET /api/reports/executive-summary
Query: { executive_id: string, period?: string }
Response: { summary: ExecutiveSummaryObject }
```

### 5. Real-Time Communication

#### WebSocket Events
```javascript
// Client-side connection
const socket = io(SOCKET_URL, {
    auth: {
        token: localStorage.getItem('authToken')
    }
});

// Subscribe to visit updates
socket.on('visit:updated', (data) => {
    updateDashboard(data.visit);
    showNotification('Visit updated', data.message);
});

// Subscribe to new approvals
socket.on('approval:requested', (data) => {
    showApprovalNotification(data.visit);
});

// Subscribe to system alerts
socket.on('system:alert', (data) => {
    showAlert(data.type, data.message);
});
```

#### Server-Side Event Emission
```javascript
// Emit visit updates to relevant users
const emitVisitUpdate = (visit, userId) => {
    // Notify the host executive
    io.to(`user_${visit.host_id}`).emit('visit:updated', {
        visit,
        message: `Visitor ${visit.visitor.name} has checked in`
    });
    
    // Notify all guards
    io.to('role_guard').emit('visit:updated', {
        visit,
        message: 'Visitor status updated'
    });
    
    // Notify dashboard users
    io.to('dashboard_users').emit('dashboard:refresh', {
        stats: getUpdatedStats()
    });
};
```

### 6. Security Implementation

#### Content Security Policy
```javascript
// CSP Headers
const cspHeader = `
    default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com;
    img-src 'self' data: blob:;
    connect-src 'self' wss://your-domain.com https://your-supabase-domain.supabase.co;
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com;
    style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;
```

#### Data Encryption
```javascript
// Client-side encryption for sensitive data
const encryptData = (data, key) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
};

const decryptData = (encryptedData, key) => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};
```

#### API Security
```javascript
// Rate limiting
const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
});

// JWT validation middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};
```

### 7. Performance Optimization

#### Database Indexing
```sql
-- Performance indexes
CREATE INDEX idx_visits_scheduled_date ON visits(scheduled_date);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_host_id ON visits(host_id);
CREATE INDEX idx_visits_visitor_id ON visits(visitor_id);
CREATE INDEX idx_passes_pass_code ON passes(pass_code);
CREATE INDEX idx_passes_status ON passes(status);
CREATE INDEX idx_visitors_name ON visitors(name);
CREATE INDEX idx_visitors_company ON visitors(company);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

#### Caching Strategy
```javascript
// Redis caching implementation
const cacheMiddleware = (duration = 300) => {
    return async (req, res, next) => {
        const key = `cache:${req.originalUrl}`;
        const cachedData = await redisClient.get(key);
        
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }
        
        res.sendResponse = res.json;
        res.json = (body) => {
            redisClient.setex(key, duration, JSON.stringify(body));
            res.sendResponse(body);
        };
        
        next();
    };
};
```

#### Query Optimization
```javascript
// Optimized database queries with joins
const getVisitWithDetails = async (visitId) => {
    const query = `
        SELECT 
            v.*,
            visitor.name as visitor_name,
            visitor.email as visitor_email,
            visitor.company as visitor_company,
            visitor.photo_url as visitor_photo,
            host.name as host_name,
            host.department as host_department,
            p.pass_code,
            p.qr_code_data,
            p.valid_until,
            p.status as pass_status
        FROM visits v
        JOIN visitors visitor ON v.visitor_id = visitor.id
        JOIN users host ON v.host_id = host.id
        LEFT JOIN passes p ON v.id = p.visit_id
        WHERE v.id = $1
    `;
    
    const result = await pool.query(query, [visitId]);
    return result.rows[0];
};
```

### 8. Error Handling

#### Global Error Handler
```javascript
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    // Database errors
    if (err.code === '23505') { // Unique constraint violation
        return res.status(409).json({ 
            error: 'Duplicate entry',
            message: 'This record already exists' 
        });
    }
    
    if (err.code === '23503') { // Foreign key constraint violation
        return res.status(400).json({ 
            error: 'Invalid reference',
            message: 'Referenced record does not exist' 
        });
    }
    
    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({ 
            error: 'Validation failed',
            message: err.message 
        });
    }
    
    // Default error
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong' 
    });
};
```

#### Client-Side Error Handling
```javascript
const handleApiError = (error) => {
    if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;
        
        switch (status) {
            case 400:
                showNotification('error', data.message || 'Invalid request');
                break;
            case 401:
                showNotification('error', 'Authentication required');
                redirectToLogin();
                break;
            case 403:
                showNotification('error', 'Access denied');
                break;
            case 404:
                showNotification('error', 'Resource not found');
                break;
            case 409:
                showNotification('warning', data.message || 'Duplicate entry');
                break;
            case 500:
                showNotification('error', 'Server error. Please try again');
                break;
            default:
                showNotification('error', 'An error occurred');
        }
    } else if (error.request) {
        // Request made but no response
        showNotification('error', 'Network error. Please check your connection');
    } else {
        // Something else happened
        showNotification('error', 'An unexpected error occurred');
    }
};
```

### 9. Testing Implementation

#### Unit Testing
```javascript
// Example test for QR code generation
describe('QR Code Generation', () => {
    test('should generate valid QR code', async () => {
        const passData = {
            passId: 'test-pass-123',
            visitorId: 'visitor-456',
            validUntil: Date.now() + 3600000
        };
        
        const qrCode = await generateQRCode(passData);
        
        expect(qrCode).toBeDefined();
        expect(qrCode._htOption.width).toBe(256);
        expect(qrCode._htOption.height).toBe(256);
    });
    
    test('should encrypt QR data', async () => {
        const passData = { passId: 'test-123' };
        const qrCode = await generateQRCode(passData);
        
        // Simulate scanning
        const scannedData = await scanQRCode(qrCode._oQRCode.modules);
        
        expect(scannedData.passId).toBe('test-123');
    });
});
```

#### Integration Testing
```javascript
// API endpoint testing
describe('Visit Management API', () => {
    test('should create new visit', async () => {
        const visitData = {
            visitor_id: 'test-visitor-123',
            host_id: 'test-host-456',
            purpose: 'Business meeting',
            scheduled_date: '2024-12-10',
            start_time: '14:00',
            end_time: '15:30'
        };
        
        const response = await request(app)
            .post('/api/visits')
            .set('Authorization', `Bearer ${authToken}`)
            .send(visitData);
        
        expect(response.status).toBe(201);
        expect(response.body.visit).toBeDefined();
        expect(response.body.pass).toBeDefined();
    });
});
```

### 10. Deployment Configuration

#### Environment Variables
```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://host:port

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRY=24h

# Email Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
SES_FROM_EMAIL=noreply@grandcityhq.com

# Application Configuration
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.grandcityhq.com
CLIENT_URL=https://guestpass.grandcityhq.com
```

#### Docker Configuration
```dockerfile
# Multi-stage build for production
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
    
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=grandcity_guestpass
      - POSTGRES_USER=grandcity
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 11. Monitoring and Logging

#### Application Monitoring
```javascript
// Winston logger configuration
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'guest-pass-system' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// Request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('API Request', {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            userId: req.user?.id
        });
    });
    
    next();
};
```

#### Health Checks
```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            database: 'unknown',
            redis: 'unknown',
            supabase: 'unknown'
        }
    };
    
    try {
        // Check database connection
        await pool.query('SELECT 1');
        health.services.database = 'healthy';
    } catch (error) {
        health.services.database = 'unhealthy';
        health.status = 'degraded';
    }
    
    try {
        // Check Redis connection
        await redisClient.ping();
        health.services.redis = 'healthy';
    } catch (error) {
        health.services.redis = 'unhealthy';
        health.status = 'degraded';
    }
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
});
```

This technical specification provides a comprehensive overview of the system's architecture, implementation details, and deployment considerations. The system is designed to be scalable, secure, and maintainable while providing excellent performance for the guest pass management requirements.