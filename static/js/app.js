/**
 * BigQuery Release Notes App - JavaScript Optimizado
 * Implementación Vanilla JS con delegación de eventos, debounce y compositor sincronizado.
 */

// Estado global de la aplicación
const state = {
  feedData: null,
  allUpdates: [],
  selectedUpdate: null,
  activeCategory: 'ALL',
  searchQuery: '',
  viewMode: 'timeline',
  isLoading: false,
};

// Referencias del DOM
const elements = {
  refreshBtn: document.getElementById('refreshBtn'),
  lastUpdatedText: document.getElementById('lastUpdatedText'),
  totalUpdatesBadge: document.getElementById('totalUpdatesBadge'),
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  categoryChips: document.getElementById('categoryChips'),
  statsContainer: document.getElementById('statsContainer'),
  viewButtons: document.querySelectorAll('.view-btn'),
  feedList: document.getElementById('feedList'),
  loadingSkeleton: document.getElementById('loadingSkeleton'),
  errorState: document.getElementById('errorState'),
  errorMessage: document.getElementById('errorMessage'),
  retryBtn: document.getElementById('retryBtn'),
  emptyState: document.getElementById('emptyState'),
  clearAllFiltersBtn: document.getElementById('clearAllFiltersBtn'),
  filterAlert: document.getElementById('filterAlert'),
  filterAlertText: document.getElementById('filterAlertText'),
  resetFilterBtn: document.getElementById('resetFilterBtn'),
  // Compositor
  composerColumn: document.getElementById('composerColumn'),
  composerEmpty: document.getElementById('composerEmpty'),
  composerActive: document.getElementById('composerActive'),
  closeComposerBtn: document.getElementById('closeComposerBtn'),
  selectedCatBadge: document.getElementById('selectedCatBadge'),
  selectedDateText: document.getElementById('selectedDateText'),
  sourceExcerptText: document.getElementById('sourceExcerptText'),
  tweetTextarea: document.getElementById('tweetTextarea'),
  mockupTweetBody: document.getElementById('mockupTweetBody'),
  charCount: document.getElementById('charCount'),
  charMeterFill: document.getElementById('charMeterFill'),
  tweetNowBtn: document.getElementById('tweetNowBtn'),
  copyTweetBtn: document.getElementById('copyTweetBtn'),
  tagChips: document.querySelectorAll('.tag-chip'),
  toastContainer: document.getElementById('toastContainer'),
};

/**
 * Utilidad: Debounce para optimizar búsquedas frecuentes
 */
function debounce(fn, delay = 180) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Muestra notificación toast temporal
 */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

/**
 * Carga o refresca el feed desde el backend Flask
 */
async function loadFeed(forceRefresh = false) {
  if (state.isLoading) return;
  state.isLoading = true;

  elements.refreshBtn.classList.add('refreshing');
  if (!state.feedData) {
    elements.loadingSkeleton.style.display = 'flex';
    elements.feedList.style.display = 'none';
  }
  elements.errorState.style.display = 'none';

  try {
    const url = `/api/feed${forceRefresh ? '?force=1' : ''}`;
    const res = await fetch(url);
    const result = await res.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Respuesta inválida del servidor');
    }

    state.feedData = result.data;

    // Aplanar todas las actualizaciones individuales
    state.allUpdates = [];
    state.feedData.entries.forEach(entry => {
      entry.items.forEach(item => state.allUpdates.push(item));
    });

    // Actualizar cabecera y estadísticas
    updateHeaderStats();
    renderFeed();

    if (forceRefresh) {
      showToast('¡Feed de BigQuery actualizado con éxito!', 'success');
    }
  } catch (err) {
    console.error('Error al cargar feed:', err);
    if (!state.feedData) {
      elements.errorMessage.textContent = err.message || 'No se pudo conectar con el servidor.';
      elements.errorState.style.display = 'block';
    } else {
      showToast(`Error al refrescar: ${err.message}`, 'error');
    }
  } finally {
    state.isLoading = false;
    elements.refreshBtn.classList.remove('refreshing');
    elements.loadingSkeleton.style.display = 'none';
  }
}

/**
 * Actualiza los contadores del header y KPI cards
 */
