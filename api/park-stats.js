// Vercel serverless function - proxies Park API to avoid CORS issues
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const API_BASE = 'https://park-theta.vercel.app/api';
  const AUTH = `Bearer ${process.env.PARK_API_TOKEN}`;
  
  const headers = {
    'Authorization': AUTH,
    'Content-Type': 'application/json'
  };
  
  try {
    // Fetch multiple endpoints in parallel
    const [productsRes, tasksRes, docsRes] = await Promise.all([
      fetch(`${API_BASE}/products`, { headers }),
      fetch(`${API_BASE}/tasks`, { headers }),
      fetch(`${API_BASE}/docs`, { headers })
    ]);
    
    const products = await productsRes.json();
    const tasks = await tasksRes.json();
    const docs = await docsRes.json();
    
    // Calculate stats
    const stats = {
      products: Array.isArray(products) ? products.length : 0,
      tasksCompleted: Array.isArray(tasks) 
        ? tasks.filter(t => t.status === 'complete' || t.status === 'completed').length 
        : 0,
      totalTasks: Array.isArray(tasks) ? tasks.length : 0,
      apiRoutes: docs?.routes?.length || 214,
      apiVersion: docs?.version || 'v1.66.0',
      timestamp: new Date().toISOString(),
      healthy: true
    };
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Park API error:', error);
    // Return fallback stats on error
    res.status(200).json({
      products: 36,
      tasksCompleted: 221,
      totalTasks: 300,
      apiRoutes: 214,
      apiVersion: 'v1.66.0',
      timestamp: new Date().toISOString(),
      healthy: false,
      error: 'Using fallback data'
    });
  }
}
