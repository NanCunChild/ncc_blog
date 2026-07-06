(function () {
  'use strict';

  var FOLD_THRESHOLD = window.codeBlockFoldLines || 15;

  function init() {
    var blocks = document.querySelectorAll('pre');

    Array.prototype.forEach.call(blocks, function (pre) {
      if (pre.classList.contains('mermaid')) return;
      if (pre.closest('.code-block-wrapper')) return;

      var code = pre.querySelector('code');
      var text = code ? code.textContent : pre.textContent;
      var lines = text.split('\n');

      if (lines.length && lines[lines.length - 1] === '') {
        lines.pop();
      }

      if (lines.length <= FOLD_THRESHOLD) return;

      var container = pre.closest('.code-toolbar');
      container = container || pre;

      var wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper collapsed';
      container.parentNode.insertBefore(wrapper, container);
      wrapper.appendChild(container);

      var fade = document.createElement('div');
      fade.className = 'code-block-fade';
      wrapper.appendChild(fade);

      var toggle = document.createElement('button');
      toggle.className = 'code-block-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML =
        '<span class="toggle-text">Show all ' +
        lines.length +
        ' lines</span> <span class="toggle-icon">&#9660;</span>';
      wrapper.appendChild(toggle);

      toggle.addEventListener('click', function () {
        if (wrapper.classList.contains('expanded')) {
          wrapper.classList.remove('expanded');
          wrapper.classList.add('collapsed');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.innerHTML =
            '<span class="toggle-text">Show all ' +
            lines.length +
            ' lines</span> <span class="toggle-icon">&#9660;</span>';
        } else {
          wrapper.classList.remove('collapsed');
          wrapper.classList.add('expanded');
          toggle.setAttribute('aria-expanded', 'true');
          toggle.innerHTML =
            '<span class="toggle-text">Collapse</span> <span class="toggle-icon">&#9660;</span>';
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
