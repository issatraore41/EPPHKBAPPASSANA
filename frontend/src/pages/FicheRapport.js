import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Printer } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FicheRapport = () => {
  const { compositionId } = useParams();
  const navigate = useNavigate();
  const [composition, setComposition] = useState(null);
  const [classe, setClasse] = useState(null);
  const [notes, setNotes] = useState([]);
  const [eleves, setEleves] = useState({});
  const [statistiques, setStatistiques] = useState(null);

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

      const notesRes = await axios.get(`${API}/notes?composition_id=${compositionId}`);
      setNotes(notesRes.data);

      const elevesRes = await axios.get(`${API}/eleves?classe_id=${compo.classe_id}`);
      const elevesMap = {};
      elevesRes.data.forEach(eleve => {
        elevesMap[eleve.id] = eleve;
      });
      setEleves(elevesMap);

      const statsRes = await axios.get(`${API}/statistiques/${compositionId}`);
      setStatistiques(statsRes.data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    }
  };

  const handleImprimer = () => {
    window.print();
  };

  if (!composition || !classe || !statistiques) {
    return <div className="main-container">Chargement...</div>;
  }

  return (
    <div>
      <style>{`
        @media print {
          /* Masquer absolument tout ce qui pourrait être le logo Emergent */
          div[style*="position: fixed"],
          div[style*="position:fixed"],
          div[class*="emergent"],
          div[class*="Emergent"],
          a[href*="emergent"],
          img[alt*="Emergent"],
          [data-testid*="emergent"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
          }
          
          /* S'assurer que seul le contenu du rapport est visible */
          body > div:not(.print-container):not(:has(.print-container)) {
            display: none !important;
          }
        }
      `}</style>
      
      <div className="main-container no-print">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <Button
            variant="ghost"
            onClick={() => navigate(`/classe/${classe.id}`)}
            data-testid="btn-retour-classe"
          >
            <ArrowLeft size={20} style={{ marginRight: '8px' }} />
            Retour
          </Button>
          <Button onClick={handleImprimer} data-testid="btn-imprimer">
            <Printer size={20} style={{ marginRight: '8px' }} />
            Imprimer
          </Button>
        </div>
      </div>

      <div className="print-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>{classe.nom}</h1>
          <p style={{ fontSize: '16px', marginBottom: '4px' }}>Classe: {classe.niveau}</p>
          <p style={{ fontSize: '14px', color: '#666' }}>Année Scolaire: {classe.annee_scolaire}</p>
        </div>

        {/* Titre composition */}
        <div style={{ textAlign: 'center', marginBottom: '30px', background: '#f0f9ff', padding: '16px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>{composition.titre}</h2>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>Date: {composition.date} - Mois: {composition.mois}</p>
        </div>

        {/* Tableau des notes */}
        <Card data-testid="rapport-table">
          <CardContent style={{ padding: '0' }}>
            <Table>
              <TableHeader>
                <TableRow style={{ background: '#3b82f6', color: 'white' }}>
                  <TableHead style={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center' }}>Rang</TableHead>
                  <TableHead style={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd' }}>Nom et Prénoms</TableHead>
                  <TableHead style={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center' }}>Étude<br/>/50</TableHead>
                  <TableHead style={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center' }}>AEM<br/>/50</TableHead>
                  <TableHead style={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center' }}>Dictée<br/>/20</TableHead>
                  <TableHead style={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center' }}>Math<br/>/50</TableHead>
                  <TableHead style={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center' }}>Total<br/>/170</TableHead>
                  <TableHead style={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center' }}>Moy<br/>/10</TableHead>
                  <TableHead style={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center' }}>Obs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes
                  .filter(note => note.total > 0) // Exclure les absents (total = 0)
                  .map((note) => {
                  const eleve = eleves[note.eleve_id];
                  if (!eleve) return null;
                  const estFille = eleve.sexe === 'F';
                  return (
                    <TableRow key={note.id} data-testid={`rapport-row-${note.id}`}>
                      <TableCell style={{ border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>{note.rang}e</TableCell>
                      <TableCell style={{ border: '1px solid #ddd', color: estFille ? '#dc2626' : 'inherit' }}>
                        {eleve.nom} {eleve.prenom}
                      </TableCell>
                      <TableCell style={{ border: '1px solid #ddd', textAlign: 'center' }}>{note.etude_texte.toFixed(2)}</TableCell>
                      <TableCell style={{ border: '1px solid #ddd', textAlign: 'center' }}>{note.aem.toFixed(2)}</TableCell>
                      <TableCell style={{ border: '1px solid #ddd', textAlign: 'center' }}>{note.dictee.toFixed(2)}</TableCell>
                      <TableCell style={{ border: '1px solid #ddd', textAlign: 'center' }}>{note.math.toFixed(2)}</TableCell>
                      <TableCell style={{ border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>{note.total.toFixed(2)}</TableCell>
                      <TableCell style={{ border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', color: '#2563eb' }}>{note.moyenne.toFixed(2)}</TableCell>
                      <TableCell style={{ border: '1px solid #ddd', textAlign: 'center' }}>
                        <span className={`badge badge-${note.observation === 'A' ? 'success' : 'danger'}`}>
                          {note.observation}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <Card>
            <CardContent style={{ padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Effectif</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }} data-testid="stat-effectif">{statistiques.effectif}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent style={{ padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Présents</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }} data-testid="stat-presents">{statistiques.presents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent style={{ padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Absents</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }} data-testid="stat-absents">{statistiques.absents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent style={{ padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Admis</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }} data-testid="stat-admis">{statistiques.admis}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent style={{ padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>% Réussite</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }} data-testid="stat-pourcentage">{statistiques.pourcentage_reussite}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques par sexe */}
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Statistiques par sexe</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <Card style={{ background: '#e0f2fe' }}>
              <CardContent style={{ padding: '16px' }}>
                <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#0369a1' }}>Garçons</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px' }}>Total:</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold' }} data-testid="stat-nb-garcons">{statistiques.nb_garcons}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px' }}>Admis:</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#10b981' }} data-testid="stat-garcons-admis">{statistiques.garcons_admis}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px' }}>Refusés:</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ef4444' }} data-testid="stat-garcons-refuses">{statistiques.garcons_refuses}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card style={{ background: '#fce7f3' }}>
              <CardContent style={{ padding: '16px' }}>
                <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#be185d' }}>Filles</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px' }}>Total:</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold' }} data-testid="stat-nb-filles">{statistiques.nb_filles}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px' }}>Admises:</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#10b981' }} data-testid="stat-filles-admises">{statistiques.filles_admises}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px' }}>Refusées:</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ef4444' }} data-testid="stat-filles-refusees">{statistiques.filles_refusees}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Signatures */}
        <div style={{ marginTop: '50px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div style={{ textAlign: 'center', borderTop: '2px solid #000', paddingTop: '16px' }}>
            <p style={{ fontSize: '14px', fontWeight: 'bold' }}>LE TENANT</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>{classe.enseignant}</p>
          </div>
          <div style={{ textAlign: 'center', borderTop: '2px solid #000', paddingTop: '16px' }}>
            <p style={{ fontSize: '14px', fontWeight: 'bold' }}>LE DIRECTEUR</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FicheRapport;