function updateHeaderStats() {
  const data = state.feedData;
  if (!data) return;

  if (data.fetched_at) {
    const timeOnly = data.fetched_at.split(' ')[1] || data.fetched_at;
    elements.lastUpdatedText.textContent = `Actualizado: ${timeOnly}`;
  }
  elements.totalUpdatesBadge.textContent = `${data.total_updates} novedades (${data.total_entries} fechas)`;

  // Actualizar KPI Stats Strip
  const stats = data.stats || {};
  const setStat = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? 0;
  };

  setStat('statFeatures', stats.Feature);
  setStat('statChanges', stats.Change);
  setStat('statAnnouncements', stats.Announcement);
  setStat('statFixed', stats.Fixed);
  setStat('statDeprecated', stats.Deprecated);
}

/**
 * Filtra los elementos según categoría y término de búsqueda
 */
function getFilteredItems() {
  if (!state.feedData) return [];

  const query = state.searchQuery.toLowerCase().trim();
  const cat = state.activeCategory.toUpperCase();

  return state.allUpdates.filter(item => {
    // Filtro por categoría
    if (cat !== 'ALL' && item.category.toUpperCase() !== cat) {
      return false;
    }
    // Filtro por texto
    if (query) {
      const matchText = (item.plain_text || '').toLowerCase();
      const matchDate = (item.date || '').toLowerCase();
      const matchCat = (item.category || '').toLowerCase();
      return matchText.includes(query) || matchDate.includes(query) || matchCat.includes(query);
    }
    return true;
  });
}

/**
 * Renderiza el feed con soporte para Timeline o Cards
 */
function renderFeed() {
  if (!state.feedData) return;

  const filteredItems = getFilteredItems();
  const filteredIds = new Set(filteredItems.map(item => item.id));

  // Banner de alerta de filtro
  const isFiltering = state.activeCategory !== 'ALL' || state.searchQuery.trim() !== '';
  if (isFiltering) {
    elements.filterAlert.style.display = 'flex';
    elements.filterAlertText.textContent = `Se encontraron ${filteredItems.length} actualización(es) con los filtros actuales`;
  } else {
    elements.filterAlert.style.display = 'none';
  }

  // Estado vacío
  if (filteredItems.length === 0) {
    elements.feedList.style.display = 'none';
    elements.emptyState.style.display = 'block';
    return;
  }

  elements.emptyState.style.display = 'none';
  elements.feedList.style.display = 'block';

  const isTimeline = state.viewMode === 'timeline';
  elements.feedList.className = `feed-list ${isTimeline ? 'timeline-mode' : 'cards-mode'}`;

  const htmlBuffer = [];

  if (isTimeline) {
    state.feedData.entries.forEach(entry => {
      const itemsInEntry = entry.items.filter(it => filteredIds.has(it.id));
      if (itemsInEntry.length === 0) return;

      htmlBuffer.push(`
        <div class="date-group">
          <div class="date-header">
            <div class="date-bullet"></div>
            <h3 class="date-title">${escapeHtml(entry.title)}</h3>
            <a href="${escapeHtml(entry.link)}" target="_blank" rel="noopener noreferrer" class="date-anchor-link" title="Ver en Google Cloud Docs">
              <span>Docs Oficiales</span>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
          <div class="updates-container">
            ${itemsInEntry.map(item => buildCardHTML(item)).join('')}
          </div>
        </div>
      `);
    });
  } else {
    htmlBuffer.push(`
      <div class="updates-container">
        ${filteredItems.map(item => buildCardHTML(item)).join('')}
      </div>
    `);
  }

  elements.feedList.innerHTML = htmlBuffer.join('');
}

/**
 * Genera el string HTML para una tarjeta de actualización individual
 */
function buildCardHTML(item) {
  const isSelected = state.selectedUpdate && state.selectedUpdate.id === item.id;
  const catClass = getCategoryBadgeClass(item.category);

  return `
    <article class="update-card ${isSelected ? 'selected' : ''}" data-update-id="${item.id}">
      <div class="card-header-bar">
        <div class="card-tags">
          <span class="badge ${catClass}">${escapeHtml(item.category)}</span>
          <span class="card-date-label">${escapeHtml(item.date)}</span>
        </div>
        <button class="btn-card-tweet" type="button" data-action="tweet" data-update-id="${item.id}">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          Twittear
        </button>
      </div>
      <div class="card-content-body">
        ${item.body_html}
      </div>
    </article>
  `;
}

