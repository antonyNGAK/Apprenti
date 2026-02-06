class Thematique {
	constructor({ id, titre, description, niveau, domaine }) {
		this.id = id;
		this.titre = titre;
		this.description = description;
		this.niveau = niveau;
		this.domaine = domaine;
	}
}
// Affichage par défaut des thématiques en l'absence de source externe (API ou fichier JSON)
const ThematiqueData = [
	{
		id: 'oop-architecture',
		titre: 'Architecture orientée objet',
		description: 'Principes SOLID, design patterns et structuration modulaire pour des systèmes évolutifs.',
		niveau: 'Intermédiaire',
		domaine: 'Conception'
	},
	{
		id: 'oop-heritage',
		titre: 'Héritage et composition',
		description: 'Comparer héritage et composition pour construire des hiérarchies souples et réutilisables.',
		niveau: 'Débutant',
		domaine: 'Fondamentaux'
	},
	{
		id: 'oop-interfaces',
		titre: 'Interfaces et contrats',
		description: 'Utiliser des interfaces pour exprimer des contrats explicites et limiter le couplage.',
		niveau: 'Intermédiaire',
		domaine: 'Conception'
	},
	{
		id: 'oop-polymorphisme',
		titre: 'Polymorphisme',
		description: 'Déléguer le comportement via le polymorphisme plutôt que des instructions conditionnelles.',
		niveau: 'Avancé',
		domaine: 'Patrons de conception'
	},
	{
		id: 'oop-tdd',
		titre: 'Tests unitaires en OOP',
		description: 'Isoler les dépendances avec des doubles de test pour sécuriser le refactoring.',
		niveau: 'Intermédiaire',
		domaine: 'Qualité'
	},
	{
		id: 'oop-clean',
		titre: 'Code propre',
		description: 'Nommer, découper et documenter des objets pour la lisibilité et la maintenabilité.',
		niveau: 'Débutant',
		domaine: 'Pratiques'
	}
];

export const thematiques = ThematiqueData.map(item => new Thematique(item));
