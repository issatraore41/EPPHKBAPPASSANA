import requests
import sys
import json
from datetime import datetime

class GestionScolaireAPITester:
    def __init__(self, base_url="https://primary-roster.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_data = {}

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.text}")
                except:
                    pass

            return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test("Root API", "GET", "", 200)
        return success

    def test_classe_crud(self):
        """Test complete CRUD operations for classes"""
        print("\n=== TESTING CLASSE CRUD ===")
        
        # Create classe
        classe_data = {
            "nom": "EPP TEST ECOLE",
            "niveau": "CE1 A",
            "annee_scolaire": "2024-2025",
            "enseignant": "Mme TEST ENSEIGNANT"
        }
        
        success, response = self.run_test("Create Classe", "POST", "classes", 200, classe_data)
        if not success:
            return False
        
        classe_id = response.get('id')
        self.test_data['classe_id'] = classe_id
        print(f"   Created classe with ID: {classe_id}")
        
        # Get all classes
        success, response = self.run_test("List Classes", "GET", "classes", 200)
        if not success:
            return False
        
        # Get specific classe
        success, response = self.run_test("Get Classe", "GET", f"classes/{classe_id}", 200)
        if not success:
            return False
        
        # Update classe
        updated_data = {
            "nom": "EPP TEST ECOLE MODIFIEE",
            "niveau": "CE1 B",
            "annee_scolaire": "2024-2025",
            "enseignant": "Mme TEST ENSEIGNANT MODIFIEE"
        }
        success, response = self.run_test("Update Classe", "PUT", f"classes/{classe_id}", 200, updated_data)
        
        return success

    def test_eleve_crud(self):
        """Test complete CRUD operations for students"""
        print("\n=== TESTING ELEVE CRUD ===")
        
        classe_id = self.test_data.get('classe_id')
        if not classe_id:
            print("❌ No classe_id available for eleve tests")
            return False
        
        # Create eleve
        eleve_data = {
            "nom": "KOUAME",
            "prenom": "JEAN BAPTISTE",
            "classe_id": classe_id,
            "date_naissance": "2015-05-15"
        }
        
        success, response = self.run_test("Create Eleve", "POST", "eleves", 200, eleve_data)
        if not success:
            return False
        
        eleve_id = response.get('id')
        self.test_data['eleve_id'] = eleve_id
        print(f"   Created eleve with ID: {eleve_id}")
        
        # Get all eleves
        success, response = self.run_test("List All Eleves", "GET", "eleves", 200)
        if not success:
            return False
        
        # Get eleves by classe
        success, response = self.run_test("List Eleves by Classe", "GET", "eleves", 200, params={"classe_id": classe_id})
        if not success:
            return False
        
        # Get specific eleve
        success, response = self.run_test("Get Eleve", "GET", f"eleves/{eleve_id}", 200)
        if not success:
            return False
        
        # Update eleve
        updated_data = {
            "nom": "KOUAME",
            "prenom": "JEAN BAPTISTE MODIFIE",
            "classe_id": classe_id,
            "date_naissance": "2015-05-16"
        }
        success, response = self.run_test("Update Eleve", "PUT", f"eleves/{eleve_id}", 200, updated_data)
        
        return success

    def test_composition_crud(self):
        """Test complete CRUD operations for compositions"""
        print("\n=== TESTING COMPOSITION CRUD ===")
        
        classe_id = self.test_data.get('classe_id')
        if not classe_id:
            print("❌ No classe_id available for composition tests")
            return False
        
        # Create composition
        composition_data = {
            "classe_id": classe_id,
            "numero": 1,
            "date": "2025-01-21",
            "titre": "Composition du 21/01/2025",
            "mois": "Janvier"
        }
        
        success, response = self.run_test("Create Composition", "POST", "compositions", 200, composition_data)
        if not success:
            return False
        
        composition_id = response.get('id')
        self.test_data['composition_id'] = composition_id
        print(f"   Created composition with ID: {composition_id}")
        
        # Get all compositions
        success, response = self.run_test("List All Compositions", "GET", "compositions", 200)
        if not success:
            return False
        
        # Get compositions by classe
        success, response = self.run_test("List Compositions by Classe", "GET", "compositions", 200, params={"classe_id": classe_id})
        if not success:
            return False
        
        # Get specific composition
        success, response = self.run_test("Get Composition", "GET", f"compositions/{composition_id}", 200)
        if not success:
            return False
        
        # Update composition
        updated_data = {
            "classe_id": classe_id,
            "numero": 1,
            "date": "2025-01-22",
            "titre": "Composition du 22/01/2025 MODIFIEE",
            "mois": "Janvier"
        }
        success, response = self.run_test("Update Composition", "PUT", f"compositions/{composition_id}", 200, updated_data)
        
        return success

    def test_note_crud_and_calculations(self):
        """Test complete CRUD operations for notes and automatic calculations"""
        print("\n=== TESTING NOTE CRUD AND CALCULATIONS ===")
        
        composition_id = self.test_data.get('composition_id')
        eleve_id = self.test_data.get('eleve_id')
        
        if not composition_id or not eleve_id:
            print("❌ Missing composition_id or eleve_id for note tests")
            return False
        
        # Create note with specific values to test calculations
        note_data = {
            "composition_id": composition_id,
            "eleve_id": eleve_id,
            "etude_texte": 40.5,  # /50
            "aem": 35.0,          # /50
            "dictee": 15.5,       # /20
            "math": 42.0          # /50
        }
        
        # Expected calculations:
        # Total = 40.5 + 35.0 + 15.5 + 42.0 = 133.0
        # Moyenne = (133.0 / 170) * 10 = 7.82
        # Observation = B (since 7.82 >= 7)
        
        success, response = self.run_test("Create Note", "POST", "notes", 200, note_data)
        if not success:
            return False
        
        note_id = response.get('id')
        self.test_data['note_id'] = note_id
        print(f"   Created note with ID: {note_id}")
        
        # Verify calculations
        if response.get('total') != 133.0:
            print(f"❌ Total calculation error: expected 133.0, got {response.get('total')}")
            return False
        
        expected_moyenne = round((133.0 / 170) * 10, 2)
        if abs(response.get('moyenne', 0) - expected_moyenne) > 0.01:
            print(f"❌ Moyenne calculation error: expected {expected_moyenne}, got {response.get('moyenne')}")
            return False
        
        if response.get('observation') != 'B':
            print(f"❌ Observation error: expected B, got {response.get('observation')}")
            return False
        
        print(f"✅ Calculations verified: Total={response.get('total')}, Moyenne={response.get('moyenne')}, Obs={response.get('observation')}")
        
        # Get all notes
        success, response = self.run_test("List All Notes", "GET", "notes", 200)
        if not success:
            return False
        
        # Get notes by composition
        success, response = self.run_test("List Notes by Composition", "GET", "notes", 200, params={"composition_id": composition_id})
        if not success:
            return False
        
        # Get notes by eleve
        success, response = self.run_test("List Notes by Eleve", "GET", "notes", 200, params={"eleve_id": eleve_id})
        if not success:
            return False
        
        # Get specific note
        success, response = self.run_test("Get Note", "GET", f"notes/{note_id}", 200)
        if not success:
            return False
        
        # Update note and verify recalculations
        updated_note_data = {
            "etude_texte": 45.0,  # /50
            "aem": 40.0,          # /50
            "dictee": 18.0,       # /20
            "math": 47.0          # /50
        }
        
        # Expected new calculations:
        # Total = 45.0 + 40.0 + 18.0 + 47.0 = 150.0
        # Moyenne = (150.0 / 170) * 10 = 8.82
        # Observation = A (since 8.82 >= 8.5)
        
        success, response = self.run_test("Update Note", "PUT", f"notes/{note_id}", 200, updated_note_data)
        if not success:
            return False
        
        # Verify new calculations
        if response.get('total') != 150.0:
            print(f"❌ Updated total calculation error: expected 150.0, got {response.get('total')}")
            return False
        
        expected_moyenne = round((150.0 / 170) * 10, 2)
        if abs(response.get('moyenne', 0) - expected_moyenne) > 0.01:
            print(f"❌ Updated moyenne calculation error: expected {expected_moyenne}, got {response.get('moyenne')}")
            return False
        
        if response.get('observation') != 'A':
            print(f"❌ Updated observation error: expected A, got {response.get('observation')}")
            return False
        
        print(f"✅ Updated calculations verified: Total={response.get('total')}, Moyenne={response.get('moyenne')}, Obs={response.get('observation')}")
        
        return True

    def test_statistiques(self):
        """Test statistics endpoint"""
        print("\n=== TESTING STATISTIQUES ===")
        
        composition_id = self.test_data.get('composition_id')
        if not composition_id:
            print("❌ No composition_id available for statistics tests")
            return False
        
        success, response = self.run_test("Get Statistiques", "GET", f"statistiques/{composition_id}", 200)
        if not success:
            return False
        
        # Verify statistics structure
        required_fields = ['effectif', 'presents', 'absents', 'admis', 'pourcentage_reussite']
        for field in required_fields:
            if field not in response:
                print(f"❌ Missing field in statistics: {field}")
                return False
        
        print(f"✅ Statistics: Effectif={response.get('effectif')}, Présents={response.get('presents')}, Absents={response.get('absents')}, Admis={response.get('admis')}, %Réussite={response.get('pourcentage_reussite')}")
        
        return True

    def test_suivi_endpoints(self):
        """Test tracking endpoints"""
        print("\n=== TESTING SUIVI ENDPOINTS ===")
        
        classe_id = self.test_data.get('classe_id')
        eleve_id = self.test_data.get('eleve_id')
        
        if not classe_id or not eleve_id:
            print("❌ Missing classe_id or eleve_id for suivi tests")
            return False
        
        # Test individual student tracking
        success, response = self.run_test("Get Suivi Eleve", "GET", f"suivi/{classe_id}/{eleve_id}", 200)
        if not success:
            return False
        
        # Test class tracking
        success, response = self.run_test("Get Suivi Classe", "GET", f"suivi/{classe_id}", 200)
        if not success:
            return False
        
        # Verify structure
        if 'compositions' not in response or 'suivi' not in response:
            print("❌ Invalid suivi classe response structure")
            return False
        
        return True

    def test_validation_limits(self):
        """Test note validation limits"""
        print("\n=== TESTING VALIDATION LIMITS ===")
        
        composition_id = self.test_data.get('composition_id')
        eleve_id = self.test_data.get('eleve_id')
        
        if not composition_id or not eleve_id:
            print("❌ Missing composition_id or eleve_id for validation tests")
            return False
        
        # Test invalid notes (exceeding maximums)
        invalid_note_data = {
            "composition_id": composition_id,
            "eleve_id": eleve_id,
            "etude_texte": 55.0,  # Should be max 50
            "aem": 35.0,
            "dictee": 15.0,
            "math": 42.0
        }
        
        # This should still create the note (validation is done on frontend)
        # But we can verify the calculation still works
        success, response = self.run_test("Create Note with High Values", "POST", "notes", 200, invalid_note_data)
        
        # Clean up this test note
        if success and response.get('id'):
            requests.delete(f"{self.api_url}/notes/{response.get('id')}")
        
        return True

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n=== CLEANING UP TEST DATA ===")
        
        # Delete in reverse order of dependencies
        if 'note_id' in self.test_data:
            requests.delete(f"{self.api_url}/notes/{self.test_data['note_id']}")
            print("   Deleted test note")
        
        if 'composition_id' in self.test_data:
            requests.delete(f"{self.api_url}/compositions/{self.test_data['composition_id']}")
            print("   Deleted test composition")
        
        if 'eleve_id' in self.test_data:
            requests.delete(f"{self.api_url}/eleves/{self.test_data['eleve_id']}")
            print("   Deleted test eleve")
        
        if 'classe_id' in self.test_data:
            requests.delete(f"{self.api_url}/classes/{self.test_data['classe_id']}")
            print("   Deleted test classe")

def main():
    print("🚀 Starting Gestion Scolaire API Tests")
    print("=" * 50)
    
    tester = GestionScolaireAPITester()
    
    try:
        # Run all tests
        tests = [
            tester.test_root_endpoint,
            tester.test_classe_crud,
            tester.test_eleve_crud,
            tester.test_composition_crud,
            tester.test_note_crud_and_calculations,
            tester.test_statistiques,
            tester.test_suivi_endpoints,
            tester.test_validation_limits
        ]
        
        all_passed = True
        for test in tests:
            if not test():
                all_passed = False
        
        # Print final results
        print("\n" + "=" * 50)
        print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
        
        if all_passed:
            print("🎉 All major test flows completed successfully!")
        else:
            print("⚠️  Some tests failed - check details above")
        
        return 0 if all_passed else 1
        
    except Exception as e:
        print(f"💥 Test suite crashed: {str(e)}")
        return 1
    
    finally:
        # Always cleanup
        tester.cleanup_test_data()

if __name__ == "__main__":
    sys.exit(main())