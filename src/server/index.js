import express from 'express';
import cors from 'cors';
import { query } from '../db/index.js';
import fetch from 'node-fetch';
import crypto from 'crypto';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/military-entities', async (req, res) => {
  try {
    console.log('Fetching military entities');
    const result = await query('SELECT * FROM c4i_table');
    
    const formattedEntities = result.rows.map(entity => {
      // Build SIDC based on threatLevel and echelon
      let sidc = 'S'; // Standard Identity
      
      // Position 2: Affiliation (based on threatLevel/friendly)
      if (entity.friendly === "Friendly") {
        sidc += 'F'; // Friend
      } else if (entity.friendly === "Hostile") {
        sidc += 'H'; // Hostile
      } else {
        sidc += 'N'; // Neutral/Unknown
      }
      
      // Positions 3-4: Symbol Set and Entity
      
      if (entity.id && entity.id.includes("UAV")) {
        sidc += 'A'; // Air
      } else {
        sidc += 'I'; // Infantry
      }
      // Position 5: Entity Type
      sidc += 'I'; // Infantry
      
      
      
      // Position 8: Echelon
      const echelonMap = {
        'Team': 'A',
        'Squad': 'B', 
        'Platoon': 'C',
        'Company': 'D',
        'Battalion': 'E',
        'Regiment': 'F'
      };
      // Positions 6-7: Entity Subtype and Modifier
      sidc += echelonMap[entity.echlon] || '-';
      sidc += '---';
      
      // Position 9: Status (destroyed)
      sidc += '-';
      
      // console.log(sidc);
      return {
        id: entity.id,
        name: entity.id,
        sidc: entity.sidc || sidc, // Use custom SIDC if entity.sidc is null
        position: {
          latitude: entity.x,
          longitude: entity.y
        },
        status: entity.destroyed,
        threatLevel: entity.friendly,
        lastUpdate: entity.last_update ? new Date(entity.last_update).toISOString() : new Date().toISOString()
      };
    });
    
    res.json(formattedEntities);
  } catch (error) {
    console.error('Error fetching entities:', error);
    res.status(500).json({ 
      error: 'Failed to fetch entities',
      details: error.message 
    });
  }
});

// API endpoint for managing map shapes
app.post('/api/shapes', async (req, res) => {
  try {
    const shapeData = req.body;
    console.log('Received shape data:', JSON.stringify(shapeData, null, 2));
    
    // Validate required fields
    if (!shapeData.name || !shapeData.type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Different fields based on shape type
    let positionData = {};
    
    switch (shapeData.type) {
      case 'point':
        if (!shapeData.position) {
          return res.status(400).json({ error: 'Missing position data' });
        }
        positionData = {
          position_lat: shapeData.position.latitude,
          position_lng: shapeData.position.longitude
        };
        break;
        
      case 'circle':
        if (!shapeData.center || !shapeData.radius) {
          return res.status(400).json({ error: 'Missing center or radius data' });
        }
        positionData = {
          center_lat: shapeData.center.latitude,
          center_lng: shapeData.center.longitude,
          radius: shapeData.radius
        };
        break;
        
      case 'rectangle':
        if (!shapeData.bounds) {
          return res.status(400).json({ error: 'Missing bounds data' });
        }
        positionData = {
          ne_lat: shapeData.bounds.northEast.latitude,
          ne_lng: shapeData.bounds.northEast.longitude,
          sw_lat: shapeData.bounds.southWest.latitude,
          sw_lng: shapeData.bounds.southWest.longitude
        };
        break;
        
      case 'arrow':
        if (!shapeData.start || !shapeData.end) {
          return res.status(400).json({ error: 'Missing arrow start or end points' });
        }
        positionData = {
          start_lat: shapeData.start.latitude,
          start_lng: shapeData.start.longitude,
          end_lat: shapeData.end.latitude,
          end_lng: shapeData.end.longitude,
          head_size: shapeData.headSize || 10 // Default head size if not provided
        };
        break;
        
      case 'polyline':
      case 'polygon':
        if (!shapeData.path || shapeData.path.length < 2) {
          return res.status(400).json({ error: 'Invalid path data' });
        }
        // Convert array of points to JSON string
        positionData = {
          path: shapeData.path
        };
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid shape type' });
    }

    console.log('Shape position data:', positionData);
    
    // Create database record
    const result = await query(
      `INSERT INTO map_shapes (
        name, 
        description, 
        type, 
        line_color, 
        line_style, 
        fill_color, 
        fill_opacity,
        shape_data,
        is_enemy
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        shapeData.name,
        shapeData.description || '',
        shapeData.type,
        shapeData.lineColor || '#1E88E5',
        shapeData.lineStyle || 'solid',
        shapeData.fillColor || '#1E88E5',
        shapeData.fillOpacity || 0.3,
        JSON.stringify(positionData),
        shapeData.isEnemy || false
      ]
    );
    
    // Fetch the full row from the DB (including shape_data)
    const dbShape = await query('SELECT * FROM map_shapes WHERE id = $1', [result.rows[0].id]);
    res.status(201).json(dbShape.rows[0]);
  } catch (error) {
    console.error('Error creating shape:', error);
    res.status(500).json({ 
      error: 'Failed to create shape',
      details: error.message 
    });
  }
});

// Delete a shape
app.delete('/api/shapes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting shape with ID: ${id}`);
    
    // Check if shape exists
    const checkResult = await query('SELECT id FROM map_shapes WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shape not found' });
    }
    
    // Delete the shape
    await query('DELETE FROM map_shapes WHERE id = $1', [id]);
    
    console.log(`Shape ${id} deleted successfully`);
    res.status(200).json({ success: true, message: 'Shape deleted successfully' });
  } catch (error) {
    console.error('Error deleting shape:', error);
    res.status(500).json({ 
      error: 'Failed to delete shape',
      details: error.message 
    });
  }
});

