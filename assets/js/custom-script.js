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

  // Fetch Substack RSS feed
  var feedContainer = document.getElementById('substack-feed');
  if (feedContainer) {
    var feedUrl = 'https://thesecondmind.substack.com/feed';
    var proxies = [
      'https://api.allorigins.win/raw?url=' + encodeURIComponent(feedUrl),
      'https://corsproxy.io/?' + encodeURIComponent(feedUrl),
      'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(feedUrl)
    ];

    function tryFetch(index) {
      if (index >= proxies.length) {
        feedContainer.innerHTML = '<p class="substack-loading">Unable to load newsletter posts. <a href="https://thesecondmind.substack.com" target="_blank" rel="noopener">Visit on Substack →</a></p>';
        return;
      }

      fetch(proxies[index])
        .then(function(response) {
          if (!response.ok) throw new Error('Failed');
          return response.text();
        })
        .then(function(data) {
          var parser = new DOMParser();
          var xml = parser.parseFromString(data, 'text/xml');
          var items = xml.querySelectorAll('item');

          if (!items.length) throw new Error('No items');

          var html = '';
          items.forEach(function(item, i) {
            if (i >= 10) return;
            var title = item.querySelector('title').textContent;
            var link = item.querySelector('link').textContent;
            var pubDate = item.querySelector('pubDate').textContent;
            var date = new Date(pubDate);
            var dateStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
            var description = item.querySelector('description');
            var excerpt = description ? description.textContent.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : '';

            html += '<a href="' + link + '" target="_blank" rel="noopener" class="writing-essay-item">';
            html += '<div class="writing-essay-left">';
            html += '<span class="field-card-tag">NEWSLETTER</span>';
            html += '<h3>' + title + '</h3>';
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
          tryFetch(index + 1);
        });
    }

    tryFetch(0);
  }

});
