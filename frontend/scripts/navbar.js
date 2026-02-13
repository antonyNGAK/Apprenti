/**
 * Script pour la barre de navigation
 */

document.addEventListener('DOMContentLoaded', function() {
	const navbarToggle = document.querySelector('.navbar__toggle');
	const navbarMenu = document.querySelector('.navbar__menu');

	if (navbarToggle && navbarMenu) {
		navbarToggle.addEventListener('click', function() {
			navbarMenu.classList.toggle('active');
		});

		// Fermer le menu quand on clique sur un lien
		const navLinks = navbarMenu.querySelectorAll('.navbar__link');
		navLinks.forEach(link => {
			link.addEventListener('click', function() {
				navbarMenu.classList.remove('active');
			});
		});
	}

	// comportement du lien actif
	const currentPage = window.location.pathname.split('/').pop() || 'index.html';
	const navLinks = document.querySelectorAll('.navbar__link');
	navLinks.forEach(link => {
		const href = link.getAttribute('href');
		if (href === currentPage || (currentPage === '' && href === 'index.html')) {
			link.classList.add('navbar__link--active');
		}
	});
});
