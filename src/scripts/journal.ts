interface JournalState {
  query: string;
  topic: string;
  sort: 'newest' | 'oldest' | 'az';
}

export {};

const grid = document.querySelector<HTMLElement>('[data-journal-grid]');
const searchForm = document.querySelector<HTMLFormElement>('[data-journal-search-form]');
const searchInput = document.querySelector<HTMLInputElement>('[data-journal-search]');
const sortSelect = document.querySelector<HTMLSelectElement>('[data-journal-sort]');
const filterChips = Array.from(
  document.querySelectorAll<HTMLAnchorElement>('[data-filter-topic]'),
);
const status = document.querySelector<HTMLElement>('[data-journal-status]');
const empty = document.querySelector<HTMLElement>('[data-journal-empty]');
const resetButton = document.querySelector<HTMLButtonElement>('[data-journal-reset]');

if (grid && searchInput && sortSelect) {
  const cards = Array.from(grid.querySelectorAll<HTMLElement>('[data-article]'));
  const validSorts: JournalState['sort'][] = ['newest', 'oldest', 'az'];
  const params = new URLSearchParams(window.location.search);

  const initialSort = params.get('sort');
  const state: JournalState = {
    query: params.get('q') ?? '',
    topic: params.get('topic') ?? 'all',
    sort: validSorts.includes(initialSort as JournalState['sort'])
      ? (initialSort as JournalState['sort'])
      : 'newest',
  };

  searchInput.value = state.query;
  sortSelect.value = state.sort;

  if (!filterChips.some((chip) => chip.dataset.filterTopic === state.topic)) {
    state.topic = 'all';
  }

  const normalize = (value: string) => value.trim().toLowerCase();

  const updateUrl = () => {
    const next = new URLSearchParams(window.location.search);
    if (state.query.trim()) next.set('q', state.query.trim());
    else next.delete('q');
    if (state.topic !== 'all') next.set('topic', state.topic);
    else next.delete('topic');
    if (state.sort !== 'newest') next.set('sort', state.sort);
    else next.delete('sort');
    const queryString = next.toString();
    const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`;
    window.history.replaceState(null, '', nextUrl);
  };

  const updateChips = () => {
    filterChips.forEach((chip) => {
      const isActive = chip.dataset.filterTopic === state.topic;
      chip.classList.toggle('is-active', isActive);
      if (isActive) chip.setAttribute('aria-current', 'true');
      else chip.removeAttribute('aria-current');
    });
  };

  const sortCards = (visibleCards: HTMLElement[]) => {
    const sorted = [...visibleCards].sort((a, b) => {
      if (state.sort === 'az') {
        return (a.dataset.title ?? '').localeCompare(b.dataset.title ?? '');
      }
      const dateA = Number(a.dataset.date ?? 0);
      const dateB = Number(b.dataset.date ?? 0);
      return state.sort === 'oldest' ? dateA - dateB : dateB - dateA;
    });
    sorted.forEach((card) => grid.append(card));
  };

  const applyFilters = () => {
    const query = normalize(state.query);
    const tokens = query.split(/\s+/).filter(Boolean);
    const activeChip = filterChips.find((chip) => chip.dataset.filterTopic === state.topic);
    const activeCategory = activeChip?.dataset.category ?? 'all';

    const visible = cards.filter((card) => {
      const matchesTopic = activeCategory === 'all' || card.dataset.category === activeCategory;
      if (!matchesTopic) return false;
      if (!tokens.length) return true;
      const haystack = card.dataset.search ?? '';
      return tokens.every((token) => haystack.includes(token));
    });

    sortCards(visible);

    cards.forEach((card) => {
      card.hidden = !visible.includes(card);
    });

    if (status) {
      const queryLabel = state.query.trim() ? ` for “${state.query.trim()}”` : '';
      status.textContent = `Showing ${visible.length} of ${cards.length} stories${queryLabel}`;
    }

    if (empty) empty.hidden = visible.length !== 0;
    updateChips();
    updateUrl();
  };

  filterChips.forEach((chip) => {
    chip.addEventListener('click', (event) => {
      event.preventDefault();
      state.topic = chip.dataset.filterTopic ?? 'all';
      applyFilters();
    });
  });

  searchInput.addEventListener('input', () => {
    state.query = searchInput.value;
    applyFilters();
  });

  searchForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    state.query = searchInput.value;
    applyFilters();
  });

  sortSelect.addEventListener('change', () => {
    state.sort = validSorts.includes(sortSelect.value as JournalState['sort'])
      ? (sortSelect.value as JournalState['sort'])
      : 'newest';
    applyFilters();
  });

  resetButton?.addEventListener('click', () => {
    state.query = '';
    state.topic = 'all';
    state.sort = 'newest';
    searchInput.value = '';
    sortSelect.value = 'newest';
    applyFilters();
    searchInput.focus();
  });

  applyFilters();
}
