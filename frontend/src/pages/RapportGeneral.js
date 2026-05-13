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

const RapportGeneral = () => {
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

  // Calculer la moyenne générale pondérée pour chaque élève
  // Formule : (M1 + M2 + M3 + M4 × 2) / 5  (compo n°4 = passage = coefficient 2)
  const elevesAvecMoyenne = suivi.map((item) => {
    let sommePonderee = 0;
    let sommeCoefficients = 0;
    let nbNotes = 0;
    item.notes.forEach((note, idx) => {
      if (note !== null) {
        const numero = compositions[idx].numero;
        const coefficient = numero === 4 ? 2 : 1;
        sommePonderee += note.moyenne * coefficient;
        sommeCoefficients += coefficient;
        nbNotes++;
      }
    });
    const moyenneGenerale = sommeCoefficients > 0 ? sommePonderee / sommeCoefficients : 0;
    return {
      eleve: item.eleve,
      notes: item.notes,
      moyenneGenerale,
      nbNotes,
    };
  });

  // Séparer présents (au moins une note) et absents (aucune note)
  const presents = elevesAvecMoyenne.filter(e => e.nbNotes > 0);
  const absents = elevesAvecMoyenne.filter(e => e.nbNotes === 0);

  // Classement par ordre de mérite (moyenne générale décroissante)
  const classement = [...presents].sort((a, b) => b.moyenneGenerale - a.moyenneGenerale);

  // Statistiques
  const effectif = elevesAvecMoyenne.length;
  const nbPresents = presents.length;
  const nbAbsents = absents.length;
  const admis = presents.filter(e => e.moyenneGenerale >= 5.0).length;
  const pourcentageReussite = nbPresents > 0 ? ((admis / nbPresents) * 100).toFixed(2) : 0;

  const garcons = presents.filter(e => (e.eleve.sexe || 'M') === 'M');
  const filles = presents.filter(e => e.eleve.sexe === 'F');
  const garconsAdmis = garcons.filter(e => e.moyenneGenerale >= 5.0).length;
  const garconsRefuses = garcons.length - garconsAdmis;
  const fillesAdmises = filles.filter(e => e.moyenneGenerale >= 5.0).length;
  const fillesRefusees = filles.length - fillesAdmises;

  return (
    <div>
      <style>{`
        @media print {
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
        }
      `}</style>

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
          <Button onClick={handleImprimer} data-testid="btn-imprimer-rapport-general">
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

        <div style={{ textAlign: 'center', marginBottom: '20px', background: '#fef3c7', padding: '16px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#92400e' }}>
            RAPPORT GÉNÉRAL - CLASSEMENT PAR ORDRE DE MÉRITE
          </h2>
          <p style={{ fontSize: '13px', marginTop: '8px', color: '#78350f' }}>
            Moyenne Générale = (Moy. Compo 1 + Moy. Compo 2 + Moy. Compo 3 + Moy. Compo 4 × 2) / 5
          </p>
        </div>

        {compositions.length === 0 || classement.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">Aucune donnée disponible pour le classement général</p>
            </CardContent>
          </Card>
        ) : (
          <Card data-testid="rapport-general-table">
            <CardContent style={{ padding: '0', overflowX: 'auto' }}>
              <Table>
                <TableHeader>
                  <TableRow style={{ background: '#3b82f6' }}>
                    <TableHead style={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center', minWidth: '70px' }}>Rang</TableHead>
                    <TableHead style={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd', minWidth: '200px' }}>Nom et Prénoms</TableHead>
                    {compositions.map((compo) => (
                      <TableHead key={compo.id} style={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center', minWidth: '90px' }}>
                        Compo {compo.numero}{compo.numero === 4 ? ' (×2)' : ''}<br/>
                        <span style={{ fontSize: '11px', fontWeight: 'normal' }}>{compo.mois}</span>
                      </TableHead>
                    ))}
                    <TableHead style={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center', minWidth: '100px' }}>Moyenne<br/>Générale</TableHead>
                    <TableHead style={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center', minWidth: '70px' }}>Obs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classement.map((item, idx) => {
                    const eleve = item.eleve;
                    const estFille = eleve.sexe === 'F';
                    const observation = item.moyenneGenerale >= 5.0 ? 'A' : 'R';
                    return (
                      <TableRow key={eleve.id} data-testid={`rapport-general-row-${eleve.id}`}>
                        <TableCell style={{ border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>
                          {idx + 1}{idx === 0 ? 'er' : 'e'}
                        </TableCell>
                        <TableCell style={{ border: '1px solid #ddd', fontWeight: 'bold', color: estFille ? '#dc2626' : 'inherit' }}>
                          {eleve.nom} {eleve.prenom}
                        </TableCell>
                        {item.notes.map((note, index) => (
                          <TableCell key={index} style={{ border: '1px solid #ddd', textAlign: 'center' }}>
                            {note ? note.moyenne.toFixed(2) : <span style={{ color: '#999' }}>-</span>}
                          </TableCell>
                        ))}
                        <TableCell style={{ border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: '#2563eb', background: '#f0f9ff' }}>
                          {item.moyenneGenerale.toFixed(2)}
                        </TableCell>
                        <TableCell style={{ border: '1px solid #ddd', textAlign: 'center' }}>
                          <span className={`badge badge-${observation === 'A' ? 'success' : 'danger'}`}>
                            {observation}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {/* Absents en bas du tableau */}
                  {absents.map((item) => {
                    const eleve = item.eleve;
                    const estFille = eleve.sexe === 'F';
                    return (
                      <TableRow key={eleve.id} data-testid={`rapport-general-absent-${eleve.id}`} style={{ background: '#fef2f2' }}>
                        <TableCell style={{ border: '1px solid #ddd', textAlign: 'center', fontStyle: 'italic', color: '#999' }}>-</TableCell>
                        <TableCell style={{ border: '1px solid #ddd', fontStyle: 'italic', color: estFille ? '#dc2626' : '#666' }}>
                          {eleve.nom} {eleve.prenom} (Absent)
                        </TableCell>
                        {item.notes.map((_, index) => (
                          <TableCell key={index} style={{ border: '1px solid #ddd', textAlign: 'center', color: '#999' }}>-</TableCell>
                        ))}
                        <TableCell style={{ border: '1px solid #ddd', textAlign: 'center', color: '#999' }}>-</TableCell>
                        <TableCell style={{ border: '1px solid #ddd', textAlign: 'center', color: '#999' }}>-</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Statistiques globales */}
        <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <Card>
            <CardContent style={{ padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Effectif</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }} data-testid="stat-effectif">{effectif}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent style={{ padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Présents</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }} data-testid="stat-presents">{nbPresents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent style={{ padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Absents</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }} data-testid="stat-absents">{nbAbsents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent style={{ padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Admis</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }} data-testid="stat-admis">{admis}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent style={{ padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>% Réussite</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }} data-testid="stat-pourcentage">{pourcentageReussite}%</p>
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
                  <span style={{ fontSize: '13px', fontWeight: 'bold' }} data-testid="stat-nb-garcons">{garcons.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px' }}>Admis:</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#10b981' }} data-testid="stat-garcons-admis">{garconsAdmis}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px' }}>Refusés:</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ef4444' }} data-testid="stat-garcons-refuses">{garconsRefuses}</span>
                </div>
              </CardContent>
            </Card>

            <Card style={{ background: '#fce7f3' }}>
              <CardContent style={{ padding: '16px' }}>
                <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#be185d' }}>Filles</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px' }}>Total:</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold' }} data-testid="stat-nb-filles">{filles.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px' }}>Admises:</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#10b981' }} data-testid="stat-filles-admises">{fillesAdmises}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px' }}>Refusées:</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ef4444' }} data-testid="stat-filles-refusees">{fillesRefusees}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Signatures */}
        <div style={{ marginTop: '50px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div style={{ textAlign: 'center', borderTop: '2px solid #000', paddingTop: '16px' }}>
            <p style={{ fontSize: '14px', fontWeight: 'bold' }}>L'ENSEIGNANT(E)</p>
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

export default RapportGeneral;