/**
 * Clase CSS de la insignia según categoría
 */
function getCategoryBadgeClass(catName = '') {
  const c = catName.toLowerCase();
  if (c.includes('feature')) return 'badge-feature';
  if (c.includes('change')) return 'badge-change';
  if (c.includes('announcement')) return 'badge-announcement';
  if (c.includes('fixed') || c.includes('fix')) return 'badge-fixed';
  if (c.includes('deprecat')) return 'badge-deprecated';
  if (c.includes('security')) return 'badge-security';
  return 'badge-change';
}

/**
 * Selecciona una actualización y sincroniza el compositor de tweets
 */
function selectUpdate(item) {
  state.selectedUpdate = item;

  // Actualiza clase seleccionada en el DOM
  document.querySelectorAll('.update-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.updateId === item.id);
  });

  // Mostrar panel activo del compositor
  elements.composerEmpty.style.display = 'none';
  elements.composerActive.style.display = 'block';
  elements.composerColumn.classList.add('drawer-open');

  // Metadatos
  elements.selectedCatBadge.textContent = item.category;
  elements.selectedCatBadge.className = `selected-cat-pill ${getCategoryBadgeClass(item.category)}`;
  elements.selectedDateText.textContent = item.date;
  elements.sourceExcerptText.textContent = item.plain_text;

  // Generar borrador de post optimizado
  generateTweetDraft(item);

  // Scroll suave en móviles
  if (window.innerWidth <= 1024) {
    elements.composerColumn.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Redacta el tweet asegurando que no exceda 280 caracteres
 */
function generateTweetDraft(item) {
  const dateStr = item.date;
  const linkStr = item.link;
  const hashtags = '#BigQuery #GoogleCloud';

  const prefix = `BigQuery ${item.category} (${dateStr}): `;
  // En X, cualquier URL cuenta como 23 caracteres
  const urlEquivalentLength = 23;
  const reservedLen = prefix.length + hashtags.length + urlEquivalentLength + 6;
  const maxSnippetLen = Math.max(50, 280 - reservedLen);

  let snippet = item.plain_text.trim();
  if (snippet.length > maxSnippetLen) {
    snippet = snippet.substring(0, maxSnippetLen - 3).trim() + '...';
  }

  const tweetText = `${prefix}${snippet}\n\n${hashtags}\n${linkStr}`;
  elements.tweetTextarea.value = tweetText;
  syncMockupAndCounter();
}

/**
 * Sincroniza la vista previa del tweet y el contador de caracteres
 */
function syncMockupAndCounter() {
  const text = elements.tweetTextarea.value;
  elements.mockupTweetBody.textContent = text || '...';

  // Cálculo de longitud para Twitter
  const count = text.length;
  elements.charCount.textContent = count;

  const percentage = Math.min(100, (count / 280) * 100);
  elements.charMeterFill.style.width = `${percentage}%`;

  const infoWrap = elements.charCount.parentElement;
  infoWrap.classList.remove('warning', 'danger');
  elements.charMeterFill.classList.remove('warning', 'danger');

  if (count > 280) {
    infoWrap.classList.add('danger');
    elements.charMeterFill.classList.add('danger');
  } else if (count > 240) {
    infoWrap.classList.add('warning');
    elements.charMeterFill.classList.add('warning');
  }
}

/**
 * Publica directamente abriendo el Web Intent de X / Twitter
 */
function launchTweet() {
  const text = elements.tweetTextarea.value.trim();
  if (!text) {
    showToast('El texto del tweet está vacío', 'error');
    return;
  }
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(tweetUrl, '_blank', 'noopener,noreferrer');
  showToast('Abriendo X (Twitter)...', 'success');
}

/**
 * Copia el tweet al portapapeles
 */
async function copyTweetToClipboard() {
  const text = elements.tweetTextarea.value;
  if (!text) return;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      elements.tweetTextarea.select();
      document.execCommand('copy');
    }
    showToast('¡Tweet copiado al portapapeles!', 'success');
  } catch {
    showToast('No se pudo copiar el texto', 'error');
  }
}

/**
 * Escapado seguro de HTML
 */
function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==========================================================
   Delegación y Controladores de Eventos
   ========================================================== */

