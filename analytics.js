/**
 * Analytics System - Optimized Version
 * Handles tracking user behavior and conversions
 * 
 * @author Professional Developer
 * @version 2.2
 * @license MIT
 */

(function() {
    'use strict';
    
    // Configuration
    const ANALYTICS_CONFIG = {
        trackScrollDepth: true,
        trackTimeOnPage: true,
        trackFormAbandonment: true,
        trackOutboundLinks: true,
        trackSession: true,
        trackDevice: true,
        trackPerformance: true,
        scrollDepthThresholds: [25, 50, 75, 100],
        sessionExpiryMinutes: 30,
        analyticsEnabled: true
    };

    // Analytics class
    class Analytics {
        constructor(config) {
            this.config = config;
            this.scrollTracked = {};
            this.sessionId = null;
            this.sessionStart = null;
            this.timeOnPage = 0;
            this.formStarted = false;
            this.formCompleted = false;
            
            // Initialize scroll tracking
            this.config.scrollDepthThresholds.forEach(threshold => {
                this.scrollTracked[threshold] = false;
            });
            
            this.init();
        }

        /**
         * Initialize analytics system
         */
        init() {
            if (!this.config.analyticsEnabled) return;
            
            this.initializeSession();
            this.setupEventListeners();
            this.trackDeviceInfo();
            this.setupPerformanceTracking();
        }

        /**
         * Initialize session
         */
        initializeSession() {
            const sessionId = localStorage.getItem('session_id');
            const sessionStart = localStorage.getItem('session_start');
            
            if (sessionId && sessionStart) {
                this.sessionId = sessionId;
                this.sessionStart = new Date(sessionStart);
                
                // Check if session is still valid
                const now = new Date();
                const sessionDuration = (now - this.sessionStart) / 60000; // minutes
                
                if (sessionDuration > this.config.sessionExpiryMinutes) {
                    this.createNewSession();
                }
            } else {
                this.createNewSession();
            }
        }

        /**
         * Create new session
         */
        createNewSession() {
            const now = new Date();
            this.sessionId = `sess_${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`;
            this.sessionStart = now;
            
            localStorage.setItem('session_id', this.sessionId);
            localStorage.setItem('session_start', this.sessionStart.toISOString());
        }

        /**
         * Setup event listeners
         */
        setupEventListeners() {
            // Track CTA clicks
            document.addEventListener('click', this.trackCTAClick.bind(this));
            
            // Track form interactions
            if (this.config.trackFormAbandonment) {
                this.setupFormTracking();
            }
            
            // Track scroll depth
            if (this.config.trackScrollDepth) {
                window.addEventListener('scroll', this.trackScrollDepth.bind(this));
            }
            
            // Track time on page
            if (this.config.trackTimeOnPage) {
                this.startTimeOnPageTracking();
            }
            
            // Track outbound links
            if (this.config.trackOutboundLinks) {
                document.addEventListener('click', this.trackOutboundLinks.bind(this));
            }
        }

        /**
         * Track CTA clicks
         */
        trackCTAClick(e) {
            const cta = e.target.closest('[data-cta-id]');
            if (!cta) return;
            
            const ctaId = cta.getAttribute('data-cta-id');
            const ctaText = cta.textContent.trim();
            const ctaPosition = this.getElementPosition(cta);
            
            // Enhanced tracking data
            const trackingData = {
                cta_id: ctaId,
                cta_text: ctaText,
                position: ctaPosition,
                page_url: window.location.href,
                timestamp: new Date().toISOString(),
                session_id: this.sessionId
            };
            
            // Google Analytics 4
            if (window.gtag) {
                try {
                    gtag('event', 'cta_click', {
                        'event_category': 'CTA',
                        'event_label': ctaId,
                        'value': 1,
                        'cta_text': ctaText,
                        'cta_position': ctaPosition
                    });
                } catch (e) {
                    console.error('GA4 CTA tracking error:', e);
                }
            }
            
            // Meta Pixel
            if (window.fbq) {
                try {
                    fbq('trackCustom', 'CTA_Click', trackingData);
                } catch (e) {
                    console.error('Meta Pixel CTA tracking error:', e);
                }
            }
            
            console.log('[Analytics] CTA Clicked:', trackingData);
        }

        /**
         * Track form interactions
         */
        setupFormTracking() {
            const form = document.getElementById('lead-form');
            if (!form) return;
            
            // Track form start
            const formInputs = form.querySelectorAll('input, select, textarea');
            formInputs.forEach(input => {
                input.addEventListener('focus', () => {
                    if (!this.formStarted) {
                        this.formStarted = true;
                        console.log('[Analytics] Form started at:', new Date().toISOString());
                        
                        if (window.gtag) {
                            try {
                                gtag('event', 'form_start', {
                                    'event_category': 'Form',
                                    'event_label': 'Lead Form'
                                });
                            } catch (e) {
                                console.error('GA4 form start tracking error:', e);
                            }
                        }
                    }
                });
            });
            
            // Track form submission
            form.addEventListener('submit', () => {
                this.formCompleted = true;
                console.log('[Analytics] Form completed at:', new Date().toISOString());
            });
            
            // Track form abandonment
            window.addEventListener('beforeunload', () => {
                if (this.formStarted && !this.formCompleted) {
                    console.log('[Analytics] Form abandoned at:', new Date().toISOString());
                    
                    if (window.gtag) {
                        try {
                            gtag('event', 'form_abandonment', {
                                'event_category': 'Form',
                                'event_label': 'Lead Form'
                            });
                        } catch (e) {
                            console.error('GA4 form abandonment tracking error:', e);
                        }
                    }
                }
            });
        }

        /**
         * Track scroll depth
         */
        trackScrollDepth() {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            
            this.config.scrollDepthThresholds.forEach(threshold => {
                if (!this.scrollTracked[threshold] && scrollPercent >= threshold) {
                    this.scrollTracked[threshold] = true;
                    
                    // Google Analytics 4
                    if (window.gtag) {
                        try {
                            gtag('event', 'scroll_depth', {
                                'event_category': 'Scroll',
                                'event_label': `${threshold}%`,
                                'value': threshold
                            });
                        } catch (e) {
                            console.error('GA4 scroll depth tracking error:', e);
                        }
                    }
                    
                    // Meta Pixel
                    if (window.fbq) {
                        try {
                            fbq('trackCustom', 'Scroll_Depth', {
                                scroll_depth: `${threshold}%`
                            });
                        } catch (e) {
                            console.error('Meta Pixel scroll depth tracking error:', e);
                        }
                    }
                    
                    console.log(`[Analytics] Scroll Depth: ${threshold}%`);
                }
            });
        }

        /**
         * Track time on page
         */
        startTimeOnPageTracking() {
            let timeOnPage = 0;
            const timeInterval = setInterval(() => {
                timeOnPage += 10;
                
                // Track every 30 seconds
                if (timeOnPage % 30 === 0) {
                    console.log(`[Analytics] Time on page: ${timeOnPage} seconds`);
                    
                    if (window.gtag) {
                        try {
                            gtag('event', 'time_on_page', {
                                'event_category': 'Engagement',
                                'value': timeOnPage
                            });
                        } catch (e) {
                            console.error('GA4 time on page tracking error:', e);
                        }
                    }
                }
            }, 10000);
        }

        /**
         * Track device information
         */
        trackDeviceInfo() {
            const deviceInfo = {
                screen_width: screen.width,
                screen_height: screen.height,
                viewport_width: window.innerWidth,
                viewport_height: window.innerHeight,
                device_pixel_ratio: window.devicePixelRatio,
                user_agent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                cookies_enabled: navigator.cookieEnabled,
                online: navigator.onLine
            };
            
            console.log('[Analytics] Device Info:', deviceInfo);
            
            // Store in localStorage for session tracking
            localStorage.setItem('device_info', JSON.stringify(deviceInfo));
            
            // Track in analytics if needed
            if (window.gtag) {
                try {
                    gtag('event', 'device_info', {
                        'screen_width': screen.width,
                        'screen_height': screen.height,
                        'device_type': this.getDeviceType()
                    });
                } catch (e) {
                    console.error('GA4 device info tracking error:', e);
                }
            }
        }

        /**
         * Get device type
         * @returns {string} Device type
         */
        getDeviceType() {
            const width = window.innerWidth;
            if (width < 768) return 'mobile';
            if (width < 1024) return 'tablet';
            return 'desktop';
        }

        /**
         * Track performance
         */
        setupPerformanceTracking() {
            if (!this.config.trackPerformance || !('performance' in window)) return;
            
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                        const loadTime = perfData.loadEventEnd - perfData.fetchStart;
                        console.log(`[Analytics] Page Load Time: ${loadTime}ms`);
                        
                        // Track in analytics
                        if (window.gtag) {
                            try {
                                gtag('event', 'page_load_time', {
                                    'value': loadTime,
                                    'event_label': 'milliseconds'
                                });
                            } catch (e) {
                                console.error('GA4 page load time tracking error:', e);
                            }
                        }
                    }
                }, 0);
            });
        }

        /**
         * Track outbound links
         */
        trackOutboundLinks(e) {
            const link = e.target.closest('a');
            if (!link || !link.href) return;
            
            if (link.hostname !== window.location.hostname) {
                const url = link.href;
                
                console.log('[Analytics] Outbound link clicked:', url);
                
                if (window.gtag) {
                    try {
                        gtag('event', 'outbound_click', {
                            'event_category': 'Outbound',
                            'event_label': url
                        });
                    } catch (e) {
                        console.error('GA4 outbound link tracking error:', e);
                    }
                }
            }
        }

        /**
         * Get element position
         * @param {Element} element - The element to check
         * @returns {string} Element position
         */
        getElementPosition(element) {
            const rect = element.getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            const windowWidth = window.innerWidth || document.documentElement.clientWidth;
            
            const vertical = rect.top < windowHeight / 2 ? 'top' : 'bottom';
            const horizontal = rect.left < windowWidth / 2 ? 'left' : 'right';
            
            return `${vertical}-${horizontal}`;
        }
    }

    // Initialize analytics system
    document.addEventListener('DOMContentLoaded', function() {
        // Wait for other scripts to initialize
        setTimeout(() => {
            try {
                window.analytics = new Analytics(ANALYTICS_CONFIG);
            } catch (e) {
                console.error('Analytics initialization error:', e);
            }
        }, 500);
    });

    // Export for testing
    if (typeof window !== 'undefined') {
        window.Analytics = Analytics;
    }
})();