/**
 * Centralized Subscribe Module
 * Single entry point for all newsletter subscription calls across the site.
 *
 * Usage:
 *   HJ.subscribe({ email: 'x@y.com', name: 'Name', source: 'website', onSuccess: fn, onError: fn })
 *   HJ.isSubscribed()
 *   HJ.getEmail()
 */
(function() {
  'use strict';

  window.HJ = window.HJ || {};

  var STORAGE_KEY = 'hj_subscribed';
  var EMAIL_KEY = 'hj_email';
  var NAME_KEY = 'hj_name';

  // Migrate old localStorage keys on first load
  (function migrate() {
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (localStorage.getItem('sp_subscribed') || localStorage.getItem('tpl_subscribed')) {
      localStorage.setItem(STORAGE_KEY, '1');
      var email = localStorage.getItem('sp_email') || localStorage.getItem('tpl_email') || '';
      if (email) localStorage.setItem(EMAIL_KEY, email);
    }
  })();

  /**
   * Subscribe a user to the newsletter.
   * @param {Object} opts
   * @param {string} opts.email - Required
   * @param {string} [opts.name] - Optional
   * @param {string} opts.source - utm_source value (determines segment server-side)
   * @param {string} [opts.honeypot] - Honeypot field value (should be empty for real users)
   * @param {Function} [opts.onSuccess] - Called on successful subscribe
   * @param {Function} [opts.onError] - Called on failure
   */
  // Blocked disposable/temporary email domains
  var BLOCKED_DOMAINS = ['maildrop.cc'];

  HJ.subscribe = function(opts) {
    var email = (opts.email || '').trim();
    if (!email) {
      if (opts.onError) opts.onError('Email is required');
      return;
    }

    // Block disposable email domains
    var domain = email.split('@')[1] || '';
    if (BLOCKED_DOMAINS.indexOf(domain.toLowerCase()) !== -1) {
      if (opts.onError) opts.onError('Please use a different email address. Disposable emails are not supported.');
      return;
    }

    var fnUrl = document.querySelector('meta[name="fn-subscribe"]');
    var url = fnUrl ? fnUrl.getAttribute('content') : '';
    if (!url) {
      if (opts.onError) opts.onError('Subscribe endpoint not found');
      return;
    }

    var payload = {
      email: email,
      utm_source: opts.source || 'website',
      page_url: window.location.pathname,
      website_url: opts.honeypot || ''
    };
    if (opts.name) payload.name = opts.name;

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(res) {
      if (res.ok) {
        localStorage.setItem(STORAGE_KEY, '1');
        localStorage.setItem(EMAIL_KEY, email);
        if (opts.name) localStorage.setItem(NAME_KEY, opts.name);
        // Keep old keys for backward compat during transition
        localStorage.setItem('sp_subscribed', '1');
        localStorage.setItem('sp_email', email);
        localStorage.setItem('tpl_subscribed', '1');
        localStorage.setItem('tpl_email', email);
        if (opts.onSuccess) opts.onSuccess();
      } else {
        if (opts.onError) opts.onError('Subscribe failed');
      }
    }).catch(function(err) {
      if (opts.onError) opts.onError(err.message || 'Network error');
    });
  };

  /**
   * Check if the current user is subscribed (any segment).
   */
  HJ.isSubscribed = function() {
    return localStorage.getItem(STORAGE_KEY) === '1';
  };

  /**
   * Get the stored email.
   */
  HJ.getEmail = function() {
    return localStorage.getItem(EMAIL_KEY) || '';
  };

  /**
   * Get the stored name.
   */
  HJ.getName = function() {
    return localStorage.getItem(NAME_KEY) || '';
  };

  /**
   * Get honeypot value from a form (if field exists).
   */
  HJ.getHoneypot = function(form) {
    var field = form ? form.querySelector('input[name="website_url"]') : null;
    return field ? field.value : '';
  };

})();