// Delegación de eventos en feedList (ultra rápido y sin fugas de memoria)
elements.feedList.addEventListener('click', (e) => {
  // Evitar interceptar links dentro del texto
  if (e.target.tagName === 'A') return;

  const card = e.target.closest('.update-card');
  if (!card) return;

  const updateId = card.dataset.updateId;
  const foundItem = state.allUpdates.find(u => u.id === updateId);
  if (!foundItem) return;

  selectUpdate(foundItem);

  // Si se hizo click directamente en el botón "Twittear"
  const isTweetBtn = e.target.closest('[data-action="tweet"]');
  if (isTweetBtn) {
    elements.tweetTextarea.focus();
  }
});

// Refresco
elements.refreshBtn.addEventListener('click', () => loadFeed(true));
if (elements.retryBtn) elements.retryBtn.addEventListener('click', () => loadFeed(true));

// Búsqueda con debounce
elements.searchInput.addEventListener('input', debounce((e) => {
  state.searchQuery = e.target.value;
  elements.clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
  renderFeed();
}, 150));

elements.clearSearchBtn.addEventListener('click', () => {
  elements.searchInput.value = '';
  state.searchQuery = '';
  elements.clearSearchBtn.style.display = 'none';
  elements.searchInput.focus();
  renderFeed();
});

// Atajo de teclado: presionar '/' para enfocar búsqueda
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== elements.searchInput && document.activeElement !== elements.tweetTextarea) {
    e.preventDefault();
    elements.searchInput.focus();
  }
});

// Filtrado por categoría desde los chips
elements.categoryChips.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;

  elements.categoryChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');

  state.activeCategory = chip.dataset.category || 'ALL';
  renderFeed();
});

// Filtrado rápido al hacer click en las tarjetas KPI
if (elements.statsContainer) {
  elements.statsContainer.addEventListener('click', (e) => {
    const statCard = e.target.closest('.stat-card');
    if (!statCard) return;
    const cat = statCard.dataset.cat;
    if (!cat) return;

    state.activeCategory = cat;
    elements.categoryChips.querySelectorAll('.chip').forEach(c => {
      c.classList.toggle('active', c.dataset.category === cat);
    });
    renderFeed();
  });
}

// Selector de Vistas (Cronología vs Tarjetas)
elements.viewButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    elements.viewButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.viewMode = btn.dataset.view;
    renderFeed();
  });
});

// Restablecer filtros
const resetFilters = () => {
  elements.searchInput.value = '';
  state.searchQuery = '';
  elements.clearSearchBtn.style.display = 'none';
  state.activeCategory = 'ALL';
  elements.categoryChips.querySelectorAll('.chip').forEach(c => {
    c.classList.toggle('active', c.dataset.category === 'ALL');
  });
  renderFeed();
};

if (elements.resetFilterBtn) elements.resetFilterBtn.addEventListener('click', resetFilters);
if (elements.clearAllFiltersBtn) elements.clearAllFiltersBtn.addEventListener('click', resetFilters);

// Textarea del Tweet
elements.tweetTextarea.addEventListener('input', syncMockupAndCounter);

// Chips de Hashtags
elements.tagChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const tag = chip.dataset.tag;
    const current = elements.tweetTextarea.value;
    if (current.includes(tag)) {
      elements.tweetTextarea.value = current.replace(new RegExp(`\\s*${tag}`, 'g'), '').trim();
      chip.classList.remove('active');
    } else {
      const lines = current.split('\n');
      const last = lines[lines.length - 1];
      if (last.startsWith('http')) {
        lines.splice(lines.length - 1, 0, tag);
        elements.tweetTextarea.value = lines.join('\n');
      } else {
        elements.tweetTextarea.value = `${current} ${tag}`;
      }
      chip.classList.add('active');
    }
    syncMockupAndCounter();
  });
});

// Botones de acción del Compositor
elements.tweetNowBtn.addEventListener('click', launchTweet);
elements.copyTweetBtn.addEventListener('click', copyTweetToClipboard);

// Cerrar panel en móviles
elements.closeComposerBtn.addEventListener('click', () => {
  elements.composerColumn.classList.remove('drawer-open');
  if (state.selectedUpdate) {
    state.selectedUpdate = null;
    document.querySelectorAll('.update-card.selected').forEach(c => c.classList.remove('selected'));
  }
  elements.composerActive.style.display = 'none';
  elements.composerEmpty.style.display = 'block';
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => loadFeed(false));
