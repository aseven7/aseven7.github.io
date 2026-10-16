/* ============================================================
   index.js — Loads pages.json and renders page cards
   ============================================================ */

(function () {
  'use strict';

  const gridEl    = document.getElementById('grid');
  const emptyEl   = document.getElementById('empty');
  const loadingEl = document.getElementById('loading');
  const statsEl   = document.getElementById('stats');
  const searchEl  = document.getElementById('searchInput');

  let allPages = [];

  /* ---------- Helpers ---------- */

  /** Format an ISO-8601 date string into a friendly display. */
  function formatDate(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  /** Create a single card element. */
  function createCard(page, index) {
    const card = document.createElement('a');
    card.className = 'card';
    card.href = page.path;
    card.style.animationDelay = `${index * 60}ms`;

    card.innerHTML = `
      <span class="card__title">${escapeHtml(page.title)}</span>
      <div class="card__meta">
        <span class="card__date">
          <svg class="card__date-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span class="card__date-label">Created</span>
          ${formatDate(page.created)}
        </span>
        <span class="card__date">
          <svg class="card__date-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>
          <span class="card__date-label">Modified</span>
          ${formatDate(page.modified)}
        </span>
      </div>
      <svg class="card__arrow" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
      </svg>
    `;

    return card;
  }

  /** Basic HTML escape. */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------- Render ---------- */

  function render(pages) {
    gridEl.innerHTML = '';

    if (pages.length === 0) {
      gridEl.hidden  = true;
      emptyEl.hidden = false;
      statsEl.innerHTML = '';
      return;
    }

    gridEl.hidden  = false;
    emptyEl.hidden = true;

    statsEl.innerHTML = `
      <span class="stats__badge">${pages.length}</span>
      page${pages.length === 1 ? '' : 's'}
    `;

    pages.forEach((page, i) => {
      gridEl.appendChild(createCard(page, i));
    });
  }

  /* ---------- Search ---------- */

  function onSearch() {
    const q = searchEl.value.trim().toLowerCase();
    if (!q) {
      render(allPages);
      return;
    }
    const filtered = allPages.filter(p => p.title.toLowerCase().includes(q));
    render(filtered);
  }

  searchEl.addEventListener('input', onSearch);

  /* ---------- Load Data ---------- */

  fetch('pages.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      allPages = data;
      loadingEl.hidden = true;
      render(allPages);
    })
    .catch(err => {
      console.warn('Could not load pages.json:', err);
      loadingEl.hidden = true;
      emptyEl.hidden = false;
    });

})();
