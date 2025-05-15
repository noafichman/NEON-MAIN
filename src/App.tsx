import React, { useState } from 'react';
import Layout from './components/Layout';
import MapContainer from './components/map/MapContainer';

function App() {
  const [isPanelVisible, setIsPanelVisible] = useState(true);

  return (
    <Layout>
      <MapContainer 
        isPanelVisible={isPanelVisible}
        setIsPanelVisible={setIsPanelVisible}
      />
    </Layout>
  );
}

export default App;