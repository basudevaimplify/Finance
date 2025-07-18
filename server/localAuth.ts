import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Simple local authentication for development
export function getLocalSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Use memory store if no database URL provided
  if (!process.env.DATABASE_URL) {
    return session({
      secret: process.env.SESSION_SECRET || 'local-dev-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false, // false for local development
        maxAge: sessionTtl,
      },
    });
  }

  // Use PostgreSQL store if database is available
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true, // Auto-create sessions table
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET || 'local-dev-secret-key-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // false for local development
      maxAge: sessionTtl,
    },
  });
}

export function setupLocalAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getLocalSession());

  // Simple login endpoint for local development
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Simple validation for demo purposes
      if (email && password) {
        // In production, validate credentials against database
        const user = {
          id: 'demo-user',
          email: email,
          firstName: 'Demo',
          lastName: 'User',
        };

        // Store in session
        (req.session as any).user = user;
        
        // Return JWT-like token for compatibility
        const token = Buffer.from(JSON.stringify({
          userId: user.id,
          email: user.email
        })).toString('base64');

        res.json({ 
          success: true, 
          token,
          user 
        });
      } else {
        res.status(400).json({ message: "Email and password required" });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // User info endpoint
  app.get("/api/auth/user", (req, res) => {
    const user = (req.session as any)?.user;
    if (user) {
      res.json({ user });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });
}

export const isLocalAuthenticated: RequestHandler = async (req, res, next) => {
  // Check for JWT token in Authorization header (for API compatibility)
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      // Decode the base64 token to get user info
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const userData = JSON.parse(decoded);
      
      if (userData.userId && userData.email) {
        // Attach user info to request for compatibility
        req.user = {
          claims: {
            sub: userData.userId,
            email: userData.email
          }
        };
        return next();
      }
    } catch (error) {
      console.error('JWT token decode error:', error);
    }
  }

  // Check session-based authentication
  const sessionUser = (req.session as any)?.user;
  if (sessionUser) {
    req.user = {
      claims: {
        sub: sessionUser.id,
        email: sessionUser.email
      }
    };
    return next();
  }

  // For development, allow demo user access
  if (process.env.NODE_ENV === 'development') {
    req.user = {
      claims: {
        sub: 'demo-user',
        email: 'demo@example.com'
      }
    };
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
};