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

  // Fetch Substack RSS feed via rss2json
  var feedContainer = document.getElementById('substack-feed');
  if (feedContainer) {
    var apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://thesecondmind.substack.com/feed');

    fetch(apiUrl)
      .then(function(response) { return response.json(); })
      .then(function(data) {
        if (data.status !== 'ok' || !data.items || !data.items.length) {
          throw new Error('No items');
        }

        var html = '';
        data.items.slice(0, 10).forEach(function(item) {
          var date = new Date(item.pubDate);
          var dateStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
          var excerpt = item.description ? item.description.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : '';

          html += '<a href="' + item.link + '" target="_blank" rel="noopener" class="writing-essay-item">';
          html += '<div class="writing-essay-left">';
          html += '<span class="field-card-tag">NEWSLETTER</span>';
          html += '<h3>' + item.title + '</h3>';
          html += '<p class="writing-essay-excerpt">' + excerpt + '</p>';
          html += '</div>';
          html += '<div class="writing-essay-right">';
          html += '<span class="field-card-date">' + dateStr + '</span>';
          html += '<span class="field-card-arrow">→</span>';
          html += '</div>';
          html += '</a>';
        });

        feedContainer.innerHTML = html;
      })
      .catch(function() {
        feedContainer.innerHTML = '<p class="substack-loading">Unable to load newsletter posts. <a href="https://thesecondmind.substack.com" target="_blank" rel="noopener">Visit on Substack →</a></p>';
      });
  }

});
