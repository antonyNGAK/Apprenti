from flask import Flask, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Importer les routes des modules
from routes.thematiques import register_thematiques_routes
from routes.assistantAI import register_assistant_routes

# Charger les variables d'environnement
ENV_PATH = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(ENV_PATH)

app = Flask(__name__)
CORS(app)

# Enregistrer les routes des modules
register_thematiques_routes(app)
register_assistant_routes(app)

@app.route('/api/health', methods=['GET'])
def health():
    """Endpoint de vérification du serveur"""
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
