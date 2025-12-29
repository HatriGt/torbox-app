import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

import Database from './database/Database.js';
import AutomationEngine from './automation/AutomationEngine.js';
import ApiClient from './api/ApiClient.js';

class TorBoxBackend {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.database = new Database();
    // Store automation engines per user
    this.userEngines = new Map();
    // Encryption key for API keys (should be in env in production)
    this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    
    this.setupMiddleware();
    this.setupRoutes();
    this.initializeServices();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Disable for API
      crossOriginEmbedderPolicy: false
    }));
    
    // CORS configuration
    const allowedOrigins = process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',')
      : ['http://localhost:3000'];
    this.app.use(cors({
      origin: allowedOrigins,
      credentials: true
    }));
    
    // Compression
    this.app.use(compression());
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use('/api/', limiter);
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  // Helper methods for user management
  getUserIdFromApiKey(apiKey) {
    return crypto.createHash('sha256').update(apiKey).digest('hex').substring(0, 32);
  }

  encryptApiKey(apiKey) {
    // Use AES-256-GCM with random salt per encryption
    const algorithm = 'aes-256-gcm';
    // Generate random salt for each encryption
    const salt = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.encryptionKey, salt, 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      salt: salt.toString('hex'),  // Store salt with encrypted data
      iv: iv.toString('hex'),
      encrypted: encrypted,
      authTag: authTag.toString('hex')
    });
  }

  decryptApiKey(encryptedData) {
    try {
      const data = JSON.parse(encryptedData);
      const algorithm = 'aes-256-gcm';
      // Use the salt stored with the encrypted data
      const salt = Buffer.from(data.salt, 'hex');
      const key = crypto.scryptSync(this.encryptionKey, salt, 32);
      const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(data.iv, 'hex'));
      decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
      
      let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Error decrypting API key:', error);
      throw new Error('Failed to decrypt API key');
    }
  }

  createSessionToken(userId) {
    // Simple token (use JWT in production)
    return Buffer.from(`${userId}:${Date.now()}`).toString('base64');
  }

  // Authentication middleware
  authenticateUser = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.body.apiKey;
    if (!apiKey) {
      return res.status(401).json({ success: false, error: 'API key required' });
    }

    const userId = this.getUserIdFromApiKey(apiKey);
    req.userId = userId;
    req.apiKey = apiKey;
    next();
  };

  setupRoutes() {
    // Health check
    this.app.get('/api/backend/status', (req, res) => {
      res.json({ 
        available: true, 
        mode: 'selfhosted',
        version: process.env.npm_package_version || '0.1.0',
        uptime: process.uptime()
      });
    });

    // Health check for Docker
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // User authentication/login endpoint
    this.app.post('/api/auth/login', async (req, res) => {
      try {
        const { apiKey } = req.body;
        
        if (!apiKey) {
          return res.status(400).json({ success: false, error: 'API key is required' });
        }

        // Validate API key by making a test request
        const testClient = new ApiClient(apiKey);
        try {
          await testClient.getTorrents();
        } catch (error) {
          return res.status(401).json({ 
            success: false, 
            error: 'Invalid API key' 
          });
        }

        // Create user ID from API key hash
        const userId = this.getUserIdFromApiKey(apiKey);
        
        // Store encrypted API key
        const encryptedKey = this.encryptApiKey(apiKey);
        await this.database.saveUserApiKey(userId, apiKey, encryptedKey);

        // Initialize automation engine for this user if not exists
        if (!this.userEngines.has(userId)) {
          const userApiClient = new ApiClient(apiKey);
          const userEngine = new AutomationEngine(this.database, userApiClient, userId);
          await userEngine.initialize();
          this.userEngines.set(userId, userEngine);
        }

        // Return session token
        const sessionToken = this.createSessionToken(userId);
        
        res.json({ 
          success: true, 
          userId,
          sessionToken,
          message: 'Login successful' 
        });
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Automation rules endpoints (now per-user)
    this.app.get('/api/automation/rules', this.authenticateUser, async (req, res) => {
      try {
        const rules = await this.database.getAutomationRules(req.userId);
        // Transform database structure to match frontend expectations
        const transformedRules = rules.map(rule => ({
          id: rule.id,
          name: rule.name,
          enabled: rule.enabled === 1,
          trigger: rule.trigger_config,
          conditions: rule.conditions,
          logicOperator: rule.logic_operator || 'and',
          action: rule.action_config,
          metadata: rule.metadata,
          created_at: rule.created_at,
          updated_at: rule.updated_at
        }));
        res.json({ success: true, rules: transformedRules });
      } catch (error) {
        console.error('Error fetching automation rules:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/automation/rules', this.authenticateUser, async (req, res) => {
      try {
        const { rules } = req.body;
        await this.database.saveAutomationRules(rules, req.userId);
        
        // Reload rules for this user's engine
        if (this.userEngines.has(req.userId)) {
          await this.userEngines.get(req.userId).reloadRules();
        } else {
          // Create new engine for this user
          const userApiClient = new ApiClient(req.apiKey);
          const userEngine = new AutomationEngine(this.database, userApiClient, req.userId);
          await userEngine.initialize();
          this.userEngines.set(req.userId, userEngine);
        }
        
        res.json({ success: true, message: 'Rules saved successfully' });
      } catch (error) {
        console.error('Error saving automation rules:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Individual rule operations
    this.app.put('/api/automation/rules/:id', this.authenticateUser, async (req, res) => {
      try {
        const ruleId = parseInt(req.params.id);
        const { enabled } = req.body;
        
        if (enabled !== undefined) {
          await this.database.updateRuleStatus(ruleId, enabled, req.userId);
          
          // Reload rules for this user
          if (this.userEngines.has(req.userId)) {
            await this.userEngines.get(req.userId).reloadRules();
          }
          
          res.json({ success: true, message: 'Rule updated successfully' });
        } else {
          res.status(400).json({ success: false, error: 'Missing enabled field' });
        }
      } catch (error) {
        console.error('Error updating rule:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.delete('/api/automation/rules/:id', this.authenticateUser, async (req, res) => {
      try {
        const ruleId = parseInt(req.params.id);
        await this.database.deleteRule(ruleId, req.userId);
        
        // Reload rules for this user
        if (this.userEngines.has(req.userId)) {
          await this.userEngines.get(req.userId).reloadRules();
        }
        
        res.json({ success: true, message: 'Rule deleted successfully' });
      } catch (error) {
        console.error('Error deleting rule:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Rule execution logs endpoint - NOW WITH AUTHENTICATION
    this.app.get('/api/automation/rules/:id/logs', this.authenticateUser, async (req, res) => {
      try {
        const ruleId = parseInt(req.params.id);
        // Get logs for this rule, but only if user owns the rule
        const logs = await this.database.getRuleExecutionHistory(ruleId, req.userId);
        res.json({ success: true, logs });
      } catch (error) {
        console.error('Error fetching rule logs:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // API key status endpoint (for backward compatibility)
    this.app.get('/api/backend/api-key/status', this.authenticateUser, async (req, res) => {
      try {
        const hasEngine = this.userEngines.has(req.userId);
        const automationStatus = hasEngine ? this.userEngines.get(req.userId).getStatus() : null;
        
        res.json({ 
          success: true, 
          hasApiKey: true,
          automationEngine: automationStatus
        });
      } catch (error) {
        console.error('Error checking API key status:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Download history endpoints - NOW WITH AUTHENTICATION AND USER SCOPING
    this.app.get('/api/downloads/history', this.authenticateUser, async (req, res) => {
      try {
        const history = await this.database.getDownloadHistory(req.userId);
        res.json({ success: true, history });
      } catch (error) {
        console.error('Error fetching download history:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/downloads/history', this.authenticateUser, async (req, res) => {
      try {
        const { history } = req.body;
        await this.database.saveDownloadHistory(history, req.userId);
        res.json({ success: true, message: 'Download history saved successfully' });
      } catch (error) {
        console.error('Error saving download history:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Generic storage endpoints - NOW WITH AUTHENTICATION AND USER SCOPING
    this.app.get('/api/storage/:key', this.authenticateUser, async (req, res) => {
      try {
        const { key } = req.params;
        
        // Validate key to prevent path traversal
        if (!key || key.includes('..') || key.includes('/') || key.includes('\\')) {
          return res.status(400).json({ success: false, error: 'Invalid key format' });
        }
        
        const value = await this.database.getStorageValue(key, req.userId);
        res.json({ success: true, value });
      } catch (error) {
        console.error(`Error fetching storage value for key ${req.params.key}:`, error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/storage/:key', this.authenticateUser, async (req, res) => {
      try {
        const { key } = req.params;
        
        // Validate key to prevent path traversal
        if (!key || key.includes('..') || key.includes('/') || key.includes('\\')) {
          return res.status(400).json({ success: false, error: 'Invalid key format' });
        }
        
        const { value } = req.body;
        await this.database.setStorageValue(key, value, req.userId);
        res.json({ success: true, message: 'Value saved successfully' });
      } catch (error) {
        console.error(`Error saving storage value for key ${req.params.key}:`, error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Error handling middleware
    this.app.use((error, req, res, next) => {
      console.error('Unhandled error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ 
        success: false, 
        error: 'Endpoint not found',
        path: req.originalUrl
      });
    });
  }

  async initializeServices() {
    try {
      // Initialize database
      await this.database.initialize();
      console.log('Database initialized');

      // Load all users and initialize their engines
      const users = await this.database.getAllUsers();
      for (const user of users) {
        try {
          const apiKey = this.decryptApiKey(user.encrypted_api_key);
          const apiClient = new ApiClient(apiKey);
          const engine = new AutomationEngine(this.database, apiClient, user.id);
          await engine.initialize();
          this.userEngines.set(user.id, engine);
          console.log(`Initialized automation engine for user: ${user.id}`);
        } catch (error) {
          console.error(`Failed to initialize engine for user ${user.id}:`, error);
        }
      }

      console.log(`TorBox Backend started successfully with ${this.userEngines.size} user(s)`);
    } catch (error) {
      console.error('Failed to initialize services:', error);
      process.exit(1);
    }
  }

  start() {
    this.app.listen(this.port, '0.0.0.0', () => {
      console.log(`TorBox Backend running on port ${this.port}`);
      console.log(`Health check: http://localhost:${this.port}/health`);
      console.log(`Backend status: http://localhost:${this.port}/api/backend/status`);
    });
  }
}

// Start the server
const backend = new TorBoxBackend();
backend.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default TorBoxBackend;