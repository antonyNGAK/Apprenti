"""
Module pour la gestion de l'Assistant IA
Intègre OpenAI pour les interactions conversationnelles
"""

from flask import jsonify, request, send_file
from openai import OpenAI
import httpx
import os
import io


def get_openai_client():
    """Récupérer ou initialiser le client OpenAI"""
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return None
    http_client = httpx.Client(timeout=30.0)
    return OpenAI(api_key=api_key, http_client=http_client)


def get_openai_model():
    """Récupérer le modèle OpenAI depuis l'environnement"""
    return os.getenv('OPENAI_MODEL', 'gpt-4o-mini')


def register_assistant_routes(app):
    """Enregistrer les routes de l'assistant IA"""
    
    @app.route('/api/assistant', methods=['POST'])
    def assistant():
        """
        Endpoint pour communiquer avec l'assistant IA.
        Corps de la requête:
        {
            "message": "Le message de l'utilisateur",
            "action": "chat|explain|translate|tts",
            "language": "en|es|de|fr" (pour translate/tts),
            "context": {
                "type": "thematique",
                "data": {...}
            }
        }
        """
        try:
            data = request.get_json(silent=True) or {}
            user_message = data.get('message', '')
            action = data.get('action', 'chat')
            target_language = data.get('language', 'fr')
            context = data.get('context', {})

            if not user_message:
                return jsonify({
                    'status': 'error',
                    'message': 'Message vide'
                }), 400

            # Vérifier que la clé API est configurée
            if not os.getenv('OPENAI_API_KEY'):
                return jsonify({
                    'status': 'error',
                    'message': 'Clé API OpenAI non configurée. Veuillez ajouter OPENAI_API_KEY dans le fichier .env'
                }), 500

            # Initialiser le client OpenAI
            client = get_openai_client()
            if not client:
                return jsonify({
                    'status': 'error',
                    'message': 'Impossible de configurer le client OpenAI'
                }), 500

            # Construire le contexte pour l'IA
            system_prompt = build_system_prompt(action, context)
            
            # Construire le message utilisateur
            if action == 'explain':
                user_message = f"Explique-moi ceci de manière plus détaillée et pédagogique:\n\n{user_message}"
            elif action == 'translate':
                user_message = f"Traduis le texte suivant en {get_language_name(target_language)}:\n\n{user_message}"
            elif action == 'tts':
                user_message = f"Fournis le texte suivant prêt à être lu à haute voix (du texte lisible naturellement):\n\n{user_message}"

            # Appeler OpenAI
            response = client.chat.completions.create(
                model=get_openai_model(),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=1000
            )

            ai_response = response.choices[0].message.content

            return jsonify({
                'status': 'success',
                'message': ai_response,
                'action': action
            })

        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'Erreur: {str(e)}'
            }), 500

    @app.route('/api/tts', methods=['POST'])
    def text_to_speech():
        """
        Endpoint pour générer du texte lisible à haute voix (TTS).
        Corps de la requête:
        {
            "text": "Le texte à convertir en audio",
            "voice": "alloy|echo|fable|onyx|nova|shimmer",
            "language": "fr|en|es|de"
        }
        """
        try:
            data = request.get_json(silent=True) or {}
            text = data.get('text', '').strip()
            voice = data.get('voice', 'nova')

            if not text:
                return jsonify({
                    'status': 'error',
                    'message': 'Texte vide'
                }), 400

            if len(text) > 4096:
                return jsonify({
                    'status': 'error',
                    'message': 'Le texte est trop long (max 4096 caractères)'
                }), 400

            # Vérifier que la clé API est configurée
            if not os.getenv('OPENAI_API_KEY'):
                return jsonify({
                    'status': 'error',
                    'message': 'Clé API OpenAI non configurée'
                }), 500

            # Initialiser le client OpenAI
            client = get_openai_client()
            if not client:
                return jsonify({
                    'status': 'error',
                    'message': 'Impossible de configurer le client OpenAI'
                }), 500

            # Générer l'audio via OpenAI TTS
            response = client.audio.speech.create(
                model="tts-1",
                voice=voice,
                input=text,
                response_format="mp3"
            )

            # Retourner l'audio en tant que fichier
            audio_file = io.BytesIO(response.content)
            return send_file(
                audio_file,
                mimetype='audio/mpeg',
                as_attachment=False,
                download_name='audio.mp3'
            )

        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'Erreur TTS: {str(e)}'
            }), 500


def build_system_prompt(action, context):
    """Construction du prompt système selon la thématique ciblée et l'action demandée"""
    base_prompt = "Tu es Apprenti, un assistant d'apprentissage expert et bienveillant, doter d'une excéllente capacité de réflexion. Tu aides les étudiants à mieux comprendre les concepts académiques."
    
    if context.get('type') == 'thematique':
        thematique = context.get('data', {})
        titre = thematique.get('titre', '')
        description = thematique.get('description', '')
        domaine = thematique.get('domaine', '')
        niveau = thematique.get('niveau', '')
        keywords = thematique.get('keywords', [])
        keywords_text = ', '.join(keywords) if isinstance(keywords, list) else ''
        base_prompt += (
            "\n\nContexte actuel - Thématique: {titre}\n"
            "Domaine: {domaine}\n"
            "Niveau: {niveau}\n"
            "Description: {description}\n"
            "Mots-clés: {keywords}"
        ).format(
            titre=titre,
            domaine=domaine,
            niveau=niveau,
            description=description,
            keywords=keywords_text
        )
    
    if action == 'explain':
        base_prompt += "\n\nTon rôle: Fournir des explications détaillées, avec des exemples concrets et en langage simple."
    elif action == 'translate':
        base_prompt += "\n\nTon rôle: Traduire précisément tout en conservant le sens académique."
    elif action == 'tts':
        base_prompt += "\n\nTon rôle: Reformuler le texte de manière naturelle et fluide pour une lecture audio."
    else:  # chat
        base_prompt += "\n\nTon rôle: Discuter et répondre aux questions de manière pédagogique."
    
    return base_prompt


def get_language_name(code):
    """Convertir le code de langue en nom complet"""
    languages = {
        'fr': 'français',
        'en': 'anglais',
        'es': 'espagnol',
        'de': 'allemand'
    }
    return languages.get(code, 'français')
