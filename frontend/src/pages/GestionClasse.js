import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Users, FileText, Trash2, Edit, ClipboardList, BarChart } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GestionClasse = () => {
  const { classeId } = useParams();
  const navigate = useNavigate();
  const [classe, setClasse] = useState(null);
  const [eleves, setEleves] = useState([]);
  const [compositions, setCompositions] = useState([]);
  const [openEleveDialog, setOpenEleveDialog] = useState(false);
  const [openCompoDialog, setOpenCompoDialog] = useState(false);
  const [editModeEleve, setEditModeEleve] = useState(false);
  const [editModeCompo, setEditModeCompo] = useState(false);
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [selectedCompo, setSelectedCompo] = useState(null);
  
  const [eleveForm, setEleveForm] = useState({
    nom: '',
    prenom: '',
    date_naissance: ''
  });

  const [compoForm, setCompoForm] = useState({
    numero: 1,
    date: '',
    titre: '',
    mois: ''
  });

  useEffect(() => {
    chargerDonnees();
  }, [classeId]);

  const chargerDonnees = async () => {
    try {
      const [classeRes, elevesRes, composRes] = await Promise.all([
        axios.get(`${API}/classes/${classeId}`),
        axios.get(`${API}/eleves?classe_id=${classeId}`),
        axios.get(`${API}/compositions?classe_id=${classeId}`)
      ]);
      setClasse(classeRes.data);
      setEleves(elevesRes.data);
      setCompositions(composRes.data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des données');
    }
  };

  const handleEleveSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...eleveForm, classe_id: classeId };
      if (editModeEleve && selectedEleve) {
        await axios.put(`${API}/eleves/${selectedEleve.id}`, data);
        toast.success('Élève modifié');
      } else {
        await axios.post(`${API}/eleves`, data);
        toast.success('Élève ajouté');
      }
      setOpenEleveDialog(false);
      resetEleveForm();
      chargerDonnees();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleCompoSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...compoForm, classe_id: classeId, numero: parseInt(compoForm.numero) };
      if (editModeCompo && selectedCompo) {
        await axios.put(`${API}/compositions/${selectedCompo.id}`, data);
        toast.success('Composition modifiée');
      } else {
        await axios.post(`${API}/compositions`, data);
        toast.success('Composition créée');
      }
      setOpenCompoDialog(false);
      resetCompoForm();
      chargerDonnees();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDeleteEleve = async (eleveId) => {
    if (window.confirm('Supprimer cet élève ?')) {
      try {
        await axios.delete(`${API}/eleves/${eleveId}`);
        toast.success('Élève supprimé');
        chargerDonnees();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleDeleteCompo = async (compoId) => {
    if (window.confirm('Supprimer cette composition ?')) {
      try {
        await axios.delete(`${API}/compositions/${compoId}`);
        toast.success('Composition supprimée');
        chargerDonnees();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleEditEleve = (eleve) => {
    setSelectedEleve(eleve);
    setEleveForm({
      nom: eleve.nom,
      prenom: eleve.prenom,
      date_naissance: eleve.date_naissance || ''
    });
    setEditModeEleve(true);
    setOpenEleveDialog(true);
  };

  const handleEditCompo = (compo) => {
    setSelectedCompo(compo);
    setCompoForm({
      numero: compo.numero,
      date: compo.date,
      titre: compo.titre,
      mois: compo.mois
    });
    setEditModeCompo(true);
    setOpenCompoDialog(true);
  };

  const resetEleveForm = () => {
    setEleveForm({ nom: '', prenom: '', date_naissance: '' });
    setEditModeEleve(false);
    setSelectedEleve(null);
  };

  const resetCompoForm = () => {
    setCompoForm({ numero: compositions.length + 1, date: '', titre: '', mois: '' });
    setEditModeCompo(false);
    setSelectedCompo(null);
  };

  if (!classe) return <div className="main-container">Chargement...</div>;

  return (
    <div className="main-container">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        data-testid="btn-retour-accueil"
        className="mb-4"
      >
        <ArrowLeft size={20} style={{ marginRight: '8px' }} />
        Retour
      </Button>

      <div className="page-header">
        <h1 className="page-title">{classe.nom}</h1>
        <p className="page-subtitle">
          {classe.niveau} - {classe.annee_scolaire} - Enseignant(e): {classe.enseignant}
        </p>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <Button
          onClick={() => navigate(`/classe/${classeId}/suivi`)}
          data-testid="btn-suivi-classe"
          variant="outline"
          className="bg-white"
        >
          <BarChart size={20} style={{ marginRight: '8px' }} />
          Suivi sur 8 mois
        </Button>
      </div>

      <Tabs defaultValue="eleves" className="w-full">
        <TabsList className="mb-4" data-testid="tabs-gestion">
          <TabsTrigger value="eleves" data-testid="tab-eleves">
            <Users size={18} style={{ marginRight: '8px' }} />
            Élèves ({eleves.length})
          </TabsTrigger>
          <TabsTrigger value="compositions" data-testid="tab-compositions">
            <FileText size={18} style={{ marginRight: '8px' }} />
            Compositions ({compositions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="eleves" data-testid="content-eleves">
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <CardTitle>Liste des élèves</CardTitle>
                <Dialog open={openEleveDialog} onOpenChange={(open) => { setOpenEleveDialog(open); if (!open) resetEleveForm(); }}>
                  <DialogTrigger asChild>
                    <Button data-testid="btn-ajouter-eleve">
                      <Plus size={20} style={{ marginRight: '8px' }} />
                      Ajouter un élève
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="dialog-eleve">
                    <DialogHeader>
                      <DialogTitle>{editModeEleve ? 'Modifier l\'élève' : 'Ajouter un élève'}</DialogTitle>
                      <DialogDescription>
                        {editModeEleve ? 'Modifiez les informations de l\'élève' : 'Entrez les informations du nouvel élève'}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEleveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <Label htmlFor="nom">Nom</Label>
                        <Input
                          id="nom"
                          data-testid="input-nom-eleve"
                          value={eleveForm.nom}
                          onChange={(e) => setEleveForm({ ...eleveForm, nom: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="prenom">Prénom(s)</Label>
                        <Input
                          id="prenom"
                          data-testid="input-prenom-eleve"
                          value={eleveForm.prenom}
                          onChange={(e) => setEleveForm({ ...eleveForm, prenom: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="date_naissance">Date de naissance (optionnel)</Label>
                        <Input
                          id="date_naissance"
                          type="date"
                          data-testid="input-date-naissance"
                          value={eleveForm.date_naissance}
                          onChange={(e) => setEleveForm({ ...eleveForm, date_naissance: e.target.value })}
                        />
                      </div>
                      <Button type="submit" data-testid="btn-enregistrer-eleve">
                        {editModeEleve ? 'Modifier' : 'Ajouter'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {eleves.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucun élève dans cette classe</p>
              ) : (
                <Table data-testid="table-eleves">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rang</TableHead>
                      <TableHead>Nom et Prénoms</TableHead>
                      <TableHead>Date de naissance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eleves.map((eleve, index) => (
                      <TableRow key={eleve.id} data-testid={`eleve-row-${eleve.id}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{eleve.nom} {eleve.prenom}</TableCell>
                        <TableCell>{eleve.date_naissance || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`edit-eleve-${eleve.id}`}
                              onClick={() => handleEditEleve(eleve)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`delete-eleve-${eleve.id}`}
                              onClick={() => handleDeleteEleve(eleve.id)}
                            >
                              <Trash2 size={16} className="text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compositions" data-testid="content-compositions">
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <CardTitle>Liste des compositions</CardTitle>
                <Dialog open={openCompoDialog} onOpenChange={(open) => { setOpenCompoDialog(open); if (!open) resetCompoForm(); }}>
                  <DialogTrigger asChild>
                    <Button data-testid="btn-creer-composition">
                      <Plus size={20} style={{ marginRight: '8px' }} />
                      Créer une composition
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="dialog-composition">
                    <DialogHeader>
                      <DialogTitle>{editModeCompo ? 'Modifier la composition' : 'Créer une composition'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCompoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <Label htmlFor="numero">Numéro</Label>
                        <Input
                          id="numero"
                          type="number"
                          data-testid="input-numero-compo"
                          value={compoForm.numero}
                          onChange={(e) => setCompoForm({ ...compoForm, numero: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="titre">Titre</Label>
                        <Input
                          id="titre"
                          data-testid="input-titre-compo"
                          value={compoForm.titre}
                          onChange={(e) => setCompoForm({ ...compoForm, titre: e.target.value })}
                          placeholder="Ex: Composition du 21/01/2025"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          data-testid="input-date-compo"
                          value={compoForm.date}
                          onChange={(e) => setCompoForm({ ...compoForm, date: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="mois">Mois</Label>
                        <Input
                          id="mois"
                          data-testid="input-mois-compo"
                          value={compoForm.mois}
                          onChange={(e) => setCompoForm({ ...compoForm, mois: e.target.value })}
                          placeholder="Ex: Janvier"
                          required
                        />
                      </div>
                      <Button type="submit" data-testid="btn-enregistrer-composition">
                        {editModeCompo ? 'Modifier' : 'Créer'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {compositions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucune composition créée</p>
              ) : (
                <div className="grid gap-4">
                  {compositions.map((compo) => (
                    <Card key={compo.id} data-testid={`composition-card-${compo.id}`} className="hover:shadow-md">
                      <CardContent className="pt-6">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                              <span className="badge badge-info">Composition N°{compo.numero}</span>
                              <span className="text-sm text-gray-500">{compo.mois}</span>
                            </div>
                            <h3 className="font-semibold text-lg mb-2">{compo.titre}</h3>
                            <p className="text-sm text-gray-600">Date: {compo.date}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid={`saisir-notes-${compo.id}`}
                              onClick={() => navigate(`/composition/${compo.id}/notes`)}
                            >
                              <ClipboardList size={16} style={{ marginRight: '4px' }} />
                              Saisir notes
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid={`voir-rapport-${compo.id}`}
                              onClick={() => navigate(`/composition/${compo.id}/rapport`)}
                            >
                              <FileText size={16} style={{ marginRight: '4px' }} />
                              Rapport
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`edit-composition-${compo.id}`}
                              onClick={() => handleEditCompo(compo)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`delete-composition-${compo.id}`}
                              onClick={() => handleDeleteCompo(compo.id)}
                            >
                              <Trash2 size={16} className="text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GestionClasse;