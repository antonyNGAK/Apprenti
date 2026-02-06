"""
Module pour la gestion des thématiques
Intègre OpenAlex API pour récupérer les topics
"""

from flask import jsonify, request
import requests

# OpenAlex API base URL
OPENALEX_API_URL = "https://api.openalex.org"


def register_thematiques_routes(app):
    """Enregistrer les routes des thématiques"""
    
    @app.route('/api/thematiques', methods=['GET'])
    def get_thematiques():
        """
        Récupère les thématiques (topics) depuis l'API OpenAlex.
        Paramètres optionnels:
        - page: numéro de page (par défaut 1)
        - per_page: résultats par page (par défaut 12, max 100)
        - search: recherche par nom
        """
        try:
            # Récupérer les paramètres de query
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 12, type=int)
            search_term = request.args.get('search', '')
            
            # Limiter per_page à 100 maximum
            per_page = min(per_page, 100)
            
            # Construire l'URL de l'API OpenAlex
            url = f"{OPENALEX_API_URL}/topics"
            params = {
                'page': page,
                'per_page': per_page,
                'select': 'id,display_name,description,keywords,subfield,field,domain'
            }
            
            # Ajouter le filtre de recherche si fourni
            if search_term:
                params['search'] = search_term
            
            # Requête à l'API OpenAlex
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Transformer les données pour correspondre au format attendu par le frontend
            thematiques = []
            for topic in data.get('results', []):
                thematique = {
                    'id': topic.get('id'),
                    'titre': topic.get('display_name', ''),
                    'description': topic.get('description', ''),
                    'keywords': topic.get('keywords', []),
                    'domaine': topic.get('domain', {}).get('display_name', 'Général') if topic.get('domain') else 'Général',
                    'niveau': 'Intermédiaire'  # Par défaut, peut être déterminé autrement
                }
                thematiques.append(thematique)
            
            return jsonify({
                'status': 'success',
                'data': thematiques,
                'meta': {
                    'page': page,
                    'per_page': per_page,
                    'total': data.get('meta', {}).get('count', 0)
                }
            })
        
        except requests.exceptions.RequestException as e:
            return jsonify({
                'status': 'error',
                'message': f'Erreur lors de la récupération des données: {str(e)}'
            }), 500
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'Erreur serveur: {str(e)}'
            }), 500
