// Sidebar Menu Interaction Script
// Handles menu expansion and navigation

(function() {
    'use strict';

    function init() {
        setupMenuInteractions();
    }

    function setupMenuInteractions() {
        // Handle main submenu toggle
        document.querySelectorAll('.nav-item.has-submenu > .nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const parent = this.parentElement;
                const isActive = parent.classList.contains('active');
                
                // Close all other main submenus
                document.querySelectorAll('.nav-item.has-submenu').forEach(item => {
                    if (item !== parent) {
                        item.classList.remove('active');
                        item.querySelector('.nav-arrow').textContent = '▶';
                    }
                });
                
                // Toggle current submenu
                if (isActive) {
                    parent.classList.remove('active');
                    this.querySelector('.nav-arrow').textContent = '▶';
                } else {
                    parent.classList.add('active');
                    this.querySelector('.nav-arrow').textContent = '▼';
                }
            });
        });

        // Handle nested submenu toggle
        document.querySelectorAll('.submenu-item.has-nested-submenu > .submenu-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const parent = this.parentElement;
                const isActive = parent.classList.contains('active');
                
                // Toggle nested submenu
                if (isActive) {
                    parent.classList.remove('active');
                } else {
                    parent.classList.add('active');
                }
            });
        });

        // Keep submenu open if it contains active item
        document.querySelectorAll('.submenu-item.active, .nested-submenu-item.active').forEach(item => {
            const parent = item.closest('.nav-item.has-submenu');
            if (parent) {
                parent.classList.add('active');
                const arrow = parent.querySelector('.nav-arrow');
                if (arrow) arrow.textContent = '▼';
            }
            
            // Also open nested submenu if nested item is active
            const nestedParent = item.closest('.submenu-item.has-nested-submenu');
            if (nestedParent) {
                nestedParent.classList.add('active');
                const nestedArrow = nestedParent.querySelector('.nested-arrow');
                if (nestedArrow) nestedArrow.textContent = '▼';
            }
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
