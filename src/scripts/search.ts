interface SearchDocument {
  title: string;
  url: string;
  category: string;
  excerpt: string;
  standfirst: string;
  tags: string[];
  date: string;
  readingTime: number;
  body: string;
}

interface SearchMatch {
  document: SearchDocument;
  score: number;
  snippet: string;
}

export {};

const form = document.querySelector<HTMLFormElement>('[data-search-form]');
const input = document.querySelector<HTMLInputElement>('[data-search-input]');
const clearButton = document.querySelector<HTMLButtonElement>('[data-search-clear]');
const status = document.querySelector<HTMLElement>('[data-search-status]');
const initial = document.querySelector<HTMLElement>('[data-search-initial]');
const output = document.querySelector<HTMLElement>('[data-search-results]');
const outputLabel = document.querySelector<HTMLElement>('[data-search-query-label]');
const list = document.querySelector<HTMLElement>('[data-search-list]');
const empty = document.querySelector<HTMLElement>('[data-search-empty]');
const emptyCopy = document.querySelector<HTMLElement>('[data-search-empty-copy]');

let documents: SearchDocument[] | null = null;
let loading: Promise<SearchDocument[]> | null = null;
let debounce: number | undefined;
let emptyMessage =
  'Try a broader word, a subject, or something you remember from a story.';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function updateUrl(query: string) {
  const next = new URLSearchParams(window.location.search);
  if (query.trim()) next.set('q', query.trim());
  else next.delete('q');
  const suffix = next.toString();
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${suffix ? `?${suffix}` : ''}`,
  );
}

function updateClearButton() {
  if (!clearButton || !input) return;
  clearButton.hidden = !input.value.trim();
}

function setStatus(message: string) {
  if (status) status.textContent = message;
}

function showInitial() {
  if (!initial || !output || !empty) return;
  initial.hidden = false;
  output.hidden = true;
  empty.hidden = true;
  setStatus('Enter a word to begin.');
  if (outputLabel) outputLabel.textContent = '';
  updateClearButton();
}

async function loadDocuments(): Promise<SearchDocument[]> {
  if (documents) return documents;
  if (!loading) {
    loading = fetch('/search-index.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Search index returned ${response.status}`);
        return response.json() as Promise<SearchDocument[]>;
      })
      .then((data) => {
        documents = data;
        return data;
      })
      .finally(() => {
        loading = null;
      });
  }
  return loading;
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 10);
}

function makeSnippet(document: SearchDocument, tokens: string[]): string {
  const body = document.body;
  const lowerBody = body.toLowerCase();
  let firstMatch = -1;

  for (const token of tokens) {
    const index = lowerBody.indexOf(token);
    if (index >= 0 && (firstMatch === -1 || index < firstMatch)) firstMatch = index;
  }

  if (firstMatch < 0) return document.excerpt;

  let start = Math.max(0, firstMatch - 90);
  let end = Math.min(body.length, firstMatch + 210);

  if (start > 0) {
    const space = body.indexOf(' ', start);
    start = space >= 0 ? space + 1 : start;
  }
  if (end < body.length) {
    const space = body.lastIndexOf(' ', end);
    end = space > start ? space : end;
  }

  return `${start > 0 ? '…' : ''}${body.slice(start, end).trim()}${end < body.length ? '…' : ''}`;
}

function findMatches(query: string, allDocuments: SearchDocument[]): SearchMatch[] {
  const tokens = tokenize(query);
  if (!tokens.length) return [];

  return allDocuments
    .map((document) => {
      const title = document.title.toLowerCase();
      const category = document.category.toLowerCase();
      const tags = document.tags.join(' ').toLowerCase();
      const summary = `${document.standfirst} ${document.excerpt}`.toLowerCase();
      const body = document.body.toLowerCase();

      let score = 0;
      let matchesAll = true;

      for (const token of tokens) {
        let tokenScore = 0;
        if (title.includes(token)) tokenScore += 12;
        if (category.includes(token)) tokenScore += 6;
        if (tags.includes(token)) tokenScore += 6;
        if (summary.includes(token)) tokenScore += 3;
        if (body.includes(token)) tokenScore += 1;

        if (tokenScore === 0) {
          matchesAll = false;
          break;
        }
        score += tokenScore;
      }

      return {
        document,
        score,
        snippet: makeSnippet(document, tokens),
        matchesAll,
      };
    })
    .filter((match) => match.matchesAll)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.document.date).valueOf() - new Date(a.document.date).valueOf(),
    )
    .map(({ document, score, snippet }) => ({ document, score, snippet }));
}

function appendHighlighted(parent: HTMLElement, text: string, tokens: string[]) {
  if (!tokens.length) {
    parent.textContent = text;
    return;
  }

  const pattern = new RegExp(
    `(${tokens
      .slice()
      .sort((a, b) => b.length - a.length)
      .map(escapeRegExp)
      .join('|')})`,
    'gi',
  );

  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parent.append(document.createTextNode(text.slice(lastIndex, index)));
    }
    const mark = document.createElement('mark');
    mark.textContent = match[0];
    parent.append(mark);
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parent.append(document.createTextNode(text.slice(lastIndex)));
  }
}

