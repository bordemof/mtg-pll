import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PartyTime from './components/PartyTime';
import BombasticResults from './components/BombasticResults';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/party-time" element={<PartyTime />} />
          <Route path="/bombastic-results" element={<BombasticResults />} />
          <Route path="/" element={<PartyTime />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;