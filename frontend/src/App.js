import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@/App.css';
import Accueil from '@/pages/Accueil';
import GestionClasse from '@/pages/GestionClasse';
import SaisieNotes from '@/pages/SaisieNotes';
import FicheRapport from '@/pages/FicheRapport';
import SuiviClasse from '@/pages/SuiviClasse';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/classe/:classeId" element={<GestionClasse />} />
          <Route path="/composition/:compositionId/notes" element={<SaisieNotes />} />
          <Route path="/composition/:compositionId/rapport" element={<FicheRapport />} />
          <Route path="/classe/:classeId/suivi" element={<SuiviClasse />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;