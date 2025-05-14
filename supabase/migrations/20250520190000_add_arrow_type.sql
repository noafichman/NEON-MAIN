/*
  Add arrow type to the map_shapes table
*/

-- Drop existing constraint
ALTER TABLE map_shapes DROP CONSTRAINT map_shapes_type_check;

-- Add new constraint with arrow type
ALTER TABLE map_shapes ADD CONSTRAINT map_shapes_type_check 
CHECK (type IN ('point', 'polyline', 'polygon', 'circle', 'rectangle', 'arrow')); 