// Get all shapes
app.get('/api/shapes', async (req, res) => {
  try {
    console.log('Fetching map shapes');
    const result = await query('SELECT * FROM map_shapes ORDER BY created_at DESC');
    console.log(`Found ${result.rows.length} shapes`);
    
    // Log a summary of each shape for debugging
    if (result.rows.length > 0) {
      result.rows.forEach(shape => {
        console.log(`Shape ID: ${shape.id}, Type: ${shape.type}, Name: ${shape.name}`);
      });
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching shapes:', error);
    res.status(500).json({ 
      error: 'Failed to fetch shapes',
      details: error.message 
    });
  }
});

// Update a shape
app.put('/api/shapes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const shapeData = req.body;
    console.log(`Updating shape with ID: ${id}`);
    console.log('Update data:', JSON.stringify(shapeData, null, 2));
    
    // Validate required fields
    if (!shapeData.name || !shapeData.type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if shape exists
    const checkResult = await query('SELECT id, type FROM map_shapes WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shape not found' });
    }
    
    // Make sure shape type hasn't changed (not allowed)
    if (checkResult.rows[0].type !== shapeData.type) {
      return res.status(400).json({ error: 'Cannot change shape type' });
    }
    
    // Process shape position data based on type
    let positionData = {};
    switch (shapeData.type) {
      case 'point':
        if (!shapeData.position) {
          return res.status(400).json({ error: 'Missing position data' });
        }
        positionData = {
          position_lat: shapeData.position.latitude,
          position_lng: shapeData.position.longitude
        };
        break;
        
      case 'circle':
        if (!shapeData.center || !shapeData.radius) {
          return res.status(400).json({ error: 'Missing center or radius data' });
        }
        positionData = {
          center_lat: shapeData.center.latitude,
          center_lng: shapeData.center.longitude,
          radius: shapeData.radius
        };
        break;
        
      case 'rectangle':
        if (!shapeData.bounds) {
          return res.status(400).json({ error: 'Missing bounds data' });
        }
        positionData = {
          ne_lat: shapeData.bounds.northEast.latitude,
          ne_lng: shapeData.bounds.northEast.longitude,
          sw_lat: shapeData.bounds.southWest.latitude,
          sw_lng: shapeData.bounds.southWest.longitude
        };
        break;
        
      case 'arrow':
        if (!shapeData.start || !shapeData.end) {
          return res.status(400).json({ error: 'Missing arrow start or end points' });
        }
        positionData = {
          start_lat: shapeData.start.latitude,
          start_lng: shapeData.start.longitude,
          end_lat: shapeData.end.latitude,
          end_lng: shapeData.end.longitude,
          head_size: shapeData.headSize || 10
        };
        break;
        
      case 'polyline':
      case 'polygon':
        if (!shapeData.path || shapeData.path.length < 2) {
          return res.status(400).json({ error: 'Invalid path data' });
        }
        positionData = {
          path: shapeData.path
        };
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid shape type' });
    }
    
    // Update the shape in the database
    await query(
      `UPDATE map_shapes SET
        name = $1,
        description = $2,
        line_color = $3,
        line_style = $4,
        fill_color = $5,
        fill_opacity = $6,
        shape_data = $7,
        is_enemy = $8,
        updated_at = NOW()
      WHERE id = $9`,
      [
        shapeData.name,
        shapeData.description || '',
        shapeData.lineColor || '#1E88E5',
        shapeData.lineStyle || 'solid',
        shapeData.fillColor || '#1E88E5',
        shapeData.fillOpacity || 0.3,
        JSON.stringify(positionData),
        shapeData.isEnemy || false,
        id
      ]
    );
    
    // Return updated shape
    const updatedShape = {
      id,
      type: shapeData.type,
      name: shapeData.name,
      description: shapeData.description || '',
      lineColor: shapeData.lineColor || '#1E88E5',
      lineStyle: shapeData.lineStyle || 'solid',
      fillColor: shapeData.fillColor || '#1E88E5',
      fillOpacity: shapeData.fillOpacity || 0.3,
      isEnemy: shapeData.isEnemy || false,
      ...shapeData // Include all the shape-specific data
    };
    
    console.log(`Shape ${id} updated successfully`);
    res.status(200).json(updatedShape);
  } catch (error) {
    console.error('Error updating shape:', error);
    res.status(500).json({ 
      error: 'Failed to update shape',
      details: error.message 
    });
  }
});

