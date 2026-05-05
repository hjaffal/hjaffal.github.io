var custom = {

  scrollBoxCheck: false,

  init: function() {

    // Check if there is a scrollbox to initialize
    if ($("#scroll-box").length > 0) {
      if ($("article").length > 0) {
        custom.scrollBoxCheck = Math.min(1500, $("article").offset().top + $("article").height() * 0.4);
        $("#scroll-box-close").click(function() {
          $("body").removeClass("scroll-box-on");
        });
      }
    }

    $(window).scroll(function() {
      // Check if the scrollbox should be made visible
      if (custom.scrollBoxCheck) {
        if ($(window).scrollTop() > custom.scrollBoxCheck) {
          custom.scrollBoxCheck = false;
          $("body").addClass("scroll-box-on");
        }
      }
    });

    // Navbar scroll effect — slightly more opaque on scroll
    var navbar = document.querySelector('.navbar');
    if (navbar) {
      window.addEventListener('scroll', function() {
        if (window.scrollY > 40) {
          navbar.style.background = 'rgba(29, 29, 31, 0.95)';
        } else {
          navbar.style.background = 'rgba(29, 29, 31, 0.88)';
        }
      });
    }

    // Intersection Observer for fade-in animations on cards
    if ('IntersectionObserver' in window) {
      var cards = document.querySelectorAll('.focus-card, .article-card, .proof-item');
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

      cards.forEach(function(card) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(16px)';
        card.style.transition = 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(card);
      });
    }

    // Google Analytics event tracking
    if (typeof ga === "function") {
      $("a[data-ga-event]").click(function() {
        ga('send', 'event', $(this).data("ga-category"), $(this).data("ga-action"), $(this).data("ga-label"));
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', custom.init);
