import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  sampleRUM,
  getMetadata,
} from './aem.js';

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

function articleDate() {
  const meta = getMetadata('article-date');
  if (meta) {
    const time = meta.split(' ')[1];
    const date = meta.split(' ')[0];
    let year;
    let month;
    let day;
    [year, month, day] = date.split('-');
    const mL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthIndex = Number(`${month}`) - 1;
    month = mL[monthIndex];
    const myDate = new Date(`${month} ${day}, ${year}`);
    const fullDay = dL[myDate.getDay()];
    const dateline = `${fullDay}, ${month} ${day}, ${year} - ${time} `;
    return dateline;
  }
  return false;
}

function setDateline() {
  const template = getMetadata('template');
  if (template === 'news') {
    const target = document.querySelector('main > .section > .default-content-wrapper');
    const dateline = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'date-label';
    title.innerText = 'Article Date';
    const date = document.createElement('div');
    date.className = 'date-item';
    date.innerText = articleDate();
    dateline.append(title, date);
    target.append(dateline);
  }
}

function setPageBackground() {
  const body = document.querySelector('body');
  const meta = getMetadata('page-background');
  if (meta) {
    body.style.backgroundImage = `url(${meta}?width=2000&format=webp&optimize=medium)`;
  }
}

async function loadJsFile(url, callback) {
  const script = document.createElement('script');
  script.src = url;
  const head = document.querySelector('head');
  head.append(script);
  callback();
}

function loadCssFile(url) {
  const link = document.createElement('link');
  link.href = url;
  link.rel = 'stylesheet';
  const head = document.querySelector('head');
  head.append(link);
}

function setupSa11y() {
  setTimeout(() => {
    Sa11y.Lang.addI18n(Sa11yLangEn.strings);
  const sa11y = new Sa11y.Sa11y({
    checkRoot: 'main',
    panelPosition: "left",
  });
  }, '3000');
  
}

const runSa11y = async () => {
  loadCssFile('https://cdn.jsdelivr.net/gh/ryersondmp/sa11y@3.2.2/dist/css/sa11y.min.css');
  loadJsFile('https://cdn.jsdelivr.net/combine/gh/ryersondmp/sa11y@3.2.2/dist/js/lang/en.umd.js,gh/ryersondmp/sa11y@3.2.2/dist/js/sa11y.umd.min.js', setupSa11y); 
};

const sk = document.querySelector('helix-sidekick');
if (sk) {
  // sidekick already loaded
  sk.addEventListener('custom:runSa11y', runSa11y);
} else {
  // wait for sidekick to be loaded
  document.addEventListener('sidekick-ready', () => {
    document.querySelector('helix-sidekick')
      .addEventListener('custom:runSa11y', runSa11y);
  }, { once: true });
}


/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  setPageBackground();
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  sampleRUM.enhance();

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);
  setDateline();
  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