function createResult(match: SearchMatch, tokens: string[]): HTMLElement {
  const article = document.createElement('article');
  article.className = 'search-result';

  const body = document.createElement('div');
  body.className = 'search-result__body';

  const meta = document.createElement('div');
  meta.className = 'search-result__meta';

  const category = document.createElement('span');
  category.className = 'category';
  category.textContent = match.document.category;
  meta.append(category);

  const dot = document.createElement('span');
  dot.className = 'meta__dot';
  dot.setAttribute('aria-hidden', 'true');
  meta.append(dot);

  const date = document.createElement('span');
  date.textContent = new Date(match.document.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  meta.append(date);

  const dotTwo = document.createElement('span');
  dotTwo.className = 'meta__dot';
  dotTwo.setAttribute('aria-hidden', 'true');
  meta.append(dotTwo);

  const reading = document.createElement('span');
  reading.textContent = `${match.document.readingTime} min read`;
  meta.append(reading);

  const title = document.createElement('h2');
  title.className = 'search-result__title';
  const link = document.createElement('a');
  link.href = match.document.url;
  appendHighlighted(link, match.document.title, tokens);
  title.append(link);

  const description = document.createElement('p');
  appendHighlighted(description, match.snippet, tokens);

  body.append(meta, title, description);

  const arrow = document.createElement('span');
  arrow.className = 'search-result__arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.innerHTML =
    '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 8h10M9.5 4.5 13 8l-3.5 3.5"/></svg>';

  article.append(body, arrow);
  return article;
}

function renderMatches(matches: SearchMatch[], query: string) {
  if (!list || !output || !empty || !initial) return;
  const tokens = tokenize(query);
  list.replaceChildren();

  if (matches.length === 0) {
    output.hidden = true;
    initial.hidden = true;
    empty.hidden = false;
    if (emptyCopy) emptyCopy.textContent = emptyMessage;
    setStatus(`No stories found for “${query.trim()}”.`);
    return;
  }

  const fragment = document.createDocumentFragment();
  matches.forEach((match) => fragment.append(createResult(match, tokens)));
  list.append(fragment);

  initial.hidden = true;
  empty.hidden = true;
  output.hidden = false;
  if (outputLabel) {
    outputLabel.textContent = `Stories matching “${query.trim()}”`;
  }
  setStatus(
    `${matches.length} ${matches.length === 1 ? 'story' : 'stories'} found for “${query.trim()}”.`,
  );
}

async function runSearch() {
  if (!input || !output || !initial || !empty) return;
  const query = input.value.trim();
  updateClearButton();
  updateUrl(query);

  if (!query) {
    showInitial();
    return;
  }

  setStatus('Searching the journal…');
  output.setAttribute('aria-busy', 'true');

  try {
    const allDocuments = await loadDocuments();
    if (input.value.trim() !== query) return;
    renderMatches(findMatches(query, allDocuments), query);
  } catch {
    initial.hidden = true;
    output.hidden = true;
    empty.hidden = false;
    if (emptyCopy) {
      emptyCopy.textContent =
        'The search index could not be loaded just now. You can still browse the journal or the archive.';
    }
    if (outputLabel) outputLabel.textContent = '';
    setStatus('Search is temporarily unavailable.');
  } finally {
    output.setAttribute('aria-busy', 'false');
  }
}

function clearSearch(focus = true) {
  if (!input) return;
  input.value = '';
  updateClearButton();
  showInitial();
  updateUrl('');
  if (focus) input.focus();
}

if (form && input && output && initial && empty) {
  const initialQuery = new URLSearchParams(window.location.search).get('q') ?? '';

  if (initialQuery) {
    input.value = initialQuery;
    updateClearButton();
    void runSearch();
  } else {
    showInitial();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (debounce) window.clearTimeout(debounce);
    void runSearch();
  });

  input.addEventListener('input', () => {
    updateClearButton();
    if (debounce) window.clearTimeout(debounce);
    if (!input.value.trim()) {
      showInitial();
      updateUrl('');
      return;
    }
    debounce = window.setTimeout(() => {
      void runSearch();
    }, 130);
  });

  input.addEventListener('search', () => {
    if (!input.value.trim()) clearSearch(false);
  });

  clearButton?.addEventListener('click', () => clearSearch());

  document.querySelectorAll<HTMLAnchorElement>('[data-search-suggestion]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const suggestion = link.dataset.searchSuggestion;
      if (!suggestion) return;
      event.preventDefault();
      input.value = suggestion;
      updateClearButton();
      void runSearch();
    });
  });

  document.addEventListener('keydown', (event) => {
    const target = event.target as HTMLElement | null;
    const isTyping =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target?.isContentEditable;

    if (
      (!isTyping && event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) ||
      ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')
    ) {
      event.preventDefault();
      input.focus();
      input.select();
    }

    if (event.key === 'Escape' && document.activeElement === input) {
      if (input.value) {
        event.preventDefault();
        clearSearch();
      }
    }
  });
}
