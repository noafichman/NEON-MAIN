/*
  # Schema for map shapes

  Creates a table for storing different types of map shapes:
  - Points
  - Polylines
  - Polygons
  - Circles
  - Rectangles
*/

-- Create map_shapes table
CREATE TABLE IF NOT EXISTS map_shapes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('point', 'polyline', 'polygon', 'circle', 'rectangle', 'arrow')),
  line_color text NOT NULL DEFAULT '#1E88E5',
  line_style text NOT NULL DEFAULT 'solid' CHECK (line_style IN ('solid', 'dashed', 'dotted')),
  fill_color text NOT NULL DEFAULT '#1E88E5',
  fill_opacity real NOT NULL DEFAULT 0.3,
  shape_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_map_shapes_modtime
BEFORE UPDATE ON map_shapes
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column(); 