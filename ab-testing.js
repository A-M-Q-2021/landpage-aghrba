/**
 * A/B Testing System - Optimized Version
 * Handles variant assignment, tracking, and implementation
 * 
 * @author Professional Developer
 * @version 2.2
 * @license MIT
 */

(function() {
    'use strict';
    
    // Configuration
    const AB_TEST_CONFIG = {
        tests: {
            'hero_headline': ['A', 'B'],
            'why_now_text': ['A', 'B'],
            'cta_button_color': ['blue', 'yellow']
        },
        cookieExpiryDays: 30,
        localStoragePrefix: 'ab_test_',
        analyticsEnabled: true
    };

    // Main A/B testing class
    class ABTesting {
        constructor(config) {
            this.config = config;
            this.variants = {};
            this.initialize();
        }

        /**
         * Initialize A/B tests
         */
        initialize() {
            // Check if we're in preview mode
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('ab_preview')) {
                this.handlePreviewMode(urlParams);
                return;
            }

            // Assign variants for each test
            Object.keys(this.config.tests).forEach(testName => {
                this.assignVariant(testName);
            });

            // Apply variants to the page
            this.applyVariants();
            
            // Track impressions
            this.trackImpressions();
        }

        /**
         * Handle preview mode for testing
         */
        handlePreviewMode(params) {
            const testName = params.get('ab_preview');
            const variant = params.get('variant');
            
            if (testName && variant && this.config.tests[testName] && this.config.tests[testName].includes(variant)) {
                // Set variant for preview
                localStorage.setItem(`${this.config.localStoragePrefix}${testName}`, variant);
                this.variants[testName] = variant;
                
                // Apply variants
                this.applyVariants();
                
                // Add preview indicator
                this.addPreviewIndicator(testName, variant);
            }
        }

        /**
         * Add preview indicator to the page
         */
        addPreviewIndicator(testName, variant) {
            // First, remove any existing preview indicators
            const existingIndicator = document.querySelector('.ab-preview-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
            
            const indicator = document.createElement('div');
            indicator.className = 'ab-preview-indicator';
            indicator.style.position = 'fixed';
            indicator.style.bottom = '20px';
            indicator.style.right = '20px';
            indicator.style.backgroundColor = '#28a745';
            indicator.style.color = 'white';
            indicator.style.padding = '10px 15px';
            indicator.style.borderRadius = '5px';
            indicator.style.zIndex = '9999';
            indicator.style.fontFamily = 'Arial, sans-serif';
            indicator.style.fontSize = '14px';
            indicator.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            indicator.style.cursor = 'default';
            
            indicator.innerHTML = `
                <strong>A/B Preview Mode</strong><br>
                Test: ${testName}<br>
                Variant: ${variant}
            `;
            
            document.body.appendChild(indicator);
            
            // Add close button
            const closeButton = document.createElement('span');
            closeButton.innerHTML = '&times;';
            closeButton.style.position = 'absolute';
            closeButton.style.top = '5px';
            closeButton.style.right = '10px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.fontSize = '18px';
            closeButton.style.fontWeight = 'bold';
            closeButton.style.color = 'white';
            closeButton.addEventListener('click', () => {
                document.body.removeChild(indicator);
                localStorage.removeItem(`${this.config.localStoragePrefix}${testName}`);
                window.location.reload();
            });
            
            indicator.appendChild(closeButton);
        }

        /**
         * Assign a variant for a specific test
         * @param {string} testName - The name of the test
         */
        assignVariant(testName) {
            // Check if variant is already set
            const storedVariant = localStorage.getItem(`${this.config.localStoragePrefix}${testName}`);
            if (storedVariant && this.config.tests[testName].includes(storedVariant)) {
                this.variants[testName] = storedVariant;
                return;
            }

            // Get variant from URL parameters (for testing)
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has(`ab_${testName}`)) {
                const paramVariant = urlParams.get(`ab_${testName}`);
                if (this.config.tests[testName].includes(paramVariant)) {
                    this.variants[testName] = paramVariant;
                    localStorage.setItem(`${this.config.localStoragePrefix}${testName}`, paramVariant);
                    return;
                }
            }

            // Randomly assign a variant
            const variants = this.config.tests[testName];
            const randomIndex = Math.floor(Math.random() * variants.length);
            const selectedVariant = variants[randomIndex];
            
            // Store variant
            this.variants[testName] = selectedVariant;
            localStorage.setItem(`${this.config.localStoragePrefix}${testName}`, selectedVariant);
        }

        /**
         * Apply variants to the page
         */
        applyVariants() {
            Object.keys(this.variants).forEach(testName => {
                const variant = this.variants[testName];
                
                switch(testName) {
                    case 'hero_headline':
                        this.applyHeroHeadlineVariant(variant);
                        break;
                    case 'why_now_text':
                        this.applyWhyNowTextVariant(variant);
                        break;
                    case 'cta_button_color':
                        this.applyCtaButtonColorVariant(variant);
                        break;
                }
            });
        }

        /**
         * Apply hero headline variant
         * @param {string} variant - The variant to apply
         */
        applyHeroHeadlineVariant(variant) {
            const heroSection = document.getElementById('hero');
            if (!heroSection) return;
            
            heroSection.setAttribute('data-variant', variant);
            
            const title = heroSection.querySelector('.hero__title');
            if (!title) return;
            
            if (variant === 'B') {
                title.innerHTML = 'وقف هدر الفلوس على إعلانات ما تجيب نتيجة… <span class="hero__title-highlight">نضمن الزيادة وإلا ما تدفع</span>';
            } else {
                title.innerHTML = '<span class="hero__title-highlight">نرفع مبيعات مشروعك خلال ٩٠ يوم…</span> وإلا نرجّع رسومنا';
            }
        }

        /**
         * Apply why now text variant
         * @param {string} variant - The variant to apply
         */
        applyWhyNowTextVariant(variant) {
            const whyNowSection = document.getElementById('why-now');
            if (!whyNowSection) return;
            
            whyNowSection.setAttribute('data-variant', variant);
            
            const urgencyFinal = document.getElementById('urgency-final');
            if (!urgencyFinal) return;
            
            if (variant === 'B') {
                urgencyFinal.textContent = 'كل أسبوع تأخير = تكاليف أعلى ونمو أبطأ — خلّنا نبدأ بخطة واضحة.';
            } else {
                urgencyFinal.textContent = 'مقاعد الشراكة لهالشهر قربت تكتمل — احجز قبل ما تقفل.';
            }
        }

        /**
         * Apply CTA button color variant
         * @param {string} variant - The variant to apply
         */
        applyCtaButtonColorVariant(variant) {
            const ctaButtons = document.querySelectorAll('[data-cta-id]');
            if (!ctaButtons.length) return;
            
            ctaButtons.forEach(button => {
                button.setAttribute('data-variant', variant);
                
                if (variant === 'yellow') {
                    button.classList.remove('btn--primary');
                    button.classList.add('btn--yellow');
                    button.style.background = '#F2C526';
                    button.style.color = '#000';
                } else {
                    button.classList.remove('btn--yellow');
                    button.classList.add('btn--primary');
                    button.style.background = '';
                    button.style.color = '';
                }
            });
        }

        /**
         * Track test impressions
         */
        trackImpressions() {
            if (!this.config.analyticsEnabled) return;
            
            Object.keys(this.variants).forEach(testName => {
                const variant = this.variants[testName];
                
                // Google Analytics 4
                if (window.gtag) {
                    try {
                        gtag('event', 'ab_test_impression', {
                            'test_name': testName,
                            'variant': variant
                        });
                    } catch (e) {
                        console.error('GA4 tracking error:', e);
                    }
                }
                
                // Meta Pixel
                if (window.fbq) {
                    try {
                        fbq('trackCustom', 'AB_Test_Impression', {
                            test_name: testName,
                            variant: variant
                        });
                    } catch (e) {
                        console.error('Meta Pixel tracking error:', e);
                    }
                }
                
                // Console logging
                console.log(`[A/B Testing] Impression: ${testName} - ${variant}`);
            });
        }

        /**
         * Track conversion for a test
         * @param {string} testName - The name of the test
         * @param {string} conversionType - Type of conversion
         */
        trackConversion(testName, conversionType = 'click') {
            if (!this.config.analyticsEnabled) return;
            
            const variant = this.variants[testName];
            if (!variant) return;
            
            // Google Analytics 4
            if (window.gtag) {
                try {
                    gtag('event', 'ab_test_conversion', {
                        'test_name': testName,
                        'variant': variant,
                        'conversion_type': conversionType
                    });
                } catch (e) {
                    console.error('GA4 conversion tracking error:', e);
                }
            }
            
            // Meta Pixel
            if (window.fbq) {
                try {
                    fbq('trackCustom', 'AB_Test_Conversion', {
                        test_name: testName,
                        variant: variant,
                        conversion_type: conversionType
                    });
                } catch (e) {
                    console.error('Meta Pixel conversion tracking error:', e);
                }
            }
            
            console.log(`[A/B Testing] Conversion: ${testName} - ${variant} (${conversionType})`);
        }
    }

    // Initialize A/B testing system
    document.addEventListener('DOMContentLoaded', function() {
        // Wait for other scripts to initialize
        setTimeout(() => {
            try {
                window.abTesting = new ABTesting(AB_TEST_CONFIG);
                
                // Track CTA clicks for conversion tracking
                document.addEventListener('click', function(e) {
                    const cta = e.target.closest('[data-cta-id]');
                    if (!cta) return;
                    
                    const ctaId = cta.getAttribute('data-cta-id');
                    
                    if (window.abTesting) {
                        if (ctaId === 'hero_primary') {
                            window.abTesting.trackConversion('hero_headline', 'cta_click');
                        } else if (ctaId === 'header_cta' || ctaId === 'sticky_cta') {
                            window.abTesting.trackConversion('cta_button_color', 'cta_click');
                        }
                    }
                });
            } catch (e) {
                console.error('A/B Testing initialization error:', e);
            }
        }, 500);
    });

    // Export for testing
    if (typeof window !== 'undefined') {
        window.ABTesting = ABTesting;
    }
})();