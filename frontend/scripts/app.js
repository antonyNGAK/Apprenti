import { thematiques as fallbackThematiques } from './thematiques.js';

const sourceConfig = {
	type: 'api',
	url: 'http://localhost:5000/api/thematiques'
};

class ThematiqueCard {
	constructor(thematique) {
		this.thematique = thematique;
	}

	render() {
		const article = document.createElement('article');
		article.className = 'card';
		article.setAttribute('tabindex', '0');
		article.style.cursor = 'pointer';

		const title = document.createElement('h2');
		title.className = 'card__title';
		title.textContent = this.thematique.titre;

		const meta = document.createElement('div');
		meta.className = 'card__meta';
		const dot = document.createElement('span');
		dot.className = 'card__meta-dot';
		const niveau = document.createElement('span');
		niveau.textContent = this.thematique.niveau;
		meta.append(dot, niveau);

		article.append(title, meta);

		// Gestionnaire de clic pour naviguer vers le détail
		article.addEventListener('click', () => {
			this.navigateToDetail();
		});

		// Support clavier (Enter et Espace)
		article.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				this.navigateToDetail();
			}
		});

		return article;
	}

	navigateToDetail() {
		// Stocker la thématique dans localStorage
		localStorage.setItem('selectedThematique', JSON.stringify(this.thematique));
		// Rediriger vers la page de détail
		window.location.href = 'detail.html';
	}
}

class ThematiqueGallery {
	constructor(rootId) {
		this.root = document.getElementById(rootId);
	}

	mount(collection = []) {
		if (!this.root) {
			console.warn('Impossible de trouver la racine pour le rendu des thématiques.');
			return;
		}

		const fragment = document.createDocumentFragment();
		collection.forEach(item => {
			const card = new ThematiqueCard(item);
			fragment.appendChild(card.render());
		});

		this.root.innerHTML = '';
		this.root.appendChild(fragment);
	}
}

class ThematiqueRepository {
	constructor(config) {
		this.config = config;
	}

	async load() {
		if (!this.config || !this.config.url) {
			return fallbackThematiques;
		}

		if (this.config.type === 'api') {
			const data = await this.fetchApi(this.config.url);
			return Array.isArray(data) ? data : [];
		}

		if (this.config.type === 'json') {
			const data = await this.fetchJson(this.config.url);
			return Array.isArray(data) ? data : [];
		}

		return fallbackThematiques;
	}

	async fetchApi(url) {
		try {
			const response = await fetch(url, { cache: 'no-cache' });
			if (!response.ok) {
				throw new Error(`Chargement échoué (${response.status})`);
			}
			const payload = await response.json();
			
			if (payload.status === 'success' && Array.isArray(payload.data)) {
				return payload.data.map(item => ({
					id: item.id,
					titre: item.titre,
					description: item.description,
					niveau: item.niveau || 'Intermédiaire',
					domaine: item.domaine || 'Général'
				}));
			}
			
			throw new Error('Format de réponse invalide');
		} catch (error) {
			console.error('Erreur lors du chargement depuis l\'API:', error);
			throw error;
		}
	}

	async fetchJson(url) {
		const response = await fetch(url, { cache: 'no-cache' });
		if (!response.ok) {
			throw new Error(`Chargement échoué (${response.status})`);
		}
		const payload = await response.json();
		return payload.map(item => ({
			id: item.id,
			titre: item.titre,
			description: item.description,
			niveau: item.niveau,
			domaine: item.domaine
		}));
	}
}

const gallery = new ThematiqueGallery('thematique-grid');
const repository = new ThematiqueRepository(sourceConfig);

// Fonction pour déterminer le nombre de thématiques à afficher selon la page
function getMaxThematiques() {
	const currentPage = window.location.pathname.split('/').pop() || 'index.html';
	// Page thématiques: 15, page d'accueil: 6
	return currentPage === 'thematiques.html' ? 15 : 6;
}

async function bootstrap() {
	let dataset = fallbackThematiques;
	try {
		dataset = await repository.load();
	} catch (error) {
		console.warn('Retour aux données locales suite à une erreur de chargement.', error);
	}

	// Filtrer le nombre de thématiques selon la page
	const maxThematiques = getMaxThematiques();
	const filteredDataset = dataset.slice(0, maxThematiques);

	gallery.mount(filteredDataset);
}

document.addEventListener('DOMContentLoaded', bootstrap);

