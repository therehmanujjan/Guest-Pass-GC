const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://aluaqwyioopnizdoevbf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdWFxd3lpb29wbml6ZG9ldmJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODUyMDY4MiwiZXhwIjoyMDc0MDk2NjgyfQ.ZMQDkhCO8KcS6h4B8Ndpz0i4SofSnQ6Rt4JmyEF3pes';

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'guestpass'
  }
});

// Health check endpoint
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

// File upload endpoint for visitor photos
app.post('/api/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }

    const fileName = `visitor-photos/${Date.now()}-${req.file.originalname}`;
    
    const { data, error } = await supabase.storage
      .from('guestpass-files')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('guestpass-files')
      .getPublicUrl(fileName);

    res.json({ url: publicUrl });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Real-time endpoint for live updates
app.get('/api/live-updates', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connection message
  res.write('data: {"type":"connected"}\n\n');

  // Set up real-time subscription
  const subscription = supabase
    .channel('guestpass-updates')
    .on('postgres_changes', { event: '*', schema: 'guestpass' }, (payload) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    })
    .subscribe();

  // Clean up on client disconnect
  req.on('close', () => {
    subscription.unsubscribe();
  });
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

// Start server
app.listen(PORT, () => {
  console.log(`Guest Pass API server running on port ${PORT}`);
  console.log(`Connected to Supabase schema: guestpass`);
});

module.exports = app;