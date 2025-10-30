import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Printer } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SuiviClasse = () => {
  const { classeId } = useParams();
  const navigate = useNavigate();
  const [classe, setClasse] = useState(null);
  const [suiviData, setSuiviData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerDonnees();
  }, [classeId]);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      const classeRes = await axios.get(`${API}/classes/${classeId}`);
      setClasse(classeRes.data);

      const suiviRes = await axios.get(`${API}/suivi/${classeId}`);
      setSuiviData(suiviRes.data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleImprimer = () => {
    window.print();
  };

  if (loading || !classe || !suiviData) {
    return <div className="main-container">Chargement...</div>;
  }

  const { compositions, suivi } = suiviData;

  return (
    <div>
      <div className="main-container no-print">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <Button
            variant="ghost"
            onClick={() => navigate(`/classe/${classeId}`)}
            data-testid="btn-retour-classe"
          >
            <ArrowLeft size={20} style={{ marginRight: '8px' }} />
            Retour
          </Button>
          <Button onClick={handleImprimer} data-testid="btn-imprimer-suivi">
            <Printer size={20} style={{ marginRight: '8px' }} />
            Imprimer
          </Button>
        </div>
      </div>

      <div className="print-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>{classe.nom}</h1>
          <p style={{ fontSize: '16px', marginBottom: '4px' }}>Classe: {classe.niveau}</p>
          <p style={{ fontSize: '14px', color: '#666' }}>Année Scolaire: {classe.annee_scolaire}</p>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '30px', background: '#f0f9ff', padding: '16px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>Suivi des élèves sur l'année</h2>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>Suivi sur {compositions.length} compositions</p>
        </div>

        {compositions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">Aucune composition créée pour cette classe</p>
            </CardContent>
          </Card>
        ) : (
          <Card data-testid="suivi-table">
            <CardContent style={{ padding: '0', overflowX: 'auto' }}>
              <Table>
                <TableHeader>
                  <TableRow style={{ background: '#3b82f6' }}>
                    <TableHead style={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd', position: 'sticky', left: 0, background: '#3b82f6', minWidth: '200px' }}>Nom et Prénoms</TableHead>
                    {compositions.map((compo) => (
                      <TableHead key={compo.id} style={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center', minWidth: '120px' }}>
                        Compo {compo.numero}<br/>
                        <span style={{ fontSize: '11px', fontWeight: 'normal' }}>{compo.mois}</span>
                      </TableHead>
                    ))}
                    <TableHead style={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center', minWidth: '100px' }}>Moyenne<br/>Générale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suivi.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={compositions.length + 2} className="text-center py-8">
                        Aucun élève dans cette classe
                      </TableCell>
                    </TableRow>
                  ) : (
                    suivi.map((item) => {
                      const eleve = item.eleve;
                      const notes = item.notes;
                      
                      // Calculer la moyenne générale
                      const moyennes = notes.filter(n => n !== null).map(n => n.moyenne);
                      const moyenneGenerale = moyennes.length > 0
                        ? (moyennes.reduce((a, b) => a + b, 0) / moyennes.length).toFixed(2)
                        : '-';

                      return (
                        <TableRow key={eleve.id} data-testid={`suivi-row-${eleve.id}`}>
                          <TableCell style={{ border: '1px solid #ddd', fontWeight: 'bold', position: 'sticky', left: 0, background: 'white' }}>
                            {eleve.nom} {eleve.prenom}
                          </TableCell>
                          {notes.map((note, index) => (
                            <TableCell key={index} style={{ border: '1px solid #ddd', textAlign: 'center' }}>
                              {note ? (
                                <div>
                                  <div style={{ fontWeight: 'bold', color: '#2563eb' }}>{note.moyenne.toFixed(2)}</div>
                                  <div style={{ fontSize: '11px', color: '#666' }}>Rang: {note.rang}e</div>
                                </div>
                              ) : (
                                <span style={{ color: '#999' }}>-</span>
                              )}
                            </TableCell>
                          ))}
                          <TableCell style={{ border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: '#2563eb', background: '#f0f9ff' }}>
                            {moyenneGenerale}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Légende */}
        <div style={{ marginTop: '30px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>Légende</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '14px' }}>
            <div>Nombre de compositions: <strong>{compositions.length}</strong></div>
            <div>Nombre d'élèves: <strong>{suivi.length}</strong></div>
          </div>
        </div>

        {/* Signature */}
        <div style={{ marginTop: '50px', textAlign: 'center', borderTop: '2px solid #000', paddingTop: '16px' }}>
          <p style={{ fontSize: '14px', fontWeight: 'bold' }}>L'ENSEIGNANT(E)</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>{classe.enseignant}</p>
        </div>
      </div>
    </div>
  );
};

export default SuiviClasse;