# 2NEON - Military Tracking & Command System

## System Description
2NEON is an advanced military tracking and command platform that enables real-time management, monitoring, and control of military entities. The system combines interactive maps, advanced drawing tools, and real-time alert systems.

## Key Features
- 🗺️ **Interactive Maps** powered by Mapbox GL
- 🎯 **Real-time Tracking** of military entities
- 📐 **Advanced Drawing Tools**:
  - Polylines
  - Arrows
  - Polygons
  - Circles
  - Ellipses
- ⚡ **Real-time Alerts** for hostile entities
- 🔍 **Advanced Search** for entities and locations
- 🌤️ **Real-time Weather Display**
- 💬 **Chat System** for user communication
- 📊 **Entity Panel** for management and control
- ⚙️ **Advanced Settings** for customization

## System Requirements
- Node.js (version 16 or higher)
- npm or yarn
- PostgreSQL (for database)
- Mapbox API Key

## Installation and Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the project root with the following variables:
```env
MAPBOX_ACCESS_TOKEN=your_mapbox_token
DATABASE_URL=your_database_url
```

### 3. Running the System
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## Project Structure
```
2NEON/
├── src/
│   ├── components/     # React components
│   ├── hooks/         # Custom Hooks
│   ├── server/        # Express server
│   ├── types/         # TypeScript definitions
│   └── utils/         # Utility functions
├── public/            # Static files
└── netlify/          # Netlify configuration
```

## Core Technologies
- **Frontend**:
  - React
  - TypeScript
  - Mapbox GL
  - Tailwind CSS
  - Vite

- **Backend**:
  - Node.js
  - Express
  - PostgreSQL
  - Supabase

## Development
- **Testing**: `npm run test`
- **Linting**: `npm run lint`
- **Building**: `npm run build`

## Contributing
1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
All rights reserved © 2024 NEON

## Support
For questions and technical support, please contact the development team.
