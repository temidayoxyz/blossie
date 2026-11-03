type ThemeChoice = 'light' | 'dark' | 'system';

const THEME_KEY = 'blossie:theme';
const root = document.documentElement;
const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
const themeLabels: Record<ThemeChoice, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

let toastTimer: number | undefined;

function getThemeChoice(): ThemeChoice {
  const value = root.dataset.themeChoice;
  return value === 'light' || value === 'dark' ? value : 'system';
}

function updateThemeControls(choice: ThemeChoice) {
  document.querySelectorAll<HTMLButtonElement>('[data-theme-option]').forEach((button) => {
    const isActive = button.dataset.themeOption === choice;
    button.setAttribute('aria-pressed', String(isActive));
  });

  document.querySelectorAll<HTMLElement>('[data-theme-trigger]').forEach((trigger) => {
    trigger.setAttribute('aria-label', `Appearance: ${themeLabels[choice]}`);
    trigger.dataset.choice = choice;
  });
}

function applyTheme(choice: ThemeChoice, persist = true) {
  root.classList.add('theme-transition');
  root.dataset.themeChoice = choice;

  if (choice === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.dataset.theme = choice;
  }

  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, choice);
    } catch {
      // Storage can be unavailable in private or restricted contexts.
    }
  }

  updateThemeControls(choice);
  window.setTimeout(() => root.classList.remove('theme-transition'), 500);
}

function initTheme() {
  updateThemeControls(getThemeChoice());

  document.querySelectorAll<HTMLElement>('[data-theme-select]').forEach((select) => {
    const trigger = select.querySelector<HTMLButtonElement>('[data-theme-trigger]');
    const menu = select.querySelector<HTMLElement>('[data-theme-menu]');
    const options = select.querySelectorAll<HTMLButtonElement>('[data-theme-option]');

    const closeMenu = (returnFocus = false) => {
      if (!trigger || !menu) return;
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      if (returnFocus) trigger.focus();
    };

    const openMenu = () => {
      if (!trigger || !menu) return;
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      const activeOption =
        menu.querySelector<HTMLButtonElement>('[aria-pressed="true"]') ??
        menu.querySelector<HTMLButtonElement>('[data-theme-option]');
      activeOption?.focus();
    };

    if (trigger && menu) {
      trigger.addEventListener('click', () => {
        if (menu.hidden) openMenu();
        else closeMenu(true);
      });

      select.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !menu.hidden) {
          event.preventDefault();
          closeMenu(true);
        }
      });

      document.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof Node)) return;
        if (!select.contains(target) && !menu.hidden) closeMenu();
      });
    }

    options.forEach((option) => {
      option.addEventListener('click', () => {
        const choice = option.dataset.themeOption as ThemeChoice;
        if (choice === 'light' || choice === 'dark' || choice === 'system') {
          applyTheme(choice);
          closeMenu(true);
        }
      });
    });
  });

  // If the visitor follows the system setting, respond to live OS changes.
  themeMedia.addEventListener('change', () => {
    if (getThemeChoice() === 'system') updateThemeControls('system');
  });
}

function initMenu() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-menu-dialog]');
  const openButton = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  const closeButton = document.querySelector<HTMLButtonElement>('[data-menu-close]');

  if (!dialog || !openButton) return;

  const openMenu = () => {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    root.classList.add('menu-open');
    openButton.setAttribute('aria-expanded', 'true');
    dialog.dataset.open = 'true';
    window.requestAnimationFrame(() => closeButton?.focus());
  };

  const closeMenu = (returnFocus = true) => {
    if (dialog.open && typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    root.classList.remove('menu-open');
    openButton.setAttribute('aria-expanded', 'false');
    dialog.dataset.open = 'false';
    if (returnFocus) openButton.focus();
  };

  openButton.addEventListener('click', openMenu);
  closeButton?.addEventListener('click', () => closeMenu());

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeMenu();
  });

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeMenu();
  });

  dialog.addEventListener('close', () => {
    root.classList.remove('menu-open');
    openButton.setAttribute('aria-expanded', 'false');
    dialog.dataset.open = 'false';
  });

  window.matchMedia('(min-width: 901px)').addEventListener('change', (event) => {
    if (event.matches && dialog.open) closeMenu(false);
  });
}

