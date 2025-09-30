/**
 * Main JavaScript - Enhanced Version
 * Handles core functionality of the landing page
 * 
 * @author Professional Developer
 * @version 2.1
 * @license MIT
 */

(function() {
    'use strict';

    // Core functionality
    class Main {
        constructor() {
            this.init();
        }

        init() {
            this.setupHeader();
            this.setupScrollAnimations();
            this.setupSmoothScrolling();
            this.setupStickyCTA();
            this.setupFormNavigation();
            this.setupAccessibility();
            this.setupPerformanceMonitoring();
        }

        /**
         * Set up header functionality
         */
        setupHeader() {
            const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
            const headerNav = document.querySelector('.header__nav');
            
            if (mobileMenuToggle && headerNav) {
                mobileMenuToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
            }

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (headerNav && headerNav.classList.contains('header__nav--open') && 
                    !e.target.closest('.header__nav') && !e.target.closest('.mobile-menu-toggle')) {
                    this.closeMobileMenu();
                }
            });
        }

        /**
         * Toggle mobile menu
         */
        toggleMobileMenu() {
            const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
            const headerNav = document.querySelector('.header__nav');
            
            if (!mobileMenuToggle || !headerNav) return;
            
            const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
            
            if (isExpanded) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        }

        /**
         * Open mobile menu
         */
        openMobileMenu() {
            const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
            const headerNav = document.querySelector('.header__nav');
            
            if (mobileMenuToggle && headerNav) {
                mobileMenuToggle.setAttribute('aria-expanded', 'true');
                headerNav.classList.add('header__nav--open');
                mobileMenuToggle.focus();
                
                // Add no-scroll class to body
                document.body.classList.add('no-scroll');
            }
        }

        /**
         * Close mobile menu
         */
        closeMobileMenu() {
            const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
            const headerNav = document.querySelector('.header__nav');
            
            if (mobileMenuToggle && headerNav) {
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                headerNav.classList.remove('header__nav--open');
                document.body.classList.remove('no-scroll');
            }
        }

        /**
         * Set up scroll animations
         */
        setupScrollAnimations() {
            const observerOptions = {
                root: null,
                rootMargin: '0px',
                threshold: 0.15
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('reveal--visible');
                    }
                });
            }, observerOptions);

            // Observe elements with reveal class
            document.querySelectorAll('.reveal').forEach(el => {
                el.classList.add('reveal--hidden');
                observer.observe(el);
            });
        }

        /**
         * Set up smooth scrolling for anchor links
         */
        setupSmoothScrolling() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', this.handleAnchorClick.bind(this));
            });
        }

        /**
         * Handle anchor click
         */
        handleAnchorClick(e) {
            e.preventDefault();
            const targetId = e.currentTarget.getAttribute('href');
            const target = document.querySelector(targetId);
            
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed header
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                this.closeMobileMenu();
                
                // Update URL hash without page reload
                if (history.pushState) {
                    history.pushState(null, null, targetId);
                } else {
                    window.location.hash = targetId;
                }
            }
        }

        /**
         * Set up sticky CTA for mobile
         */
        setupStickyCTA() {
            const stickyCTA = document.getElementById('sticky-cta');
            
            if (!stickyCTA) return;
            
            const handleStickyCTA = () => {
                if (window.innerWidth <= 768) {
                    stickyCTA.style.display = 'flex';
                } else {
                    stickyCTA.style.display = 'none';
                }
            };
            
            // Initial check
            handleStickyCTA();
            
            // On resize
            window.addEventListener('resize', handleStickyCTA);
            
            // Auto-hide sticky CTA when form is visible
            const formSection = document.getElementById('cta-form');
            if (formSection && stickyCTA) {
                const formObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            stickyCTA.style.display = 'none';
                        } else if (window.innerWidth <= 768) {
                            stickyCTA.style.display = 'flex';
                        }
                    });
                }, { threshold: 0.1 });
                
                formObserver.observe(formSection);
            }
        }

        /**
         * Set up form navigation
         */
        setupFormNavigation() {
            window.formNavigation = {
                currentStep: 1,
                maxSteps: 2,
                
                nextStep() {
                    const current = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
                    const next = document.querySelector(`.form-step[data-step="${this.currentStep + 1}"]`);
                    
                    if (current && next) {
                        // Validate current step
                        if (this.validateStep(this.currentStep)) {
                            current.classList.remove('active');
                            next.classList.add('active');
                            this.currentStep++;
                            this.updateProgressBar();
                            
                            // Scroll to form if needed
                            if (window.innerWidth <= 768) {
                                const formContainer = document.getElementById('form-container');
                                if (formContainer) {
                                    formContainer.scrollIntoView({ behavior: 'smooth' });
                                }
                            }
                        }
                    }
                },
                
                prevStep() {
                    const current = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
                    const prev = document.querySelector(`.form-step[data-step="${this.currentStep - 1}"]`);
                    
                    if (current && prev) {
                        current.classList.remove('active');
                        prev.classList.add('active');
                        this.currentStep--;
                        this.updateProgressBar();
                    }
                },
                
                validateStep(step) {
                    const stepElement = document.querySelector(`.form-step[data-step="${step}"]`);
                    if (!stepElement) return false;
                    
                    let isValid = true;
                    const requiredFields = stepElement.querySelectorAll('[required]');
                    
                    requiredFields.forEach(field => {
                        if (!field.value.trim()) {
                            field.classList.add('border-danger');
                            isValid = false;
                        } else {
                            field.classList.remove('border-danger');
                        }
                    });
                    
                    return isValid;
                },
                
                updateProgressBar() {
                    const progress = (this.currentStep / this.maxSteps) * 100;
                    
                    // Update any progress indicators if needed
                    console.log(`Form progress: ${progress}%`);
                }
            };
            
            // Initialize form navigation buttons
            const nextButtons = document.querySelectorAll('[data-action="next"]');
            const backButtons = document.querySelectorAll('[data-action="back"]');
            
            nextButtons.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.formNavigation.nextStep();
                });
            });
            
            backButtons.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.formNavigation.prevStep();
                });
            });
        }

        /**
         * Set up accessibility features
         */
        setupAccessibility() {
            // Skip to content link
            const skipLink = document.querySelector('.skip-link');
            if (skipLink) {
                skipLink.addEventListener('focus', function() {
                    document.body.style.scrollBehavior = 'auto';
                });
                
                skipLink.addEventListener('blur', function() {
                    document.body.style.scrollBehavior = 'smooth';
                });
            }
            
            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                // ESC key to close mobile menu
                if (e.key === 'Escape') {
                    this.closeMobileMenu();
                }
            });
        }

        /**
         * Set up performance monitoring
         */
        setupPerformanceMonitoring() {
            if ('performance' in window) {
                window.addEventListener('load', function() {
                    setTimeout(() => {
                        const perfData = performance.getEntriesByType('navigation')[0];
                        if (perfData) {
                            const loadTime = perfData.loadEventEnd - perfData.fetchStart;
                            console.log(`Page loaded in ${loadTime}ms`);
                            
                            // Track performance in analytics if needed
                        }
                    }, 0);
                });
            }
        }

        /**
         * Get the current scroll position
         * @returns {number} Scroll position
         */
        getScrollPosition() {
            return window.scrollY || document.documentElement.scrollTop;
        }

        /**
         * Check if element is in viewport
         * @param {Element} el - The element to check
         * @param {number} offset - Optional offset
         * @returns {boolean} Whether element is in viewport
         */
        isElementInViewport(el, offset = 0) {
            const rect = el.getBoundingClientRect();
            return (
                rect.top <= (window.innerHeight || document.documentElement.clientHeight) - offset &&
                rect.bottom >= 0
            );
        }
    }

    // Initialize main functionality
    document.addEventListener('DOMContentLoaded', function() {
        // Wait for other scripts to initialize
        setTimeout(() => {
            window.main = new Main();
            
            // Add class to body after initial load for smooth animations
            document.body.classList.add('loaded');
        }, 100);
    });

    // Export for testing
    if (typeof window !== 'undefined') {
        window.Main = Main;
    }
})();