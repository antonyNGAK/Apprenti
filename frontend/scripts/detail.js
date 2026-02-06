/**
 * Script de gestion de la page de détail d'une thématique
 */

let currentThematique = null;

function loadThematiqueDetail() {
	// Récupérer la thématique depuis localStorage
	const thematiqueJson = localStorage.getItem('selectedThematique');

	if (!thematiqueJson) {
		// Pas de thématique sélectionnée, rediriger vers l'accueil
		window.location.href = 'index.html';
		return;
	}

	try {
		const thematique = JSON.parse(thematiqueJson);
		currentThematique = thematique;
		displayThematiqueDetail(thematique);
		setupIAButton();
		// Nettoyer localStorage après affichage
		localStorage.removeItem('selectedThematique');
	} catch (error) {
		console.error('Erreur lors de la lecture des données:', error);
		window.location.href = 'index.html';
	}
}

function displayThematiqueDetail(thematique) {
	// Mettre à jour le titre
	const titleElement = document.getElementById('detail-title');
	if (titleElement) {
		titleElement.textContent = thematique.titre || 'Thématique sans titre';
	}

	// Mettre à jour le niveau dans le header
	const niveauHeaderElement = document.getElementById('detail-niveau');
	if (niveauHeaderElement) {
		niveauHeaderElement.textContent = thematique.niveau || 'Niveau non spécifié';
	}

	// Mettre à jour la description
	const descElement = document.getElementById('detail-description');
	if (descElement) {
		descElement.textContent = thematique.description || 'Aucune description disponible.';
	}

	// Mettre à jour le domaine
	const domaineElement = document.getElementById('detail-domaine');
	if (domaineElement) {
		domaineElement.textContent = thematique.domaine || 'Général';
	}

	// Mettre à jour le niveau badge
	const niveauBadgeElement = document.getElementById('detail-niveau-badge');
	if (niveauBadgeElement) {
		niveauBadgeElement.textContent = thematique.niveau || 'Intermédiaire';
		// Ajouter une classe CSS basée sur le niveau
		niveauBadgeElement.className = 'detail-meta__niveau';
		if (thematique.niveau === 'Débutant') {
			niveauBadgeElement.classList.add('detail-meta__niveau--beginner');
		} else if (thematique.niveau === 'Avancé') {
			niveauBadgeElement.classList.add('detail-meta__niveau--advanced');
		} else {
			niveauBadgeElement.classList.add('detail-meta__niveau--intermediate');
		}
	}

	// Mettre à jour l'ID
	const idElement = document.getElementById('detail-id');
	if (idElement) {
		idElement.textContent = thematique.id || 'ID non disponible';
		idElement.title = 'Identifiant unique de la thématique';
	}

	// Afficher les mots-clés s'ils existent
	if (thematique.keywords && Array.isArray(thematique.keywords) && thematique.keywords.length > 0) {
		const keywordsSection = document.getElementById('keywords-section');
		const keywordsList = document.getElementById('detail-keywords');

		if (keywordsSection && keywordsList) {
			keywordsList.innerHTML = '';
			thematique.keywords.forEach(keyword => {
				const tag = document.createElement('span');
				tag.className = 'keyword-tag';
				tag.textContent = keyword;
				keywordsList.appendChild(tag);
			});
			keywordsSection.style.display = 'block';
		}
	}

	// Mettre à jour le titre de la page HTML
	document.title = `${thematique.titre || 'Détail'} - Apprenti`;
}

function setupIAButton() {
	const iaBtn = document.getElementById('ia-agent-btn');
	if (!iaBtn) return;

	iaBtn.addEventListener('click', () => {
		if (currentThematique) {
			// Stocker la thématique comme contexte pour l'agent IA
			localStorage.setItem('iaContext', JSON.stringify({
				type: 'thematique',
				data: currentThematique
			}));
			
			// Rediriger vers la page du chat IA (assistantAI.html)
			window.location.href = 'assistantAI.html';
		}
	});
}

// Charger les détails au chargement de la page
document.addEventListener('DOMContentLoaded', loadThematiqueDetail);