// New endpoint for video state
app.get('/api/video-state', async (req, res) => {
  try {
    console.log('Fetching video state');
    const result = await query('SELECT state FROM video_state ORDER BY id DESC LIMIT 1');
    
    if (result.rows.length === 0) {
      return res.json({ state: 'paused' }); // Default state if no record exists
    }
    
    const videoState = result.rows[0].state;
    console.log('Current video state:', videoState);
    
    res.json({ state: videoState });
  } catch (error) {
    console.error('Error fetching video state:', error);
    res.status(500).json({ 
      error: 'Failed to fetch video state',
      details: error.message 
    });
  }
});

// Chat endpoint with improved responses
app.post('/api/chat', async (req, res) => {
  try {
    let { action, sessionId, chatInput } = req.body;
    console.log('ACTION:', action);
    console.log('SESSION ID:', sessionId);
    console.log('CHAT INPUT:', chatInput);

    if (action !== 'sendMessage') {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Generate sessionId if missing
    if (!sessionId) {
      sessionId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
      console.log('Generated new sessionId:', sessionId);
    }

    // Try to send to webhook
    let webhookReply = null;
    const webhookUrl = process.env.CHAT_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const webhookPayload = { action, sessionId, chatInput };
        console.log('Sending payload to chat webhook:', JSON.stringify(webhookPayload, null, 2));
        const webhookRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload)
        });
        const webhookText = await webhookRes.text();
        console.log('Webhook response status:', webhookRes.status);
        console.log('Webhook response body:', webhookText);
        if (webhookRes.ok) {
          let webhookData;
          try {
            webhookData = JSON.parse(webhookText);
          } catch (e) {
            console.error('Failed to parse webhook JSON:', e);
            webhookData = {};
          }
          webhookReply = webhookData.reply;
        } else {
          console.error('Webhook returned error status:', webhookRes.status);
        }
      } catch (err) {
        console.error('Error sending to webhook:', err);
      }
    }

    // Use webhook reply if available, otherwise fallback
    let reply = webhookReply;
    if (!reply) {
      // ... existing local chat logic ...
      reply = "I'm not sure I understand. Can you please rephrase your question?";
      const lowerMessage = (chatInput || '').toLowerCase();
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        reply = "Hello! I'm your military tracking assistant. How can I help you today?";
      }
      else if (lowerMessage.includes('help')) {
        reply = "I can help you with information about military units, geographic locations, tactical situations, and system features. What would you like to know?";
      }
      else if (lowerMessage.includes('weather')) {
        reply = "Current weather conditions are displayed in the information panel at the top of the map. The conditions are updated based on the map's center location.";
      }
      else if (lowerMessage.includes('unit') || lowerMessage.includes('force') || lowerMessage.includes('troop')) {
        reply = "All active military units are displayed on the map with their current positions. You can click on any unit marker to see detailed information.";
      }
      else if (lowerMessage.includes('enemy') || lowerMessage.includes('hostile') || lowerMessage.includes('threat')) {
        reply = "Hostile forces are marked in red on the map. Current intelligence indicates multiple hostile elements in the northeastern quadrant. Exercise caution in that area.";
      }
      else if (lowerMessage.includes('location') || lowerMessage.includes('where') || lowerMessage.includes('position')) {
        reply = "You can see all unit positions on the main map. Use the search bar at the top-right to locate specific units or geographic locations.";
      }
      else if (lowerMessage.includes('mission') || lowerMessage.includes('objective')) {
        reply = "Current mission objectives: 1) Secure the perimeter around marked zones, 2) Monitor all movement in the region, 3) Report any suspicious activity immediately.";
      }
      else if (lowerMessage.includes('map')) {
        reply = "The map interface shows all units, geographic features, and tactical information. You can zoom in/out, add shapes, and view detailed information by clicking on any element.";
      }
      else if (lowerMessage.includes('thank')) {
        reply = "You're welcome. Please let me know if you need any further assistance.";
      }
      else if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
        reply = "Goodbye. Contact me anytime if you need assistance.";
      }
    }

    // Print the exact response to the log
    console.log('CHAT RESPONSE:', reply);
    console.log('====================================\n\n');

    res.json({ reply, sessionId });
  } catch (error) {
    console.error('Error handling chat message:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error.message 
    });
  }
});

