from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ✅ Une seule instance
app = FastAPI()
api_router = APIRouter(prefix="/api")


# ========== MODELS ==========

class Classe(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    niveau: str
    annee_scolaire: str
    enseignant: str

class ClasseCreate(BaseModel):
    nom: str
    niveau: str
    annee_scolaire: str
    enseignant: str

class Eleve(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    prenom: str
    classe_id: str
    date_naissance: Optional[str] = None

class EleveCreate(BaseModel):
    nom: str
    prenom: str
    classe_id: str
    date_naissance: Optional[str] = None

class Composition(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    classe_id: str
    numero: int
    date: str
    titre: str
    mois: str

class CompositionCreate(BaseModel):
    classe_id: str
    numero: int
    date: str
    titre: str
    mois: str

class Note(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    composition_id: str
    eleve_id: str
    etude_texte: float
    aem: float
    dictee: float
    math: float
    total: float
    moyenne: float
    rang: int
    observation: str

class NoteCreate(BaseModel):
    composition_id: str
    eleve_id: str
    etude_texte: float
    aem: float
    dictee: float
    math: float

class NoteUpdate(BaseModel):
    etude_texte: float
    aem: float
    dictee: float
    math: float

# ========== HELPER FUNCTIONS ==========

async def calculer_classement(composition_id: str):
    """Recalcule le rang de toutes les notes d'une composition"""
    notes = await db.notes.find({"composition_id": composition_id}, {"_id": 0}).to_list(1000)
    
    # Trier par total décroissant
    notes_triees = sorted(notes, key=lambda x: x['total'], reverse=True)
    
    # Mettre à jour les rangs
    for idx, note in enumerate(notes_triees, 1):
        await db.notes.update_one(
            {"id": note['id']},
            {"$set": {"rang": idx}}
        )

def calculer_observation(moyenne: float) -> str:
    """Détermine l'observation selon la moyenne"""
    if moyenne >= 8.5:
        return "A"
    elif moyenne >= 7:
        return "B"
    elif moyenne >= 5:
        return "C"
    else:
        return "D"

# ========== ROUTES CLASSES ==========

@api_router.post("/classes", response_model=Classe)
async def creer_classe(classe: ClasseCreate):
    classe_obj = Classe(**classe.model_dump())
    doc = classe_obj.model_dump()
    await db.classes.insert_one(doc)
    return classe_obj

@api_router.get("/classes", response_model=List[Classe])
async def lister_classes():
    classes = await db.classes.find({}, {"_id": 0}).to_list(1000)
    return classes

@api_router.get("/classes/{classe_id}", response_model=Classe)
async def obtenir_classe(classe_id: str):
    classe = await db.classes.find_one({"id": classe_id}, {"_id": 0})
    if not classe:
        raise HTTPException(status_code=404, detail="Classe non trouvée")
    return classe

@api_router.put("/classes/{classe_id}", response_model=Classe)
async def modifier_classe(classe_id: str, classe: ClasseCreate):
    result = await db.classes.update_one(
        {"id": classe_id},
        {"$set": classe.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Classe non trouvée")
    classe_modifiee = await db.classes.find_one({"id": classe_id}, {"_id": 0})
    return classe_modifiee

@api_router.delete("/classes/{classe_id}")
async def supprimer_classe(classe_id: str):
    result = await db.classes.delete_one({"id": classe_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Classe non trouvée")
    # Supprimer aussi les élèves, compositions et notes associés
    await db.eleves.delete_many({"classe_id": classe_id})
    compositions = await db.compositions.find({"classe_id": classe_id}, {"_id": 0}).to_list(1000)
    for comp in compositions:
        await db.notes.delete_many({"composition_id": comp['id']})
    await db.compositions.delete_many({"classe_id": classe_id})
    return {"message": "Classe supprimée avec succès"}

# ========== ROUTES ÉLÈVES ==========

@api_router.post("/eleves", response_model=Eleve)
async def creer_eleve(eleve: EleveCreate):
    eleve_obj = Eleve(**eleve.model_dump())
    doc = eleve_obj.model_dump()
    await db.eleves.insert_one(doc)
    return eleve_obj

@api_router.get("/eleves", response_model=List[Eleve])
async def lister_eleves(classe_id: Optional[str] = None):
    query = {"classe_id": classe_id} if classe_id else {}
    eleves = await db.eleves.find(query, {"_id": 0}).to_list(1000)
    return eleves

@api_router.get("/eleves/{eleve_id}", response_model=Eleve)
async def obtenir_eleve(eleve_id: str):
    eleve = await db.eleves.find_one({"id": eleve_id}, {"_id": 0})
    if not eleve:
        raise HTTPException(status_code=404, detail="Élève non trouvé")
    return eleve

@api_router.put("/eleves/{eleve_id}", response_model=Eleve)
async def modifier_eleve(eleve_id: str, eleve: EleveCreate):
    result = await db.eleves.update_one(
        {"id": eleve_id},
        {"$set": eleve.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Élève non trouvé")
    eleve_modifie = await db.eleves.find_one({"id": eleve_id}, {"_id": 0})
    return eleve_modifie

@api_router.delete("/eleves/{eleve_id}")
async def supprimer_eleve(eleve_id: str):
    result = await db.eleves.delete_one({"id": eleve_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Élève non trouvé")
    # Supprimer aussi les notes associées
    await db.notes.delete_many({"eleve_id": eleve_id})
    return {"message": "Élève supprimé avec succès"}

# ========== ROUTES COMPOSITIONS ==========

@api_router.post("/compositions", response_model=Composition)
async def creer_composition(composition: CompositionCreate):
    composition_obj = Composition(**composition.model_dump())
    doc = composition_obj.model_dump()
    await db.compositions.insert_one(doc)
    return composition_obj

@api_router.get("/compositions", response_model=List[Composition])
async def lister_compositions(classe_id: Optional[str] = None):
    query = {"classe_id": classe_id} if classe_id else {}
    compositions = await db.compositions.find(query, {"_id": 0}).to_list(1000)
    # Trier par numéro
    compositions_triees = sorted(compositions, key=lambda x: x['numero'])
    return compositions_triees

@api_router.get("/compositions/{composition_id}", response_model=Composition)
async def obtenir_composition(composition_id: str):
    composition = await db.compositions.find_one({"id": composition_id}, {"_id": 0})
    if not composition:
        raise HTTPException(status_code=404, detail="Composition non trouvée")
    return composition

@api_router.put("/compositions/{composition_id}", response_model=Composition)
async def modifier_composition(composition_id: str, composition: CompositionCreate):
    result = await db.compositions.update_one(
        {"id": composition_id},
        {"$set": composition.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Composition non trouvée")
    composition_modifiee = await db.compositions.find_one({"id": composition_id}, {"_id": 0})
    return composition_modifiee

@api_router.delete("/compositions/{composition_id}")
async def supprimer_composition(composition_id: str):
    result = await db.compositions.delete_one({"id": composition_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Composition non trouvée")
    # Supprimer aussi les notes associées
    await db.notes.delete_many({"composition_id": composition_id})
    return {"message": "Composition supprimée avec succès"}

# ========== ROUTES NOTES ==========

@api_router.post("/notes", response_model=Note)
async def creer_note(note_input: NoteCreate):
    # Calculer total et moyenne
    total = note_input.etude_texte + note_input.aem + note_input.dictee + note_input.math
    moyenne = round((total / 170) * 10, 2)
    observation = calculer_observation(moyenne)
    
    note_obj = Note(
        **note_input.model_dump(),
        total=total,
        moyenne=moyenne,
        rang=999,  # Sera recalculé
        observation=observation
    )
    
    doc = note_obj.model_dump()
    await db.notes.insert_one(doc)
    
    # Recalculer les rangs
    await calculer_classement(note_input.composition_id)
    
    # Récupérer la note avec le rang mis à jour
    note_maj = await db.notes.find_one({"id": note_obj.id}, {"_id": 0})
    return note_maj

@api_router.get("/notes", response_model=List[Note])
async def lister_notes(composition_id: Optional[str] = None, eleve_id: Optional[str] = None):
    query = {}
    if composition_id:
        query["composition_id"] = composition_id
    if eleve_id:
        query["eleve_id"] = eleve_id
    
    notes = await db.notes.find(query, {"_id": 0}).to_list(1000)
    # Trier par rang
    notes_triees = sorted(notes, key=lambda x: x['rang'])
    return notes_triees

@api_router.get("/notes/{note_id}", response_model=Note)
async def obtenir_note(note_id: str):
    note = await db.notes.find_one({"id": note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Note non trouvée")
    return note

@api_router.put("/notes/{note_id}", response_model=Note)
async def modifier_note(note_id: str, note_update: NoteUpdate):
    # Recalculer total et moyenne
    total = note_update.etude_texte + note_update.aem + note_update.dictee + note_update.math
    moyenne = round((total / 170) * 10, 2)
    observation = calculer_observation(moyenne)
    
    result = await db.notes.update_one(
        {"id": note_id},
        {"$set": {
            **note_update.model_dump(),
            "total": total,
            "moyenne": moyenne,
            "observation": observation
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Note non trouvée")
    
    # Récupérer composition_id pour recalculer les rangs
    note = await db.notes.find_one({"id": note_id}, {"_id": 0})
    await calculer_classement(note['composition_id'])
    
    note_modifiee = await db.notes.find_one({"id": note_id}, {"_id": 0})
    return note_modifiee

@api_router.delete("/notes/{note_id}")
async def supprimer_note(note_id: str):
    note = await db.notes.find_one({"id": note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Note non trouvée")
    
    composition_id = note['composition_id']
    await db.notes.delete_one({"id": note_id})
    
    # Recalculer les rangs
    await calculer_classement(composition_id)
    
    return {"message": "Note supprimée avec succès"}

# ========== STATISTIQUES ==========

@api_router.get("/statistiques/{composition_id}")
async def obtenir_statistiques(composition_id: str):
    notes = await db.notes.find({"composition_id": composition_id}, {"_id": 0}).to_list(1000)
    
    effectif = len(notes)
    presents = effectif  # Par défaut tous présents
    absents = 0
    admis = sum(1 for n in notes if n['moyenne'] >= 5.0)
    pourcentage_reussite = round((admis / effectif * 100), 2) if effectif > 0 else 0
    
    return {
        "effectif": effectif,
        "presents": presents,
        "absents": absents,
        "admis": admis,
        "pourcentage_reussite": pourcentage_reussite
    }

# ========== SUIVI SUR 8 MOIS ==========

@api_router.get("/suivi/{classe_id}/{eleve_id}")
async def obtenir_suivi_eleve(classe_id: str, eleve_id: str):
    """Obtient le suivi d'un élève sur toutes les compositions de la classe"""
    compositions = await db.compositions.find({"classe_id": classe_id}, {"_id": 0}).to_list(1000)
    compositions_triees = sorted(compositions, key=lambda x: x['numero'])
    
    suivi = []
    for comp in compositions_triees:
        note = await db.notes.find_one(
            {"composition_id": comp['id'], "eleve_id": eleve_id},
            {"_id": 0}
        )
        suivi.append({
            "composition": comp,
            "note": note
        })
    
    return suivi

@api_router.get("/suivi/{classe_id}")
async def obtenir_suivi_classe(classe_id: str):
    """Obtient le suivi de tous les élèves de la classe"""
    eleves = await db.eleves.find({"classe_id": classe_id}, {"_id": 0}).to_list(1000)
    compositions = await db.compositions.find({"classe_id": classe_id}, {"_id": 0}).to_list(1000)
    compositions_triees = sorted(compositions, key=lambda x: x['numero'])
    
    suivi_classe = []
    for eleve in eleves:
        notes_eleve = []
        for comp in compositions_triees:
            note = await db.notes.find_one(
                {"composition_id": comp['id'], "eleve_id": eleve['id']},
                {"_id": 0}
            )
            notes_eleve.append(note)
        
        suivi_classe.append({
            "eleve": eleve,
            "notes": notes_eleve
        })
    
    return {
        "compositions": compositions_triees,
        "suivi": suivi_classe
    }

# ========== ROOT ==========

@api_router.get("/")
async def root():
    return {"message": "API Gestion Scolaire"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
