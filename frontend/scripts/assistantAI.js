/**
 * Script pour l'interface du chat Assistant IA
 */

const API_URL = 'http://localhost:5000/api/assistant';
const TTS_API_URL = 'http://localhost:5000/api/tts';
const THEMATIQUE_DETAIL_URL = 'http://localhost:5000/api/thematiques/detail';

class AssistantChat {
	constructor() {
		this.currentAction = 'chat';
		this.currentLanguage = 'fr';
		this.messageHistory = [];
		this.isLoading = false;
		this.currentAudio = null;
		this.context = null;
		this.setupEventListeners();
		this.loadContext();
	}

	setupEventListeners() {
		// Bouton d'envoi
		document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());

		// Entrée utilisateur (Ctrl+Entrée pour envoyer)
		document.getElementById('user-input').addEventListener('keydown', (e) => {
			if (e.ctrlKey && e.key === 'Enter') {
				this.sendMessage();
			}
		});

		// Sélecteur d'action (chat, expliquer, traduire...)
		document.getElementById('action-select').addEventListener('change', (e) => {
			this.setAction(e.target.value);
		});

		// Boutons d'actions rapides
		document.querySelectorAll('.quick-action').forEach(btn => {
			btn.addEventListener('click', () => {
				const action = btn.dataset.action;
				this.setAction(action);
				document.getElementById('action-select').value = action;
			});
		});

		// Sélecteur de langue
		document.getElementById('language-select').addEventListener('change', (e) => {
			this.currentLanguage = e.target.value;
		});

