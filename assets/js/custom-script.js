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

  // Highlight active section in image description sidebar
  var imgSidebarLinks = document.querySelectorAll('.sp-sidebar-list a[href^="#"]');
  if (imgSidebarLinks.length > 0) {
    var sections = [];
    imgSidebarLinks.forEach(function(link) {
      var id = link.getAttribute('href').substring(1);
      var el = document.getElementById(id);
      if (el) sections.push({ id: id, el: el, link: link });
    });

    function updateActiveSection() {
      var scrollPos = window.scrollY + 120;
      var active = null;
      for (var i = sections.length - 1; i >= 0; i--) {
        if (sections[i].el.offsetTop <= scrollPos) {
          active = sections[i];
          break;
        }
      }
      imgSidebarLinks.forEach(function(l) { l.classList.remove('sp-active'); });
      if (active) active.link.classList.add('sp-active');
    }

    window.addEventListener('scroll', updateActiveSection);
    updateActiveSection();
  }

  // Transcript side panel
  var transcriptBtn = document.querySelector('.listen-transcript-btn');
  var panel = document.getElementById('transcript-panel');
  var overlay = document.getElementById('transcript-overlay');
  var closeBtn = document.getElementById('transcript-close');
  var panelContent = document.getElementById('transcript-panel-content');

  if (transcriptBtn && panel) {
    // Grab transcript content from hidden details elements
    var detailsEls = document.querySelectorAll('details[id="transcript"]');
    var transcriptHTML = '';
    detailsEls.forEach(function(el) {
      var summary = el.querySelector('summary');
      if (summary && detailsEls.length > 1) {
        transcriptHTML += '<h4 style="margin:16px 0 8px;font-size:0.82rem;font-weight:700;color:var(--dark);">' + summary.textContent + '</h4>';
      }
      var content = el.innerHTML.replace(/<summary>.*?<\/summary>/, '');
      transcriptHTML += content;
    });
    if (panelContent) panelContent.innerHTML = transcriptHTML;

    transcriptBtn.addEventListener('click', function() {
      panel.classList.add('open');
      overlay.classList.add('open');
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        panel.classList.remove('open');
        overlay.classList.remove('open');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', function() {
        panel.classList.remove('open');
        overlay.classList.remove('open');
      });
    }
  }

  // Quiz functionality for listening practice
  var correctionsEl = document.querySelector('.quiz-corrections');
  var allOls = document.querySelectorAll('.sp-topic-content ol');

  if (correctionsEl && allOls.length > 0) {
    // Parse all corrections into a flat array
    var correctionsText = correctionsEl.textContent.trim();
    var allAnswers = [];
    var matches = correctionsText.match(/\d+\.\s*[A-D]/g);
    if (matches) {
      matches.forEach(function(m) {
        var letter = m.replace(/\d+\.\s*/, '').trim();
        allAnswers.push(letter);
      });
    }

    // Collect all question li elements across all ol elements
    var allQuestions = [];
    allOls.forEach(function(ol) {
      var qs = ol.querySelectorAll(':scope > li');
      qs.forEach(function(q) { allQuestions.push(q); });
    });

    // Make options clickable
    allQuestions.forEach(function(q) {
      var options = q.querySelectorAll('ul > li');
      options.forEach(function(opt) {
        opt.addEventListener('click', function() {
          options.forEach(function(o) { o.classList.remove('selected'); });
          opt.classList.add('selected');
        });
      });
    });

    // Add check button after the last ol
    var lastOl = allOls[allOls.length - 1];
    var checkBtn = document.createElement('button');
    checkBtn.className = 'quiz-check-btn';
    checkBtn.innerHTML = '<i class="fas fa-check-circle"></i> Check my results';
    lastOl.parentNode.insertBefore(checkBtn, lastOl.nextSibling);

    var scoreDiv = document.createElement('div');
    scoreDiv.className = 'quiz-score';
    checkBtn.parentNode.insertBefore(scoreDiv, checkBtn.nextSibling);

    var resetBtn = document.createElement('button');
    resetBtn.className = 'quiz-reset-btn';
    resetBtn.textContent = 'Try again';
    scoreDiv.parentNode.insertBefore(resetBtn, scoreDiv.nextSibling);

    checkBtn.addEventListener('click', function() {
      var correct = 0;
      var total = allQuestions.length;

      allQuestions.forEach(function(q, idx) {
        var correctAnswer = allAnswers[idx];
        if (!correctAnswer) return;

        var selected = q.querySelector('ul > li.selected');
        var opts = q.querySelectorAll('ul > li');

        q.classList.remove('question-correct', 'question-wrong');
        opts.forEach(function(o) { o.classList.remove('correct', 'wrong'); });

        if (!selected) {
          q.classList.add('question-wrong');
          opts.forEach(function(o) {
            if (o.textContent.trim().charAt(0) === correctAnswer) o.classList.add('correct');
          });
          return;
        }

        var selectedLetter = selected.textContent.trim().charAt(0);
        if (selectedLetter === correctAnswer) {
          correct++;
          q.classList.add('question-correct');
          selected.classList.add('correct');
        } else {
          q.classList.add('question-wrong');
          selected.classList.add('wrong');
          opts.forEach(function(o) {
            if (o.textContent.trim().charAt(0) === correctAnswer) o.classList.add('correct');
          });
        }
      });

      var pct = Math.round((correct / total) * 100);
      scoreDiv.textContent = correct + ' / ' + total + ' correct (' + pct + '%)';
      scoreDiv.className = 'quiz-score show ' + (pct >= 80 ? 'good' : pct >= 50 ? 'ok' : 'bad');
      resetBtn.classList.add('show');
    });

    resetBtn.addEventListener('click', function() {
      allQuestions.forEach(function(q) {
        q.classList.remove('question-correct', 'question-wrong');
        q.querySelectorAll('ul > li').forEach(function(o) {
          o.classList.remove('selected', 'correct', 'wrong');
        });
      });
      scoreDiv.className = 'quiz-score';
      resetBtn.classList.remove('show');
    });
  }
