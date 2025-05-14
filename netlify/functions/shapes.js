// Simple function that returns mock shape data (zones, boundaries, etc.)
export const handler = async (event, context) => {
    // Set CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
    };
  
    // Handle OPTIONS request (preflight)
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers
      };
    }
  
    try {
      console.log('Starting shapes function');
      
      // Get shape type from query parameters if available
      const params = event.queryStringParameters || {};
      const shapeType = params.type || 'all';
  
      console.log(`Request for shapes of type: ${shapeType}`);
      
      // Return mock shape data based on the requested type
      const shapes = getMockShapes(shapeType);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(shapes)
      };
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
        sidc += 'GP'; // Ground/Land Equipment
        
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
  };
  
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
          shape_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, type, name`,
        [
          shapeData.name,
          shapeData.description || '',
          shapeData.type,
          shapeData.lineColor || '#1E88E5',
          shapeData.lineStyle || 'solid',
          shapeData.fillColor || '#1E88E5',
          shapeData.fillOpacity || 0.3,
          JSON.stringify(positionData)
        ]
      );
      
      console.log('Shape saved successfully:', result.rows[0]);
      
      // Return the created shape with all data for immediate display
      const newShape = {
        id: result.rows[0].id,
        type: result.rows[0].type,
        name: result.rows[0].name,
        description: shapeData.description || '',
        lineColor: shapeData.lineColor || '#1E88E5',
        lineStyle: shapeData.lineStyle || 'solid',
        fillColor: shapeData.fillColor || '#1E88E5',
        fillOpacity: shapeData.fillOpacity || 0.3,
        ...shapeData // Include all the shape-specific data (position, path, etc.)
      };
      
      res.status(201).json(newShape);
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
          updated_at = NOW()
        WHERE id = $8`,
        [
          shapeData.name,
          shapeData.description || '',
          shapeData.lineColor || '#1E88E5',
          shapeData.lineStyle || 'solid',
          shapeData.fillColor || '#1E88E5',
          shapeData.fillOpacity || 0.3,
          JSON.stringify(positionData),
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
    
    // Return the requested shape type or all shapes
    if (type === 'all') {
      return allShapes;
    } else if (allShapes[type]) {
      return { [type]: allShapes[type] };
    } else {
      // If type doesn't exist, return empty result
      return {};
    }
