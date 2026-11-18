(function () {
  'use strict';
  const form = document.getElementById('contact-form');
  if (!form) return;
  const wrapper = document.getElementById('contact-form-wrapper');
  const success = document.getElementById('contact-success');
  const error = document.getElementById('contact-error');
  const button = document.getElementById('contact-submit-btn');
  const newsletterResult = document.getElementById('contact-newsletter-result');
  let sending = false;
  button.disabled = false;
  const params = new URLSearchParams(location.search);
  const subject = form.elements.subject;
  if (params.get('message') === 'ok') document.getElementById('contact-success-banner').hidden = false;
  if (Array.from(subject.options).some(option => option.value === params.get('subject'))) subject.value = params.get('subject');
  ['name', 'message'].forEach(function (field) { form.elements[field].addEventListener('input', function () { this.setCustomValidity(''); }); });
  window.submitContactForm = async function (event) {
    event.preventDefault();
    if (sending || form.elements._gotcha.value) return;
    for (const field of ['name', 'message']) {
      if (!form.elements[field].value.trim()) form.elements[field].setCustomValidity(field === 'name' ? 'Please enter your name.' : 'Please enter a message.');
    }
    if (!form.reportValidity()) return;
    const payload = { name: form.elements.name.value.trim(), email: form.elements.email.value.trim(), subject: subject.value, message: form.elements.message.value.trim() };
    if (!payload.name || !payload.email || !payload.message) return;
    const subscribe = form.elements.newsletter.checked;
    sending = true; button.disabled = true; button.textContent = 'Sending…'; error.hidden = true;
    try {
      const response = await fetch(form.dataset.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: payload }) });
      if (!response.ok) throw new Error('Message request failed');
      wrapper.hidden = true; success.hidden = false; newsletterResult.textContent = ''; success.focus();
      if (subscribe && window.HJ && typeof HJ.subscribe === 'function') {
        newsletterResult.textContent = 'Subscribing you to future articles…';
        HJ.subscribe({ email: payload.email, name: payload.name, source: 'contact_form',
          onSuccess: function () { newsletterResult.textContent = 'You are also subscribed to future articles.'; },
          onError: function () { newsletterResult.textContent = 'Your message was sent, but the newsletter subscription could not be completed. You can subscribe on the newsletter page.'; }
        });
      } else if (subscribe) {
        newsletterResult.textContent = 'Your message was sent. To subscribe, use the newsletter page.';
      }
    } catch (reason) {
      if (success.hidden) { error.hidden = false; }
      else { newsletterResult.textContent = 'Your message was sent. You can subscribe to articles on the newsletter page.'; }
    } finally { sending = false; button.disabled = false; button.textContent = 'Send message'; }
  };
  window.resetContactForm = function () {
    if (sending) return;
    form.reset(); wrapper.hidden = false; success.hidden = true; error.hidden = true;
    newsletterResult.textContent = ''; form.elements.name.focus();
  };
  form.addEventListener('submit', window.submitContactForm);
  document.getElementById('contact-send-another').addEventListener('click', window.resetContactForm);
})();
