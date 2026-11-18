(function () {
  'use strict';
  const button = document.getElementById('cv-print');
  if (!button) return;
  button.hidden = false;
  button.addEventListener('click', function () { window.print(); });
})();
