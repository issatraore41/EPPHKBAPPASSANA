import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { BookOpen, Plus, Users, Calendar, Trash2, Edit } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Accueil = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedClasse, setSelectedClasse] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    niveau: '',
    annee_scolaire: '2024-2025',
    enseignant: ''
  });

  useEffect(() => {
    chargerClasses();
  }, []);

  const chargerClasses = async () => {
    try {
      const response = await axios.get(`${API}/classes`);
      setClasses(response.data);
    } catch (error) {
      console.error('Erreur chargement classes:', error);
      toast.error('Erreur lors du chargement des classes');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode && selectedClasse) {
        await axios.put(`${API}/classes/${selectedClasse.id}`, formData);
        toast.success('Classe modifiée avec succès');
      } else {
        await axios.post(`${API}/classes`, formData);
        toast.success('Classe créée avec succès');
      }
      setOpenDialog(false);
      resetForm();
      chargerClasses();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleEdit = (classe) => {
    setSelectedClasse(classe);
    setFormData({
      nom: classe.nom,
      niveau: classe.niveau,
      annee_scolaire: classe.annee_scolaire,
      enseignant: classe.enseignant
    });
    setEditMode(true);
    setOpenDialog(true);
  };

  const handleDelete = async (classeId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) {
      try {
        await axios.delete(`${API}/classes/${classeId}`);
        toast.success('Classe supprimée');
        chargerClasses();
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      niveau: '',
      annee_scolaire: '2024-2025',
      enseignant: ''
    });
    setEditMode(false);
    setSelectedClasse(null);
  };

  const handleDialogChange = (open) => {
    setOpenDialog(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <div className="main-container">
      <div className="page-header" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title" style={{ color: 'white', marginBottom: '8px' }}>Gestion Scolaire</h1>
            <p className="page-subtitle" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Système de gestion des notes et compositions</p>
          </div>
          <BookOpen size={48} />
        </div>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Mes Classes</h2>
        <Dialog open={openDialog} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button data-testid="nouvelle-classe-btn" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
              <Plus size={20} style={{ marginRight: '8px' }} />
              Nouvelle Classe
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-classe">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Modifier la classe' : 'Créer une nouvelle classe'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <Label htmlFor="nom">Nom de l'école</Label>
                <Input
                  id="nom"
                  data-testid="input-nom-ecole"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Ex: EPP HENRI KONAN BEDIE"
                  required
                />
              </div>
              <div>
                <Label htmlFor="niveau">Niveau/Classe</Label>
                <Input
                  id="niveau"
                  data-testid="input-niveau"
                  value={formData.niveau}
                  onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
                  placeholder="Ex: CE1 B"
                  required
                />
              </div>
              <div>
                <Label htmlFor="annee_scolaire">Année Scolaire</Label>
                <Input
                  id="annee_scolaire"
                  data-testid="input-annee"
                  value={formData.annee_scolaire}
                  onChange={(e) => setFormData({ ...formData, annee_scolaire: e.target.value })}
                  placeholder="Ex: 2024-2025"
                  required
                />
              </div>
              <div>
                <Label htmlFor="enseignant">Nom de l'enseignant(e)</Label>
                <Input
                  id="enseignant"
                  data-testid="input-enseignant"
                  value={formData.enseignant}
                  onChange={(e) => setFormData({ ...formData, enseignant: e.target.value })}
                  placeholder="Ex: Mme TRAORE Née KONE ASSANATOU"
                  required
                />
              </div>
              <Button type="submit" data-testid="btn-enregistrer-classe" className="w-full">
                {editMode ? 'Modifier' : 'Créer la classe'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {classes.length === 0 ? (
        <Card data-testid="empty-state" className="card-animate">
          <CardContent className="text-center py-12">
            <BookOpen size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">Aucune classe</h3>
            <p className="text-gray-500 mb-6">Commencez par créer votre première classe</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-2" style={{ gap: '24px' }}>
          {classes.map((classe) => (
            <Card key={classe.id} data-testid={`classe-card-${classe.id}`} className="card-animate hover:shadow-lg" style={{ cursor: 'pointer' }}>
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div onClick={() => navigate(`/classe/${classe.id}`)} style={{ flex: 1 }}>
                    <CardTitle className="text-xl">{classe.nom}</CardTitle>
                    <CardDescription className="mt-1">
                      <span className="badge badge-info" style={{ marginRight: '8px' }}>{classe.niveau}</span>
                      <span className="text-sm">{classe.annee_scolaire}</span>
                    </CardDescription>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`edit-classe-${classe.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(classe);
                      }}
                    >
                      <Edit size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`delete-classe-${classe.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(classe.id);
                      }}
                    >
                      <Trash2 size={18} className="text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent onClick={() => navigate(`/classe/${classe.id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                  <Users size={16} />
                  <span className="text-sm">Enseignant: {classe.enseignant}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Accueil;