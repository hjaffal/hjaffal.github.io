document.addEventListener('DOMContentLoaded', function() {

  // Dark mode toggle
  var toggle = document.getElementById('theme-toggle');
  var html = document.documentElement;

  // Check saved preference or system preference
  var saved = localStorage.getItem('theme');
  if (saved) {
    html.setAttribute('data-theme', saved);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    html.setAttribute('data-theme', 'dark');
  }

  if (toggle) {
    toggle.addEventListener('click', function() {
      var current = html.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  // Navbar subtle shadow on scroll
  var navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 10) {
        navbar.style.boxShadow = '0 1px 8px rgba(15, 23, 42, 0.05)';
      } else {
        navbar.style.boxShadow = 'none';
      }
    });
  }

  // Show success banner on contact page
  var params = new URLSearchParams(window.location.search);
  if (params.get('message') === 'ok') {
    var banner = document.getElementById('contact-success-banner');
    if (banner) {
      banner.style.display = 'flex';
    }
  }

});