function initHeader() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;

  const update = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
}

function getToast(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-toast]');
}

function showToast(message: string) {
  const toast = getToast();
  if (!toast) return;
  if (toastTimer) window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 4000);
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the selection-based approach.
    }
  }

  try {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.top = '0';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    return copied;
  } catch {
    return false;
  }
}

function initSharing() {
  document.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const copyButton = target.closest<HTMLButtonElement>('[data-copy-link]');
    if (copyButton) {
      const url = copyButton.dataset.copyUrl || window.location.href;
      const copied = await copyToClipboard(url);
      showToast(copied ? 'Link copied to the clipboard.' : 'Copying was blocked by the browser. You can copy the address from the URL bar.');
      return;
    }

    const shareButton = target.closest<HTMLButtonElement>('[data-share-link]');
    if (shareButton) {
      const url = shareButton.dataset.shareUrl || window.location.href;
      const title = shareButton.dataset.shareTitle || document.title;
      if (navigator.share) {
        try {
          await navigator.share({ title, url });
        } catch (error) {
          if (!(error instanceof DOMException && error.name === 'AbortError')) {
            showToast('The share sheet could not open. You can copy the link instead.');
          }
        }
      } else {
        const copied = await copyToClipboard(url);
        showToast(copied ? 'Sharing is not available here, so the link was copied instead.' : 'Sharing is not available in this browser.');
      }
    }
  });
}

function initNewsletter() {
  document.querySelectorAll<HTMLFormElement>('[data-newsletter]').forEach((form) => {
    const input = form.querySelector<HTMLInputElement>('input[type="email"]');
    const feedback = form.querySelector<HTMLElement>('[data-newsletter-feedback]');
    if (!input || !feedback) return;

    const showFeedback = (message: string, isError = false) => {
      feedback.textContent = message;
      feedback.classList.toggle('is-error', isError);
    };

    input.addEventListener('input', () => {
      if (feedback.textContent) showFeedback('');
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      feedback.classList.remove('is-error');

      if (!input.value.trim()) {
        showFeedback('Please enter an email address first.', true);
        input.focus();
        return;
      }

      if (!input.validity.valid) {
        showFeedback('That email address does not look quite right. Please check it and try again.', true);
        input.focus();
        return;
      }

      showFeedback('Thank you. This is a design demo — nothing was stored or sent.');
      form.reset();
      showToast('Demo only: your address was not stored or sent.');
    });
  });
}

function initReadingProgress() {
  const article = document.querySelector<HTMLElement>('[data-reading-body]');
  const progress = document.querySelector<HTMLElement>('[data-reading-progress]');
  const bar = document.querySelector<HTMLElement>('[data-reading-progress-bar]');
  if (!article || !progress || !bar) return;

  let ticking = false;

  const update = () => {
    ticking = false;
    const rect = article.getBoundingClientRect();
    const articleTop = rect.top + window.scrollY;
    const start = articleTop - 100;
    const end = articleTop + article.offsetHeight - window.innerHeight * 0.65;
    const distance = Math.max(1, end - start);
    const progressValue = Math.min(1, Math.max(0, (window.scrollY - start) / distance));
    bar.style.transform = `scaleX(${progressValue})`;
    progress.classList.toggle('is-visible', window.scrollY > start && progressValue < 1);
    progress.classList.toggle('is-complete', progressValue >= 1);
  };

  const requestUpdate = () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  };

  update();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
}

initTheme();
initMenu();
initHeader();
initSharing();
initNewsletter();
initReadingProgress();

window.addEventListener('blossie:toast', ((event: CustomEvent<{ message: string }>) => {
  showToast(event.detail.message);
}) as EventListener);
