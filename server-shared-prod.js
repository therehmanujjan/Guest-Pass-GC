const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'production';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "https://aluaqwyioopnizdoevbf.supabase.co"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://aluaqwyioopnizdoevbf.supabase.co", "wss://aluaqwyioopnizdoevbf.supabase.co"],
      fontSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Trust proxy for Vercel deployment
  trustProxy: true
});
app.use('/api', limiter);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Supabase client
const supabaseUrl = 'https://aluaqwyioopnizdoevbf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdWFxd3lpb29wbml6ZG9ldmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjA2ODIsImV4cCI6MjA3NDA5NjY4Mn0.e8QecFn2uhFsA8E99v-KEdIqdpJE4YS367jl2pTq3Rc';

const supabase = createClient(supabaseUrl, supabaseKey);

// Serve static files
app.use(express.static(__dirname));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Visitors API endpoints
app.get('/api/visitors', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('visitors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching visitors:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/visitors', async (req, res) => {
  try {
    const visitorData = {
      ...req.body,
      created_by: req.body.created_by || 'system',
      updated_by: req.body.updated_by || 'system'
    };

    const { data, error } = await supabase
      .from('visitors')
      .insert(visitorData)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error creating visitor:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/visitors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const visitorData = {
      ...req.body,
      updated_by: req.body.updated_by || 'system'
    };

    const { data, error } = await supabase
      .from('visitors')
      .update(visitorData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating visitor:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/visitors/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('visitors')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting visitor:', error);
    res.status(500).json({ error: error.message });
  }
});

// Visits API endpoints
app.get('/api/visits', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('visits')
      .select(`
        *,
        visitors!inner(name, email, phone, company)
      `)
      .order('check_in_time', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/visits', async (req, res) => {
  try {
    const visitData = {
      ...req.body,
      created_by: req.body.created_by || 'system',
      updated_by: req.body.updated_by || 'system'
    };

    const { data, error } = await supabase
      .from('visits')
      .insert(visitData)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error creating visit:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/visits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const visitData = {
      ...req.body,
      updated_by: req.body.updated_by || 'system'
    };

    const { data, error } = await supabase
      .from('visits')
      .update(visitData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating visit:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/visits/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('visits')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting visit:', error);
    res.status(500).json({ error: error.message });
  }
});

// Executives API endpoints
app.get('/api/executives', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('executives')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching executives:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/executives', async (req, res) => {
  try {
    const executiveData = {
      ...req.body,
      created_by: req.body.created_by || 'system',
      updated_by: req.body.updated_by || 'system'
    };

    const { data, error } = await supabase
      .from('executives')
      .insert(executiveData)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error creating executive:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/executives/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const executiveData = {
      ...req.body,
      updated_by: req.body.updated_by || 'system'
    };

    const { data, error } = await supabase
      .from('executives')
      .update(executiveData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating executive:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/executives/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('executives')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error deactivating executive:', error);
    res.status(500).json({ error: error.message });
  }
});

// System settings API endpoints
app.get('/api/settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    const { data, error } = await supabase
      .from('system_settings')
      .update({ 
        value, 
        description,
        updated_by: req.body.updated_by || 'system'
      })
      .eq('key', key)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Dashboard statistics
app.get('/api/dashboard-stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's visits
    const { data: todayVisits, error: todayError } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .gte('check_in_time', today.toISOString())
      .lt('check_in_time', tomorrow.toISOString());

    // Get checked-in visitors
    const { data: checkedInVisits, error: checkedInError } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'checked_in');

    // Get total visitors
    const { data: totalVisitors, error: visitorsError } = await supabase
      .from('visitors')
      .select('*', { count: 'exact', head: true });

    if (todayError || checkedInError || visitorsError) {
      throw todayError || checkedInError || visitorsError;
    }

    res.json({
      todayVisits: todayVisits.length,
      checkedInVisitors: checkedInVisits.length,
      totalVisitors: totalVisitors.length
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve the shared guest pass system
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'shared-guest-pass-system.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Shared Guest Pass System running on port ${PORT}`);
  console.log(`📊 API endpoints available at: http://localhost:${PORT}/api/*`);
  console.log(`🔗 Real-time data sharing enabled`);
  console.log(`🔐 Security middleware active`);
});

module.exports = app;