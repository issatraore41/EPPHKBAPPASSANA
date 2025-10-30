import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SaisieNotes = () => {
  const { compositionId } = useParams();
  const navigate = useNavigate();
  const [composition, setComposition] = useState(null);
  const [classe, setClasse] = useState(null);
  const [eleves, setEleves] = useState([]);
  const [notes, setNotes] = useState({});
  const [notesExistantes, setNotesExistantes] = useState({});

  useEffect(() => {
    chargerDonnees();
  }, [compositionId]);

  const chargerDonnees = async () => {
    try {
      const compoRes = await axios.get(`${API}/compositions/${compositionId}`);
      const compo = compoRes.data;
      setComposition(compo);

      const classeRes = await axios.get(`${API}/classes/${compo.classe_id}`);
      setClasse(classeRes.data);

      const elevesRes = await axios.get(`${API}/eleves?classe_id=${compo.classe_id}`);
      setEleves(elevesRes.data);

      const notesRes = await axios.get(`${API}/notes?composition_id=${compositionId}`);
      const notesMap = {};
      const notesExistMap = {};
      notesRes.data.forEach(note => {
        notesMap[note.eleve_id] = {
          etude_texte: note.etude_texte,
          aem: note.aem,
          dictee: note.dictee,
          math: note.math
        };
        notesExistMap[note.eleve_id] = note.id;
      });
      setNotes(notesMap);
      setNotesExistantes(notesExistMap);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    }
  };

  const handleNoteChange = (eleveId, matiere, valeur) => {
    setNotes(prev => ({
      ...prev,
      [eleveId]: {
        ...prev[eleveId],
        [matiere]: valeur === '' ? 0 : parseFloat(valeur)
      }
    }));
  };

  const handleEnregistrer = async (eleveId) => {
    const noteData = notes[eleveId];
    if (!noteData) {
      toast.error('Aucune note à enregistrer');
      return;
    }

    // Validation
    if (noteData.etude_texte > 50 || noteData.aem > 50 || noteData.dictee > 20 || noteData.math > 50) {
      toast.error('Notes invalides. Vérifiez les maximums: Étude/50, AEM/50, Dictée/20, Math/50');
      return;
    }

    try {
      const data = {
        composition_id: compositionId,
        eleve_id: eleveId,
        ...noteData
      };

      if (notesExistantes[eleveId]) {
        await axios.put(`${API}/notes/${notesExistantes[eleveId]}`, noteData);
        toast.success('Notes modifiées');
      } else {
        await axios.post(`${API}/notes`, data);
        toast.success('Notes enregistrées');
      }
      chargerDonnees();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleEnregistrerTout = async () => {
    let succes = 0;
    let erreurs = 0;

    for (const eleveId of Object.keys(notes)) {
      const noteData = notes[eleveId];
      if (noteData.etude_texte > 50 || noteData.aem > 50 || noteData.dictee > 20 || noteData.math > 50) {
        erreurs++;
        continue;
      }

      try {
        const data = {
          composition_id: compositionId,
          eleve_id: eleveId,
          ...noteData
        };

        if (notesExistantes[eleveId]) {
          await axios.put(`${API}/notes/${notesExistantes[eleveId]}`, noteData);
        } else {
          await axios.post(`${API}/notes`, data);
        }
        succes++;
      } catch (error) {
        erreurs++;
      }
    }

    if (succes > 0) {
      toast.success(`${succes} notes enregistrées`);
      chargerDonnees();
    }
    if (erreurs > 0) {
      toast.error(`${erreurs} erreurs`);
    }
  };

  if (!composition || !classe) return <div className="main-container">Chargement...</div>;

  return (
    <div className="main-container">
      <Button
        variant="ghost"
        onClick={() => navigate(`/classe/${classe.id}`)}
        data-testid="btn-retour-classe"
        className="mb-4"
      >
        <ArrowLeft size={20} style={{ marginRight: '8px' }} />
        Retour à la classe
      </Button>

      <div className="page-header">
        <h1 className="page-title">Saisie des notes</h1>
        <p className="page-subtitle">
          {classe.nom} - {classe.niveau} - {composition.titre}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <CardTitle>Notes de la composition</CardTitle>
            <Button onClick={handleEnregistrerTout} data-testid="btn-enregistrer-tout">
              <Save size={20} style={{ marginRight: '8px' }} />
              Enregistrer tout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {eleves.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucun élève dans cette classe</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table data-testid="table-notes">
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ minWidth: '200px' }}>Nom et Prénoms</TableHead>
                    <TableHead className="text-center">Étude de texte<br/><span className="text-xs text-gray-500">/50</span></TableHead>
                    <TableHead className="text-center">AEM<br/><span className="text-xs text-gray-500">/50</span></TableHead>
                    <TableHead className="text-center">Dictée<br/><span className="text-xs text-gray-500">/20</span></TableHead>
                    <TableHead className="text-center">Math<br/><span className="text-xs text-gray-500">/50</span></TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eleves.map((eleve) => {
                    const noteEleve = notes[eleve.id] || { etude_texte: 0, aem: 0, dictee: 0, math: 0 };
                    return (
                      <TableRow key={eleve.id} data-testid={`note-row-${eleve.id}`}>
                        <TableCell className="font-medium">{eleve.nom} {eleve.prenom}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="50"
                            data-testid={`input-etude-${eleve.id}`}
                            value={noteEleve.etude_texte || ''}
                            onChange={(e) => handleNoteChange(eleve.id, 'etude_texte', e.target.value)}
                            className="text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="50"
                            data-testid={`input-aem-${eleve.id}`}
                            value={noteEleve.aem || ''}
                            onChange={(e) => handleNoteChange(eleve.id, 'aem', e.target.value)}
                            className="text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="20"
                            data-testid={`input-dictee-${eleve.id}`}
                            value={noteEleve.dictee || ''}
                            onChange={(e) => handleNoteChange(eleve.id, 'dictee', e.target.value)}
                            className="text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="50"
                            data-testid={`input-math-${eleve.id}`}
                            value={noteEleve.math || ''}
                            onChange={(e) => handleNoteChange(eleve.id, 'math', e.target.value)}
                            className="text-center"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            data-testid={`btn-enregistrer-${eleve.id}`}
                            onClick={() => handleEnregistrer(eleve.id)}
                          >
                            Enregistrer
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SaisieNotes;