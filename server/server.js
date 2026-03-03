const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');
const cron = require('node-cron');
const axios = require('axios');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage (replace with database in production)
let alerts = [];
let users = new Map();
let statistics = {
  totalAlerts: 0,
  alertsByType: {},
  alertsBySeverity: {},
  activeUsers: 0
};

// Mock data sources (replace with real APIs)
const dataSources = [
  {
    name: 'IDF Spokesperson',
    url: process.env.IDF_API_URL,
    type: 'official',
    enabled: true
  },
  {
    name: 'Red Alert API',
    url: process.env.RED_ALERT_API_URL,
    type: 'rocket',
    enabled: true
  }
];

// Fetch alerts from external sources
const fetchAlertsFromSources = async () => {
  console.log('Fetching alerts from sources...', new Date().toISOString());
  
  for (const source of dataSources) {
    if (!source.enabled) continue;
    
    try {
      // Simulate API call (replace with actual API calls)
      // const response = await axios.get(source.url);
      // const newAlerts = processAlerts(response.data, source);
      
      // Generate mock alerts for demonstration
      const mockAlert = generateMockAlert(source);
      
      if (mockAlert) {
        alerts.unshift(mockAlert);
        statistics.totalAlerts++;
        statistics.alertsByType[mockAlert.type] = (statistics.alertsByType[mockAlert.type] || 0) + 1;
        statistics.alertsBySeverity[mockAlert.severity] = (statistics.alertsBySeverity[mockAlert.severity] || 0) + 1;
        
        // Keep only last 100 alerts
        if (alerts.length > 100) {
          alerts.pop();
        }
        
        // Emit to all connected clients
        io.emit('new-alert', mockAlert);
        console.log('New alert emitted:', mockAlert.title);
      }
    } catch (error) {
      console.error(`Error fetching from ${source.name}:`, error.message);
    }
  }
};

// Generate mock alert for testing
const generateMockAlert = (source) => {
  const types = ['rocket', 'drone', 'ground', 'air'];
  const severities = ['high', 'medium', 'low'];
  const locations = ['Northern District', 'Southern District', 'Central District', 'Gaza Envelope', 'Golan Heights'];
  
  const type = types[Math.floor(Math.random() * types.length)];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  
  return {
    id: Date.now() + Math.random(),
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Alert`,
    description: `${type.charAt(0).toUpperCase() + type.slice(1)} attack detected in the area. Seek shelter immediately.`,
    detailedDescription: `Multiple ${type} launches detected. Take cover and stay in protected space until further notice. Follow instructions from local authorities.`,
    type: type,
    severity: severity,
    location: locations[Math.floor(Math.random() * locations.length)],
    coordinates: {
      latitude: 31.0461 + (Math.random() - 0.5) * 0.5,
      longitude: 34.8516 + (Math.random() - 0.5) * 0.5
    },
    radius: Math.floor(Math.random() * 5000) + 2000,
    time: new Date().toLocaleTimeString(),
    timestamp: new Date().toISOString(),
    source: source.name,
    verified: true
  };
};

// Schedule alert fetching
cron.schedule('*/1 * * * *', fetchAlertsFromSources); // Every minute

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/alerts', (req, res) => {
  const { limit = 50, type, severity } = req.query;
  
  let filteredAlerts = [...alerts];
  
  if (type) {
    filteredAlerts = filteredAlerts.filter(a => a.type === type);
  }
  
  if (severity) {
    filteredAlerts = filteredAlerts.filter(a => a.severity === severity);
  }
  
  res.json(filteredAlerts.slice(0, parseInt(limit)));
});

app.get('/api/alerts/nearby', (req, res) => {
  const { lat, lng, radius = 50 } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude required' });
  }
  
  const nearbyAlerts = alerts.filter(alert => {
    if (alert.coordinates) {
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        alert.coordinates.latitude,
        alert.coordinates.longitude
      );
      return distance <= parseFloat(radius);
    }
    return false;
  });
  
  res.json(nearbyAlerts);
});

app.get('/api/statistics', (req, res) => {
  res.json({
    ...statistics,
    activeUsers: users.size,
    lastUpdate: new Date().toISOString()
  });
});

app.post('/api/alerts/report', (req, res) => {
  const alertData = req.body;
  
  // Validate alert data
  if (!alertData.type || !alertData.location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Add metadata
  const newAlert = {
    ...alertData,
    id: Date.now(),
    timestamp: new Date().toISOString(),
    verified: false, // Requires verification
    source: 'user-reported'
  };
  
  // Store in database (mock)
  alerts.unshift(newAlert);
  
  // Notify admins (mock)
  console.log('New user report:', newAlert);
  
  res.status(201).json({ 
    message: 'Alert reported successfully',
    alert: newAlert 
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Store user connection
  users.set(socket.id, {
    connectedAt: new Date(),
    lastActivity: new Date()
  });
  
  statistics.activeUsers = users.size;
  
  // Send recent alerts to new client
  socket.emit('recent-alerts', alerts.slice(0, 20));
  
  // Send initial statistics
  socket.emit('statistics', statistics);
  
  // Handle client events
  socket.on('subscribe-to-type', (type) => {
    socket.join(`type-${type}`);
    console.log(`Client ${socket.id} subscribed to ${type} alerts`);
  });
  
  socket.on('unsubscribe-from-type', (type) => {
    socket.leave(`type-${type}`);
  });
  
  socket.on('request-location-updates', (location) => {
    // Handle location-based subscriptions
    users.set(socket.id, {
      ...users.get(socket.id),
      location: location
    });
  });
  
  socket.on('ping', () => {
    socket.emit('pong');
    users.set(socket.id, {
      ...users.get(socket.id),
      lastActivity: new Date()
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    users.delete(socket.id);
    statistics.activeUsers = users.size;
  });
});

// Helper function to calculate distance between coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
  
  // Initial data fetch
  fetchAlertsFromSources();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
