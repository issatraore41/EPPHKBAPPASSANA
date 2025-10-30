import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@/App.css';
import Accueil from '@/pages/Accueil';
import GestionClasse from '@/pages/GestionClasse';
import SaisieNotes from '@/pages/SaisieNotes';
import FicheRapport from '@/pages/FicheRapport';
import SuiviClasse from '@/pages/SuiviClasse';
import { Toaster } from '@/components/ui/sonner';
import { useEffect, useState } from "react";
import { getData } from "./lib/api";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    getData("/").then((data) => setMessage(data.message));
  }, []);
  
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
   <h1>Frontend connecté à FastAPI ✅</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;