// Get all manual entities
app.get('/api/manual-entities', async (req, res) => {
  try {
    const result = await query('SELECT * FROM manual_entities');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching manual entities:', error);
    res.status(500).json({ error: 'Failed to fetch manual entities', details: error.message });
  }
});

// Add a new manual entity
app.post('/api/manual-entities', async (req, res) => {
  const { id, friendly, echlon, destroyed, x, y, z } = req.body;
  try {
    const result = await query(
      'INSERT INTO manual_entities (id, friendly, echlon, destroyed, x, y, z) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, friendly, echlon, destroyed, x, y, z]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding manual entity:', error);
    res.status(500).json({ error: 'Failed to add manual entity', details: error.message });
  }
});

// Delete a manual entity
app.delete('/api/manual-entities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting manual entity with ID: ${id}`);
    
    // Check if entity exists
    const checkResult = await query('SELECT id FROM manual_entities WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Manual entity not found' });
    }
    
    // Delete the entity
    await query('DELETE FROM manual_entities WHERE id = $1', [id]);
    
    console.log(`Manual entity ${id} deleted successfully`);
    res.status(200).json({ success: true, message: 'Manual entity deleted successfully' });
  } catch (error) {
    console.error('Error deleting manual entity:', error);
    res.status(500).json({ 
      error: 'Failed to delete manual entity',
      details: error.message 
    });
  }
});

// Update a manual entity
app.put('/api/manual-entities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { friendly, echlon, destroyed, x, y, z } = req.body;
    console.log(`Updating manual entity with ID: ${id}`);
    console.log('Update data:', JSON.stringify(req.body, null, 2));
    
    // Check if entity exists
    const checkResult = await query('SELECT id FROM manual_entities WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Manual entity not found' });
    }
    
    // Update the entity - removed last_update column which doesn't exist
    const result = await query(
      `UPDATE manual_entities SET 
        friendly = $1, 
        echlon = $2, 
        destroyed = $3, 
        x = $4, 
        y = $5, 
        z = $6
      WHERE id = $7 RETURNING *`,
      [friendly, echlon, destroyed, x, y, z, id]
    );
    
    console.log(`Manual entity ${id} updated successfully`);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating manual entity:', error);
    res.status(500).json({ 
      error: 'Failed to update manual entity',
      details: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});