/*
  # Initial schema for military entities

  1. New Tables
    - `military_entities`
      - `id` (uuid, primary key)
      - `name` (text)
      - `sidc` (text) - Standard Identity Code
      - `position_lat` (double precision)
      - `position_lng` (double precision)
      - `status` (text)
      - `threat_level` (text)
      - `last_update` (timestamp with time zone)

  2. Sample Data
    - Includes initial set of military entities
*/

-- Create military_entities table
CREATE TABLE IF NOT EXISTS military_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sidc text NOT NULL,
  position_lat double precision NOT NULL,
  position_lng double precision NOT NULL,
  status text NOT NULL,
  threat_level text NOT NULL,
  last_update timestamptz DEFAULT now()
);

-- Insert sample data
INSERT INTO military_entities (name, sidc, position_lat, position_lng, status, threat_level, last_update) VALUES
  ('3rd Infantry Division', 'SFGPI-----', 32.8998, -81.9568, 'Active', 'Friendly', '2025-05-20 08:30:22'),
  ('1st Armored Battalion', 'SFGPUCA---', 35.1269, -79.4512, 'Moving', 'Friendly', '2025-05-20 09:15:00'),
  ('Hostile Force Alpha', 'SHGPUCFM--', 37.2707, -115.7975, 'Active', 'Hostile', '2025-05-20 07:45:12'),
  ('Reconnaissance Unit 7', 'SFGPUSR---', 40.7128, -74.0060, 'Concealed', 'Friendly', '2025-05-20 10:22:18'),
  ('Support Convoy', 'SFGPUSS---', 38.9072, -77.0369, 'En Route', 'Friendly', '2025-05-20 08:50:45'),
  ('Unknown Aircraft', 'SFAPMFQ---', 36.1699, -86.7783, 'Tracking', 'Unknown', '2025-05-20 09:33:27'),
  ('Hostile Artillery', 'SHGPUCFRS-', 33.7490, -84.3880, 'Active', 'Hostile', '2025-05-20 07:15:10');