		// Fermer le contexte
		const closeContextBtn = document.getElementById('close-context');
		if (closeContextBtn) {
			closeContextBtn.addEventListener('click', () => {
				document.getElementById('context-panel').style.display = 'none';
			});
		}
	}

	setAction(action) {
		this.currentAction = action;
		const languageGroup = document.getElementById('language-group');

		// Affichage du sélecteur de langue selon l'action
		if (action === 'translate' || action === 'tts') {
			languageGroup.style.display = 'flex';
		} else {
			languageGroup.style.display = 'none';
		}

		// Changer le placeholder selon l'action
		const input = document.getElementById('user-input');
		const placeholders = {
			'chat': 'Posez votre question...',
			'explain': 'Collez le texte à expliquer...',
			'translate': 'Collez le texte à traduire...',
			'tts': 'Collez le texte à lire...'
		};
		input.placeholder = placeholders[action] || placeholders['chat'];
	}

	async loadContext() {
		// Vérifier s'il y a un contexte de thématique
		const iaContext = localStorage.getItem('iaContext');
		if (iaContext) {
			try {
				const context = JSON.parse(iaContext);
				this.context = context;
				if (context.type === 'thematique') {
					await this.ensureThematiqueDetails(context.data);
					this.displayContext(this.context.data);
				}
			} catch (error) {
				console.error('Erreur lors du chargement du contexte:', error);
			}
		}
	}

	async ensureThematiqueDetails(thematique) {
		if (!thematique || !thematique.id) return;

		const description = (thematique.description || '').trim();
		if (description.length >= 10) return;

		try {
			const url = new URL(THEMATIQUE_DETAIL_URL);
			url.searchParams.set('id', thematique.id);
			const response = await fetch(url.toString());
			if (!response.ok) {
				throw new Error(`Erreur API: ${response.status}`);
			}
			const data = await response.json();
			if (data.status === 'success' && data.data) {
				this.context.data = {
					...thematique,
					...data.data
				};
				localStorage.setItem('iaContext', JSON.stringify(this.context));
			}
		} catch (error) {
			console.error('Erreur lors du chargement de la thématique:', error);
		}
	}

	displayContext(thematique) {
		const contextPanel = document.getElementById('context-panel');
		const contextContent = document.getElementById('context-content');

		if (!contextPanel || !contextContent) return;

		contextContent.innerHTML = `
			<div class="context-item">
				<strong class="context-label">Thématique:</strong>
				<p class="context-value">${thematique.titre || 'N/A'}</p>
			</div>
			<div class="context-item">
				<strong class="context-label">Domaine:</strong>
				<p class="context-value">${thematique.domaine || 'Général'}</p>
			</div>
			<div class="context-item">
				<strong class="context-label">Niveau:</strong>
				<p class="context-value">${thematique.niveau || 'Intermédiaire'}</p>
			</div>
			<div class="context-item">
				<strong class="context-label">Description:</strong>
				<p class="context-value">${thematique.description || 'Aucune description disponible'}</p>
			</div>
		`;

		contextPanel.style.display = 'block';
	}

	async sendMessage() {
		const input = document.getElementById('user-input');
		const message = input.value.trim();

		if (!message || this.isLoading) return;

		// Ajouter le message utilisateur au chat
		this.addMessage(message, 'user');
		input.value = '';

		// Afficher l'indicateur de chargement
		this.setLoading(true);

		try {
			// Récupérer le contexte s'il existe
			const iaContext = this.context || {};

			// Envoyer la requête à l'API
			const response = await fetch(API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					message: message,
					action: this.currentAction,
					language: this.currentLanguage,
					context: iaContext
				})
			});

			if (!response.ok) {
				throw new Error(`Erreur API: ${response.status}`);
			}

			const data = await response.json();

			if (data.status === 'success') {
				this.addMessage(data.message, 'ai');
				
				// Ajouter un bouton de lecture audio si l'action est TTS
				if (this.currentAction === 'tts') {
					this.addAudioButton(data.message);
				}
				
				this.messageHistory.push({
					role: 'user',
					content: message,
					action: this.currentAction
				});
				this.messageHistory.push({
					role: 'assistant',
					content: data.message,
					action: this.currentAction
				});
			} else {
				this.addMessage(`Erreur: ${data.message}`, 'error');
			}
		} catch (error) {
			console.error('Erreur:', error);
			this.addMessage(
				`Erreur de communication: ${error.message}. Assurez-vous que le backend fonctionne et que votre clé API OpenAI est configurée.`,
				'error'
			);
		} finally {
			this.setLoading(false);
		}
	}

	addMessage(content, role = 'user') {
		const messagesContainer = document.getElementById('chat-messages');
		const messageDiv = document.createElement('div');

		const roleClass = role === 'user' ? 'message--user' : role === 'error' ? 'message--error' : 'message--ai';
		const avatar = role === 'user' ? '' : role === 'error' ? '' : '';

		messageDiv.className = `message ${roleClass}`;
		messageDiv.innerHTML = `
			<div class="message__avatar">${avatar}</div>
			<div class="message__content">
				<p>${this.escapeHtml(content)}</p>
			</div>
		`;

		messagesContainer.appendChild(messageDiv);

		// Scroll vers le bas
		messagesContainer.scrollTop = messagesContainer.scrollHeight;
	}

	addAudioButton(text) {
		const messagesContainer = document.getElementById('chat-messages');
		const audioControls = document.createElement('div');
		audioControls.className = 'message message--ai audio-controls';
		
		const audioId = `audio-${Date.now()}`;
		
		audioControls.innerHTML = `
			<div class="message__avatar"></div>
			<div class="message__content audio-content">
				<div class="audio-player">
					<button class="audio-play-btn" data-audio-id="${audioId}" data-text="${this.escapeHtmlAttr(text)}">
						▶ Écouter la lecture
					</button>
					<audio id="${audioId}" style="display: none;"></audio>
					<span class="audio-status"></span>
				</div>
			</div>
		`;
		
		messagesContainer.appendChild(audioControls);
		
		// Ajouter l'écouteur au bouton de lecture
		const playBtn = audioControls.querySelector('.audio-play-btn');
		playBtn.addEventListener('click', () => this.playAudio(playBtn, audioId, text));
		
		// Scroll vers le bas
		messagesContainer.scrollTop = messagesContainer.scrollHeight;
	}

	async playAudio(button, audioId, text) {
		const audio = document.getElementById(audioId);
		const status = button.nextElementSibling;
		
		// Si l'audio est déjà chargé, simplement jouer
		if (audio.src) {
			if (audio.paused) {
				audio.play();
				button.textContent = '⏸ Pause';
				status.textContent = 'Lecture en cours...';
			} else {
				audio.pause();
				button.textContent = '▶ Reprendre';
				status.textContent = '';
			}
			return;
		}
		
		// Générer l'audio
		button.disabled = true;
		button.textContent = ' Génération...';
		status.textContent = 'Génération du fichier audio...';
		
		try {
			const response = await fetch(TTS_API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					text: text,
					voice: 'nova',
					language: this.currentLanguage
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || `Erreur ${response.status}`);
			}

			const blob = await response.blob();
			audio.src = URL.createObjectURL(blob);
			
			audio.onended = () => {
				button.textContent = '▶ Réécouter';
				status.textContent = '';
			};
			
			audio.play();
			button.disabled = false;
			button.textContent = '⏸ Pause';
			status.textContent = 'Lecture en cours...';
			
		} catch (error) {
			console.error('Erreur TTS:', error);
			status.textContent = `Erreur: ${error.message}`;
			button.disabled = false;
			button.textContent = '▶ Réessayer';
		}
	}

	escapeHtml(text) {
		const map = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'
		};
		return text.replace(/[&<>"']/g, m => map[m]);
	}

	escapeHtmlAttr(text) {
		const map = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'
		};
		return text.replace(/[&<>"']/g, m => map[m]);
	}

	setLoading(isLoading) {
		this.isLoading = isLoading;
		const loadingDiv = document.getElementById('loading');
		if (loadingDiv) {
			loadingDiv.style.display = isLoading ? 'flex' : 'none';
		}

		const sendBtn = document.getElementById('send-btn');
		sendBtn.disabled = isLoading;
		sendBtn.style.opacity = isLoading ? '0.5' : '1';
	}
}

// Initialiser le chat au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
	new AssistantChat();
});
