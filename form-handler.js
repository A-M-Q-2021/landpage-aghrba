/**
 * Form Handler System - Optimized Version
 * Handles form submission, validation, and security
 * 
 * @author Professional Developer
 * @version 2.1
 * @license MIT
 */

(function() {
    'use strict';
    
    // Configuration
    const FORM_CONFIG = {
        formId: 'lead-form',
        rateLimitInterval: 5000, // 5 seconds
        successMessageDuration: 5000, // 5 seconds
        analyticsEnabled: true,
        recaptchaSiteKey: 'your_recaptcha_site_key_here',
        apiUrl: '/api/submit-lead',
        honeypotFieldName: '_honeypot'
    };

    // Form handler class
    class FormHandler {
        constructor(config) {
            this.config = config;
            this.lastSubmitTime = 0;
            this.form = document.getElementById(config.formId);
            this.submitButton = null;
            this.originalButtonText = '';
            this.init();
        }

        /**
         * Initialize form handler
         */
        init() {
            if (!this.form) {
                console.error('Form not found');
                return;
            }
            
            this.setupEventListeners();
            this.setupRealTimeValidation();
            this.setupPhoneNumberFormatting();
            this.setupHoneypot();
        }

        /**
         * Set up event listeners
         */
        setupEventListeners() {
            this.form.addEventListener('submit', this.handleFormSubmit.bind(this));
            
            // Next button for step 1
            const nextButton = this.form.querySelector('[data-action="next"]');
            if (nextButton) {
                nextButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.formNavigation.nextStep();
                });
            }
            
            // Back button
            const backButton = this.form.querySelector('[data-action="back"]');
            if (backButton) {
                backButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.formNavigation.prevStep();
                });
            }
        }

        /**
         * Handle form submission
         */
        async handleFormSubmit(e) {
            e.preventDefault();
            
            // Check rate limiting
            const currentTime = Date.now();
            if (currentTime - this.lastSubmitTime < this.config.rateLimitInterval) {
                this.showFormMessage('يرجى الانتظار قبل إرسال الطلب مرة أخرى', 'error');
                return;
            }
            
            // Check honeypot
            if (this.checkHoneypot()) {
                console.log('Spam detected - honeypot triggered');
                return;
            }
            
            // Validate form
            if (!this.validateForm()) {
                return;
            }
            
            // Get submit button
            this.submitButton = this.form.querySelector('button[type="submit"]');
            if (this.submitButton) {
                this.originalButtonText = this.submitButton.innerHTML;
                this.submitButton.disabled = true;
                this.submitButton.innerHTML = 'جاري الإرسال...';
            }
            
            try {
                // Submit form
                const formData = await this.submitForm();
                
                // Update last submit time
                this.lastSubmitTime = Date.now();
                
                // Show success message
                this.showSuccessMessage();
                
                // Track conversion
                this.trackConversion(formData);
                
            } catch (error) {
                console.error('Form submission error:', error);
                this.showFormMessage('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.', 'error');
            } finally {
                // Restore button state
                if (this.submitButton) {
                    this.submitButton.disabled = false;
                    this.submitButton.innerHTML = this.originalButtonText;
                }
            }
        }

        /**
         * Validate form
         * @returns {boolean} Whether form is valid
         */
        validateForm() {
            let isValid = true;
            const currentStep = this.form.querySelector('.form-step.active');
            
            if (!currentStep) return false;
            
            const requiredFields = currentStep.querySelectorAll('[required]');
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.classList.add('border-danger');
                    isValid = false;
                    this.addErrorMessage(field, 'هذا الحقل مطلوب');
                } else {
                    field.classList.remove('border-danger');
                    this.removeErrorMessage(field);
                }
            });
            
            return isValid;
        }

        /**
         * Add error message to field
         * @param {Element} field - The form field
         * @param {string} message - The error message
         */
        addErrorMessage(field, message) {
            let errorDiv = field.nextElementSibling;
            
            if (!errorDiv || !errorDiv.classList.contains('error-message')) {
                errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.style.color = '#dc3545';
                errorDiv.style.fontSize = '0.875rem';
                errorDiv.style.marginTop = '0.25rem';
                field.parentNode.insertBefore(errorDiv, field.nextSibling);
            }
            
            errorDiv.textContent = message;
        }

        /**
         * Remove error message from field
         * @param {Element} field - The form field
         */
        removeErrorMessage(field) {
            const errorDiv = field.nextElementSibling;
            if (errorDiv && errorDiv.classList.contains('error-message')) {
                errorDiv.remove();
            }
        }

        /**
         * Check honeypot field
         * @returns {boolean} Whether honeypot was triggered
         */
        checkHoneypot() {
            const honeypot = this.form.querySelector(`[name="${this.config.honeypotFieldName}"]`);
            return honeypot && honeypot.value.trim() !== '';
        }

        /**
         * Setup honeypot field
         */
        setupHoneypot() {
            const honeypot = this.form.querySelector(`[name="${this.config.honeypotFieldName}"]`);
            if (honeypot) {
                honeypot.value = '';
                honeypot.addEventListener('change', () => {
                    if (honeypot.value) {
                        console.log('Honeypot triggered');
                    }
                });
            }
        }

        /**
         * Submit form data
         * @returns {Promise<Object>} Form data
         */
        async submitForm() {
            // Get form data
            const formData = new FormData(this.form);
            const data = Object.fromEntries(formData.entries());
            
            // Remove honeypot and recaptcha fields
            delete data[this.config.honeypotFieldName];
            delete data.recaptcha_response;
            
            // Add metadata
            data.timestamp = new Date().toISOString();
            data.userAgent = navigator.userAgent;
            data.referrer = document.referrer;
            
            // Add UTM parameters
            const urlParams = new URLSearchParams(window.location.search);
            data.utm = {};
            ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
                if (urlParams.has(param)) {
                    data.utm[param] = urlParams.get(param);
                }
            });
            
            // Add device info
            data.deviceInfo = {
                screenWidth: screen.width,
                screenHeight: screen.height,
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
                pixelRatio: window.devicePixelRatio,
                language: navigator.language
            };
            
            // Add performance metrics
            if (performance && performance.getEntriesByType) {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    data.loadTime = perfData.loadEventEnd - perfData.fetchStart;
                }
            }
            
            // In production, you would use:
            /*
            const response = await fetch(this.config.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            return response.json();
            */
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return data;
        }

        /**
         * Show success message
         */
        showSuccessMessage() {
            const formContainer = document.getElementById('form-container');
            if (!formContainer) return;
            
            formContainer.innerHTML = `
                <div class="success-message">
                    <div class="success-message__icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <h3>تم استلام طلبك بنجاح!</h3>
                    <p>خلال ساعات العمل بنأكد لك بواتساب ونرسل رابط تحديد الموعد.</p>
                    <p>جهّز أكبر سؤالين عندك عشان نبدأ بقوة. تحتاجنا الحين؟ تواصل مباشرة بواتساب.</p>
                    <a href="https://wa.me/966500000000?text=مرحباً، أرغب في معرفة المزيد عن خدماتكم" 
                       class="btn btn--whatsapp" 
                       target="_blank" 
                       rel="noopener"
                       style="margin-top: 1.5rem; display: inline-block;">
                        تواصل عبر واتساب
                    </a>
                </div>
            `;
            
            // Re-enable sticky CTA
            const stickyCTA = document.getElementById('sticky-cta');
            if (stickyCTA) {
                stickyCTA.style.display = 'flex';
            }
            
            // Auto-hide after duration
            setTimeout(() => {
                if (formContainer && formContainer.querySelector('.success-message')) {
                    formContainer.innerHTML = '';
                    window.formNavigation.currentStep = 1;
                    document.querySelector('.form-step[data-step="1"]').classList.add('active');
                }
            }, this.config.successMessageDuration);
        }

        /**
         * Show form message
         * @param {string} message - The message to show
         * @param {string} type - Message type (error/success)
         */
        showFormMessage(message, type = 'error') {
            const formContainer = document.getElementById('form-container');
            if (!formContainer) return;
            
            const messageDiv = document.createElement('div');
            messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
            messageDiv.style.padding = '1.2rem';
            messageDiv.style.margin = '1rem 0';
            messageDiv.style.borderRadius = '8px';
            messageDiv.style.textAlign = 'center';
            messageDiv.style.fontWeight = '500';
            messageDiv.style.transition = 'opacity 0.3s';
            
            if (type === 'error') {
                messageDiv.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
                messageDiv.style.borderColor = 'var(--color-red)';
                messageDiv.style.color = 'var(--color-red)';
            } else {
                messageDiv.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
                messageDiv.style.borderColor = 'var(--color-green)';
                messageDiv.style.color = 'var(--color-green)';
            }
            
            messageDiv.textContent = message;
            formContainer.insertBefore(messageDiv, formContainer.firstChild);
            
            // Auto remove after duration
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.style.opacity = '0';
                    setTimeout(() => {
                        if (messageDiv.parentNode) {
                            messageDiv.remove();
                        }
                    }, 300);
                }
            }, 4000);
        }

        /**
         * Track form conversion
         * @param {Object} formData - Form data
         */
        trackConversion(formData) {
            if (!this.config.analyticsEnabled) return;
            
            // Google Analytics 4
            if (window.gtag) {
                gtag('event', 'form_submission', {
                    'event_category': 'Lead',
                    'event_label': 'Lead Form',
                    'value': 1,
                    'business_name': formData.business_name,
                    'role': formData.role,
                    'budget': formData.budget
                });
            }
            
            // Meta Pixel
            if (window.fbq) {
                fbq('track', 'Lead', {
                    content_name: 'Lead Form',
                    content_category: 'Form Submission',
                    value: 1,
                    currency: 'SAR'
                });
            }
            
            // Console logging
            console.log('[Form Handler] Conversion tracked:', formData);
        }

        /**
         * Setup real-time validation
         */
        setupRealTimeValidation() {
            const formInputs = this.form.querySelectorAll('input, select, textarea');
            
            formInputs.forEach(input => {
                input.addEventListener('blur', () => {
                    if (input.hasAttribute('required') && !input.value.trim()) {
                        input.classList.add('border-danger');
                        this.addErrorMessage(input, 'هذا الحقل مطلوب');
                    } else {
                        input.classList.remove('border-danger');
                        this.removeErrorMessage(input);
                    }
                });
                
                input.addEventListener('input', () => {
                    if (input.classList.contains('border-danger') && input.value.trim()) {
                        input.classList.remove('border-danger');
                        this.removeErrorMessage(input);
                    }
                });
            });
        }

        /**
         * Setup phone number formatting
         */
        setupPhoneNumberFormatting() {
            const phoneInput = this.form.querySelector('#phone');
            if (!phoneInput) return;
            
            phoneInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 0) {
                    value = '0' + value;
                }
                if (value.length > 4) {
                    value = value.substring(0, 4) + '-' + value.substring(4);
                }
                if (value.length > 8) {
                    value = value.substring(0, 8) + '-' + value.substring(8, 12);
                }
                e.target.value = value.substring(0, 12);
            });
        }
    }

    // Initialize form handler
    document.addEventListener('DOMContentLoaded', function() {
        // Wait for other scripts to initialize
        setTimeout(() => {
            window.formHandler = new FormHandler(FORM_CONFIG);
        }, 500);
    });

    // Export for testing
    if (typeof window !== 'undefined') {
        window.FormHandler = FormHandler;
    }
})();