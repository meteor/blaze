/**
 * Blaze Error Indicator
 * 
 * A visual error indicator for Blaze template errors during development.
 * Displays a badge in the bottom-left corner showing the number of errors,
 * with a modal that shows detailed error information when clicked.
 * 
 * Features:
 * - Catches and displays Blaze/template-related errors
 * - Graceful failure with inline error placeholders
 * - Error deduplication
 * - HMR integration for automatic error clearing
 * - Accessible (ARIA labels, keyboard navigation)
 * - Production mode detection (disabled by default in production)
 * 
 * @fileoverview Client-side error indicator for Blaze templates
 */

(function() {
  'use strict';

  // Only run on client
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // ============================================
  // Configuration
  // ============================================

  var CONFIG = {
    // Error deduplication window in milliseconds
    DEDUPE_WINDOW_MS: 100,
    // CSS class prefix for namespacing
    CSS_PREFIX: 'blaze-error',
    // Z-index for indicator and modal
    Z_INDEX_BADGE: 99999,
    Z_INDEX_MODAL: 100000,
    // Check for production mode (Meteor sets this)
    isProduction: function() {
      return typeof Meteor !== 'undefined' && Meteor.isProduction;
    }
  };

  // Keywords that identify Blaze-related errors
  var BLAZE_KEYWORDS = [
    'Template', 'Blaze', 'Spacebars', 'No such template',
    'No such function', 'htmljs', 'Can\'t render',
    'Expected Template or View', 'DOMRange', 'parentElement',
    'Unsupported directive', 'Can\'t call non-function'
  ];

  // ============================================
  // State
  // ============================================

  var errors = [];
  var isModalOpen = false;
  var containerEl = null;
  var isInitialized = false;
  var styleEl = null;
  var isEnabled = true;

  // ============================================
  // Utility Functions
  // ============================================

  /**
   * Checks if an error message or stack trace is related to Blaze
   * @param {string} message - The error message
   * @param {Error} error - The error object
   * @returns {boolean} True if the error is Blaze-related
   */
  function isBlazeRelatedError(message, error) {
    var stack = (error && error.stack) ? error.stack : '';
    var fullText = (message || '') + ' ' + stack;
    
    for (var i = 0; i < BLAZE_KEYWORDS.length; i++) {
      if (fullText.indexOf(BLAZE_KEYWORDS[i]) !== -1) {
        return true;
      }
    }
    return false;
  }

  /**
   * Escapes HTML special characters to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped HTML string
   */
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  /**
   * Formats a timestamp to locale time string
   * @returns {string} Formatted time string
   */
  function formatTime() {
    return new Date().toLocaleTimeString();
  }

  // ============================================
  // Styles
  // ============================================

  /**
   * CSS styles for the error indicator
   * Using template literals would be nice but we need ES5 compatibility
   */
  function getStyles() {
    var prefix = CONFIG.CSS_PREFIX;
    return [
      '.' + prefix + '-indicator {',
      '  position: fixed;',
      '  bottom: 20px;',
      '  left: 20px;',
      '  z-index: ' + CONFIG.Z_INDEX_BADGE + ';',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '  padding: 10px 16px;',
      '  background-color: #dc3545;',
      '  color: white;',
      '  border-radius: 8px;',
      '  cursor: pointer;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '  font-size: 14px;',
      '  font-weight: 500;',
      '  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);',
      '  transition: transform 0.2s, box-shadow 0.2s;',
      '  border: none;',
      '}',
      '.' + prefix + '-indicator:hover {',
      '  transform: translateY(-2px);',
      '  box-shadow: 0 6px 16px rgba(220, 53, 69, 0.5);',
      '}',
      '.' + prefix + '-indicator:focus {',
      '  outline: 2px solid #fff;',
      '  outline-offset: 2px;',
      '}',
      '.' + prefix + '-indicator .error-count {',
      '  background-color: rgba(255, 255, 255, 0.2);',
      '  padding: 2px 8px;',
      '  border-radius: 12px;',
      '  font-size: 12px;',
      '}',
      '.' + prefix + '-modal-overlay {',
      '  position: fixed;',
      '  top: 0;',
      '  left: 0;',
      '  right: 0;',
      '  bottom: 0;',
      '  background-color: rgba(0, 0, 0, 0.5);',
      '  z-index: ' + CONFIG.Z_INDEX_MODAL + ';',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  padding: 20px;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '}',
      '.' + prefix + '-modal {',
      '  background-color: #1e1e1e;',
      '  color: #d4d4d4;',
      '  border-radius: 12px;',
      '  max-width: 800px;',
      '  width: 100%;',
      '  max-height: 80vh;',
      '  display: flex;',
      '  flex-direction: column;',
      '  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);',
      '}',
      '.' + prefix + '-modal-header {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  padding: 16px 20px;',
      '  border-bottom: 1px solid #333;',
      '  background-color: #dc3545;',
      '  color: white;',
      '  border-radius: 12px 12px 0 0;',
      '}',
      '.' + prefix + '-modal-header h3 {',
      '  margin: 0;',
      '  font-size: 18px;',
      '}',
      '.' + prefix + '-modal-close {',
      '  background: none;',
      '  border: none;',
      '  color: white;',
      '  font-size: 28px;',
      '  cursor: pointer;',
      '  padding: 0 4px;',
      '  line-height: 1;',
      '  border-radius: 4px;',
      '}',
      '.' + prefix + '-modal-close:hover {',
      '  background-color: rgba(255, 255, 255, 0.2);',
      '}',
      '.' + prefix + '-modal-close:focus {',
      '  outline: 2px solid #fff;',
      '  outline-offset: 2px;',
      '}',
      '.' + prefix + '-modal-body {',
      '  padding: 20px;',
      '  overflow-y: auto;',
      '  flex: 1;',
      '}',
      '.' + prefix + '-item {',
      '  background-color: #2d2d2d;',
      '  border-radius: 8px;',
      '  padding: 16px;',
      '  margin-bottom: 12px;',
      '  border-left: 4px solid #dc3545;',
      '}',
      '.' + prefix + '-item:last-child {',
      '  margin-bottom: 0;',
      '}',
      '.' + prefix + '-item-header {',
      '  display: flex;',
      '  justify-content: space-between;',
      '  align-items: flex-start;',
      '  margin-bottom: 8px;',
      '  gap: 12px;',
      '}',
      '.' + prefix + '-item-title {',
      '  font-weight: 600;',
      '  color: #f87171;',
      '  font-size: 14px;',
      '}',
      '.' + prefix + '-item-time {',
      '  font-size: 12px;',
      '  color: #888;',
      '  white-space: nowrap;',
      '}',
      '.' + prefix + '-item-message {',
      '  font-family: "SF Mono", Monaco, Menlo, Consolas, monospace;',
      '  font-size: 13px;',
      '  color: #e5e5e5;',
      '  white-space: pre-wrap;',
      '  word-break: break-word;',
      '}',
      '.' + prefix + '-item-stack {',
      '  margin-top: 12px;',
      '  padding-top: 12px;',
      '  border-top: 1px solid #444;',
      '  font-family: "SF Mono", Monaco, Menlo, Consolas, monospace;',
      '  font-size: 11px;',
      '  color: #888;',
      '  white-space: pre-wrap;',
      '  word-break: break-word;',
      '  max-height: 150px;',
      '  overflow-y: auto;',
      '}',
      '.' + prefix + '-modal-footer {',
      '  padding: 12px 20px;',
      '  border-top: 1px solid #333;',
      '  display: flex;',
      '  justify-content: flex-end;',
      '  gap: 10px;',
      '}',
      '.' + prefix + '-btn {',
      '  padding: 8px 16px;',
      '  border-radius: 6px;',
      '  border: none;',
      '  cursor: pointer;',
      '  font-size: 14px;',
      '  font-weight: 500;',
      '  transition: background-color 0.15s;',
      '}',
      '.' + prefix + '-btn:focus {',
      '  outline: 2px solid #fff;',
      '  outline-offset: 2px;',
      '}',
      '.' + prefix + '-btn-secondary {',
      '  background-color: #333;',
      '  color: #d4d4d4;',
      '}',
      '.' + prefix + '-btn-secondary:hover {',
      '  background-color: #444;',
      '}',
      '.' + prefix + '-btn-primary {',
      '  background-color: #dc3545;',
      '  color: white;',
      '}',
      '.' + prefix + '-btn-primary:hover {',
      '  background-color: #c82333;',
      '}'
    ].join('\n');
  }

  /**
   * Injects styles into the document head
   */
  function injectStyles() {
    if (styleEl) return;
    
    styleEl = document.createElement('style');
    styleEl.id = CONFIG.CSS_PREFIX + '-styles';
    styleEl.textContent = getStyles();
    document.head.appendChild(styleEl);
  }

  /**
   * Removes injected styles from the document
   */
  function removeStyles() {
    if (styleEl && styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
      styleEl = null;
    }
  }

  // ============================================
  // DOM Management
  // ============================================

  /**
   * Creates the container element for the error indicator
   */
  function createContainer() {
    if (containerEl) return;
    if (!document.body) return;
    
    containerEl = document.createElement('div');
    containerEl.id = CONFIG.CSS_PREFIX + '-container';
    // Set ARIA live region for screen reader announcements
    containerEl.setAttribute('aria-live', 'polite');
    containerEl.setAttribute('aria-atomic', 'true');
    document.body.appendChild(containerEl);
  }

  /**
   * Removes the container element from the document
   */
  function removeContainer() {
    if (containerEl && containerEl.parentNode) {
      containerEl.parentNode.removeChild(containerEl);
      containerEl = null;
    }
  }

  /**
   * Renders the error indicator badge
   * @returns {string} HTML string for the badge
   */
  function renderBadge() {
    var prefix = CONFIG.CSS_PREFIX;
    var count = errors.length;
    var label = count === 1 ? '1 Blaze error' : count + ' Blaze errors';
    
    return [
      '<button class="' + prefix + '-indicator" ',
      'id="' + prefix + '-btn" ',
      'aria-label="' + label + '. Click to view details" ',
      'type="button">',
      '<span aria-hidden="true">\u26A0\uFE0F</span>',
      '<span>Blaze Error!</span>',
      '<span class="error-count" aria-hidden="true">' + count + '</span>',
      '</button>'
    ].join('');
  }

  /**
   * Renders the error modal
   * @returns {string} HTML string for the modal
   */
  function renderModal() {
    var prefix = CONFIG.CSS_PREFIX;
    var html = [];
    
    html.push(
      '<div class="' + prefix + '-modal-overlay" id="' + prefix + '-overlay" role="dialog" aria-modal="true" aria-labelledby="' + prefix + '-modal-title">',
      '<div class="' + prefix + '-modal">',
      '<div class="' + prefix + '-modal-header">',
      '<h3 id="' + prefix + '-modal-title">\u26A0\uFE0F Blaze Errors (' + errors.length + ')</h3>',
      '<button class="' + prefix + '-modal-close" id="' + prefix + '-close" aria-label="Close error dialog" type="button">&times;</button>',
      '</div>',
      '<div class="' + prefix + '-modal-body" role="list">'
    );
    
    for (var i = 0; i < errors.length; i++) {
      var err = errors[i];
      html.push(
        '<div class="' + prefix + '-item" role="listitem">',
        '<div class="' + prefix + '-item-header">',
        '<span class="' + prefix + '-item-title">' + escapeHtml(err.message) + '</span>',
        '<span class="' + prefix + '-item-time">' + escapeHtml(err.time) + '</span>',
        '</div>',
        '<div class="' + prefix + '-item-message">' + escapeHtml(err.error) + '</div>'
      );
      if (err.stack) {
        html.push('<div class="' + prefix + '-item-stack">' + escapeHtml(err.stack) + '</div>');
      }
      html.push('</div>');
    }
    
    html.push(
      '</div>',
      '<div class="' + prefix + '-modal-footer">',
      '<button class="' + prefix + '-btn ' + prefix + '-btn-secondary" id="' + prefix + '-clear" type="button">Clear All</button>',
      '<button class="' + prefix + '-btn ' + prefix + '-btn-primary" id="' + prefix + '-close-btn" type="button">Close</button>',
      '</div>',
      '</div>',
      '</div>'
    );
    
    return html.join('');
  }

  /**
   * Renders the complete UI based on current state
   */
  function render() {
    if (!containerEl || !isEnabled) return;

    var html = '';

    if (errors.length > 0) {
      html = renderBadge();
      
      if (isModalOpen) {
        html += renderModal();
      }
    }

    containerEl.innerHTML = html;
    attachEventListeners();
  }

  // ============================================
  // Event Handlers
  // ============================================

  /**
   * Opens the error modal
   */
  function openModal() {
    isModalOpen = true;
    render();
    // Focus the close button for keyboard accessibility
    var closeBtn = document.getElementById(CONFIG.CSS_PREFIX + '-close');
    if (closeBtn) closeBtn.focus();
  }

  /**
   * Closes the error modal
   */
  function closeModal() {
    isModalOpen = false;
    render();
    // Return focus to the indicator button
    var btn = document.getElementById(CONFIG.CSS_PREFIX + '-btn');
    if (btn) btn.focus();
  }

  /**
   * Handles keyboard events for accessibility
   * @param {KeyboardEvent} e - The keyboard event
   */
  function handleKeydown(e) {
    if (!isModalOpen) return;
    
    // Close on Escape key
    if (e.key === 'Escape' || e.keyCode === 27) {
      e.preventDefault();
      closeModal();
    }
  }

  /**
   * Attaches event listeners to rendered elements
   */
  function attachEventListeners() {
    var prefix = CONFIG.CSS_PREFIX;
    
    var btn = document.getElementById(prefix + '-btn');
    if (btn) {
      btn.onclick = openModal;
    }

    var closeBtn = document.getElementById(prefix + '-close');
    var closeBtnFooter = document.getElementById(prefix + '-close-btn');
    var overlay = document.getElementById(prefix + '-overlay');
    var clearBtn = document.getElementById(prefix + '-clear');

    if (closeBtn) {
      closeBtn.onclick = closeModal;
    }
    if (closeBtnFooter) {
      closeBtnFooter.onclick = closeModal;
    }
    if (overlay) {
      overlay.onclick = function(e) {
        if (e.target === overlay) {
          closeModal();
        }
      };
    }
    if (clearBtn) {
      clearBtn.onclick = function() {
        errors = [];
        isModalOpen = false;
        render();
      };
    }
  }

  // ============================================
  // Public API Functions
  // ============================================

  /**
   * Adds an error to the indicator
   * @param {Error|string} error - The error object or message
   * @param {string} [msg] - Optional context message
   */
  function addError(error, msg) {
    if (!isEnabled) return;
    
    // Ensure we're initialized
    if (!isInitialized) {
      init();
    }

    var errorMessage = (error && error.message) ? error.message : String(error);
    
    // Deduplicate: don't add if we have this exact error message recently
    var now = Date.now();
    for (var i = errors.length - 1; i >= 0; i--) {
      if (errors[i].error === errorMessage && 
          (now - errors[i].timestamp) < CONFIG.DEDUPE_WINDOW_MS) {
        return;
      }
    }

    errors.push({
      id: now,
      message: msg || 'Exception caught in template:',
      error: errorMessage,
      stack: (error && error.stack) ? error.stack : '',
      time: formatTime(),
      timestamp: now
    });
    
    render();
  }

  /**
   * Removes errors related to a specific template name
   * Used by HMR when a missing template is added
   * @param {string} templateName - The name of the template
   */
  function removeTemplateError(templateName) {
    var pattern = 'No such template: ' + templateName;
    var hadErrors = errors.length > 0;
    
    errors = errors.filter(function(err) {
      return err.error.indexOf(pattern) === -1;
    });
    
    if (hadErrors && errors.length === 0) {
      isModalOpen = false;
    }
    
    render();
  }

  /**
   * Clears all errors
   */
  function clearAll() {
    errors = [];
    isModalOpen = false;
    render();
  }

  /**
   * Initializes the error indicator
   */
  function init() {
    if (isInitialized) return;
    
    // Skip initialization in production mode by default
    if (CONFIG.isProduction()) {
      isEnabled = false;
      return;
    }
    
    if (!document.body) {
      // Wait for body to be available
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        setTimeout(init, 10);
      }
      return;
    }
    
    isInitialized = true;
    injectStyles();
    createContainer();
    render();

    // Add keyboard event listener for accessibility
    document.addEventListener('keydown', handleKeydown);

    // Listen for global errors that might be Blaze-related
    window.addEventListener('error', function(event) {
      if (isBlazeRelatedError(event.message, event.error)) {
        addError(event.error || new Error(event.message), 'Uncaught template error:');
      }
    });

    window.addEventListener('unhandledrejection', function(event) {
      var errorMsg = (event.reason && event.reason.message) 
        ? event.reason.message 
        : String(event.reason);
      if (isBlazeRelatedError(errorMsg, event.reason)) {
        addError(event.reason, 'Unhandled template promise rejection:');
      }
    });
  }

  /**
   * Destroys the error indicator and cleans up resources
   */
  function destroy() {
    document.removeEventListener('keydown', handleKeydown);
    removeContainer();
    removeStyles();
    errors = [];
    isModalOpen = false;
    isInitialized = false;
    isEnabled = false;
  }

  // ============================================
  // Blaze Integration
  // ============================================

  /**
   * Internal API for Blaze integration
   * @private
   */
  Blaze._errorIndicator = {
    addError: addError,
    removeTemplateError: removeTemplateError,
    clearAll: clearAll,
    init: init,
    destroy: destroy
  };

  /**
   * Enable or disable the error indicator
   * @param {boolean} [enabled=true] - Whether to enable the indicator
   * @memberof Blaze
   * @example
   * // Disable the error indicator
   * Blaze.showErrorIndicator(false);
   * 
   * // Enable the error indicator
   * Blaze.showErrorIndicator(true);
   */
  Blaze.showErrorIndicator = function(enabled) {
    if (enabled !== false) {
      isEnabled = true;
      init();
    } else {
      destroy();
    }
  };

  /**
   * Clear all errors from the indicator
   * @memberof Blaze
   * @example
   * Blaze.clearErrors();
   */
  Blaze.clearErrors = function() {
    clearAll();
  };

  /**
   * Get a copy of the current errors array
   * @returns {Array} Array of error objects
   * @memberof Blaze
   * @example
   * const errors = Blaze.getErrors();
   * console.log('There are', errors.length, 'errors');
   */
  Blaze.getErrors = function() {
    return errors.slice();
  };

  // ============================================
  // Auto-initialization
  // ============================================

  // Auto-initialize when DOM is ready (in development mode only)
  if (!CONFIG.isProduction()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      // Use setTimeout to ensure this runs after all scripts are loaded
      setTimeout(init, 0);
    }
  }

})();
