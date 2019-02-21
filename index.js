import './lib/page.js';

const template = document.createElement('template');
template.innerHTML = /* html */ `
  <style>
    :host {
      display: block;
      --white: #fff;
    }

    #root {
      height: 100%;
      width: 100%;
      position: relative;
      background-color: var(--white);
    }

    .top-pane {
      background: linear-gradient(to bottom,#000 0%,rgba(229,229,229,0) 100%);
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: 0.75em;
      display: grid;
      user-select: none;
      grid-template-columns: 1fr 1fr;
      transition: opacity 1s;
      opacity: 0;
      z-index: 1;
    }

    .top-pane.open,
    .top-pane:focus-within {
      opacity: 1;
    }

    .top-pane-right {
      justify-self: end;
    }

    .top-pane button.icon {
      height: 50px;
      width: 50px;
      margin: 0 1em;
    }

    button.icon {
      background-color: transparent;
      border: none;
      padding: 0;
    }

    button.icon#fit-height {
      transform: rotate(90deg);
    }

    button.icon svg {
      fill: var(--white);
    }

    .progress-container {
      display: none;
    }

    .progress-container.open {
      display: block;
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    progress {
      -webkit-appearance: none;
    }

    progress::-moz-progress-bar {
      background: dodgerblue;
    }
    ::-webkit-progress-bar {
      background-color: dodgerblue;
    }
    progress::-webkit-progress-value {
      background: midnightblue;
    }

    #root:focus {
      outline: none;
    }

    #viewer {
      display: flex;
      height: 100%;
      --x: 0;
      transform: translateX(var(--x));
    }

    #viewer:not(.updating) {
      transition: transform .3s ease-out;
    }

    .fit-height {
      height: 100%;
      width: 100%;
      justify-content: center;
    }

    .fit-height comic-reader-page {
      height: 100%;
    }

    .fit-height .current {
      grid-column: 1 / 6;
      justify-self: center;
    }

    .fit-height :not(.current) {
      display: none;
    }

    .fit-width {
      width: 500%;
    }

    .fit-width comic-reader-page {
      width: 100%;
    }
  </style>
  <div id="root" tabindex="0">
    <div class="top-pane controls">
      <div class="top-pane-left">
        <button id="fit-width" class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <title>Fit width</title>
            <path d="M190.4 354.1L91.9 256l98.4-98.1-30-29.9L32 256l128.4 128 30-29.9zm131.2 0L420 256l-98.4-98.1 30-29.9L480 256 351.6 384l-30-29.9z"/></svg>
        </button>
        <button id="fit-height" class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <title>Fit height</title>
            <path d="M190.4 354.1L91.9 256l98.4-98.1-30-29.9L32 256l128.4 128 30-29.9zm131.2 0L420 256l-98.4-98.1 30-29.9L480 256 351.6 384l-30-29.9z"/></svg>
        </button>
      </div>
      <div class="top-pane-right">
        <button id="fullscreen" class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <title>Enter fullscreen</title>
            <path d="M396.795 396.8H320V448h128V320h-51.205zM396.8 115.205V192H448V64H320v51.205zM115.205 115.2H192V64H64v128h51.205zM115.2 396.795V320H64v128h128v-51.205z"/></svg>
        </button>
      </div>
    </div>
    <div class="progress-container">
      <progress value="0" max="100"></progress>
    </div>
    <div id="viewer" class="fit-width">
      <comic-reader-page></comic-reader-page>
      <comic-reader-page></comic-reader-page>
      <comic-reader-page></comic-reader-page>
      <comic-reader-page></comic-reader-page>
      <comic-reader-page></comic-reader-page>
    </div>
  </div>
`;

function clone() {
  return document.importNode(template.content, true);
}

function contractSVG() {
  let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 512 512');
  svg.innerHTML = `<title>Exit fullscreen</title><path d="M64 371.2h76.795V448H192V320H64v51.2zm76.795-230.4H64V192h128V64h-51.205v76.8zM320 448h51.2v-76.8H448V320H320v128zm51.2-307.2V64H320v128h128v-51.2h-76.8z"/>`;
  return svg;
}

function clear(el) {
  while(el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

function init(shadow) {
  /* DOM variables */
  let frag = clone();
  let rootNode = frag.querySelector('#root');
  let viewerNode = frag.querySelector('#viewer');
  let controlsNode = frag.querySelector('.controls');
  let progressNode = frag.querySelector('progress');
  let progressContainerNode = frag.querySelector('.progress-container');
  let fitHeightBtn = frag.querySelector('#fit-height');
  let fitWidthBtn = frag.querySelector('#fit-width');
  let fullscreenBtn = frag.querySelector('#fullscreen');
  let expandNode = fullscreenBtn.firstElementChild;
  let contractNode = contractSVG();
  let readerPageNodes = frag.querySelectorAll('comic-reader-page');
  let currentReaderPageNode = readerPageNodes[0];

  /* State variables */
  let src, source;
  let viewerX = 0, current = 0, currentPage = 0, numberOfItemsLoaded = 0;

  /* DOM update functions */
  function setProgressNode(value) {
    progressNode.value = value;
  }

  function setProgressContainerNode(loading) {
    progressContainerNode.classList[loading ? 'add' : 'remove']('open');
  }

  function setViewerDisplay(cn) {
    viewerNode.className = cn;
  }

  function setFullscreenButton(isFullscreen) {
    let newChild = isFullscreen ? contractNode : expandNode;
    clear(fullscreenBtn);
    fullscreenBtn.appendChild(newChild);
  }

  function toggleControlsOpen() {
    controlsNode.classList.toggle('open');
  }

  function setControlsOpen(open) {
    controlsNode.classList[open ? 'add' : 'remove']('open');
  }

  function translateViewerNode() {
    viewerNode.style.setProperty('--x', `${viewerX}%`);
  }

  function setViewerUpdating(isUpdating) {
    viewerNode.classList[isUpdating ? 'add' : 'remove']('updating');
  }

  function rotateReaderPageNode(first) {
    if(first) {
      let node = viewerNode.firstElementChild;
      viewerNode.appendChild(node);
      return node;
    } else {
      let node = viewerNode.lastElementChild;
      viewerNode.insertBefore(node, viewerNode.firstElementChild);
      return node;
    }
  }

  function setReaderPageCurrent(readerPage, isCurrent) {
    readerPage.classList[isCurrent ? 'add' : 'remove']('current');
  }

  /* State update functions */
  function setSrc(value) {
    if(src !== value) {
      src = value;
      loadSrc();
    }
  }

  function setViewerX(value) {
    if(viewerX !== value) {
      viewerX = value;
      translateViewerNode();
    }
  }

  function setCurrent(value) {
    if(value !== current) {
      if(value < 5) {
        current = value;
      } else {
        current = 0;
      }
    }
  }

  function setCurrentPage(value) {
    if(value !== currentPage) {
      if(value >= 0) {
        let oldValue = currentPage;
        currentPage = value;
        // If we're going up
        if(oldValue < value) {
          incrementViewerX(-20);
        } else {
          incrementViewerX(20);
        }
      }
    }
  }

  function incrementViewerX(by) {
    let newValue = viewerX + by;
    if(newValue <= 0) {
      setViewerX(newValue);
    }
  }

  /* Logic functions */
  async function preloadIdle() {
    requestIdleCallback(preload);
  }

  async function preload() {
    if(source.getLength() > numberOfItemsLoaded) {
      await source.item(numberOfItemsLoaded);
      numberOfItemsLoaded++;
      requestIdleCallback(preload);
    }
  }

  async function loadInto(i, readerPage) {
    let url = await source.item(i);
    readerPage.dataset.page = i;
    readerPage.url = url;
  }

  async function loadPage(i) {
    setProgressContainerNode(true);
    let url = await source.item(i, setProgressNode);
    setProgressContainerNode(false);

    currentReaderPageNode.dataset.page = i;
    currentReaderPageNode.url = url;
  }

  async function loadSrc() {
    let blob = src;
    if(typeof src === 'string') {
      let url = new URL(src, location.href).toString();
      let res = await fetch(url);
      blob = await res.blob();
    } else if(typeof src === 'object' && !(src instanceof Blob)) {
      source = src;
    } else {
      const { default: ZipSource } = await import('./lib/zipsource.js');
      source = new ZipSource(blob);
    }
    
    await loadPage(0);
    preloadIdle();

    for(let i = 1; i < 5; i++) {
      if(source.getLength() > i) {
        let nextUrl = await source.item(i);
        let readerPage = readerPageNodes[i];
        readerPage.dataset.page = i;
        readerPage.url = nextUrl;
      }
    }
  }

  function closeBook() {
    if(source && source.close) {
      source.close();
    }
  }

  function scheduleControlsOff() {
    setTimeout(setControlsOpen, 2000, false);
  }

  function navigateToNext() {
    setCurrentPage(currentPage + 1);
    setCurrent(current + 1);
  }

  function navigateToPrevious() {
    setCurrentPage(currentPage - 1);
    setCurrent(current - 1);
  }

  function rotatePage() {
    for(let i = 0; i < readerPageNodes.length; i++) {
      setReaderPageCurrent(readerPageNodes[i], i === current);
    }
    
    let i = 0;
    let currentIndex = 0;
    for(let readerPage of viewerNode.children) {
      if(readerPage.classList.contains('current')) {
        currentIndex = i;
        break;
      }
      i++;
    }

    // Move last reader-page to before
    if(currentIndex === 1 && currentPage > 1) {
      setViewerUpdating(true);
      let readerPage = rotateReaderPageNode(false);
      incrementViewerX(-20);
      setTimeout(setViewerUpdating, 0, false);
      loadInto(currentPage - 2, readerPage);
    }
    // Move first reader-page to last
    else if(currentIndex === 3 && currentPage + 2 < source.getLength()) {
      setViewerUpdating(true);
      let readerPage = rotateReaderPageNode(true);
      incrementViewerX(20);
      setTimeout(setViewerUpdating, 0, false);
      loadInto(currentPage + 2, readerPage);
    }
  }

  /* Event listeners */
  function onNavPrevious() {
    navigateToPrevious();
  }

  function onNavNext() {
    navigateToNext();
  }

  function onFitHeightClick() {
    setViewerDisplay('fit-height');
  }

  function onFitWidthClick() {
    setViewerDisplay('fit-width');
  }

  function onKeyUp(ev) {
    switch(ev.keyCode) {
      // Left
      case 37:
        navigateToPrevious();
        break;
      // Right
      case 39:
        navigateToNext();
        break;
    }
  }

  function onFullscreenClick() {
    if(document.fullscreenEnabled) {
      let isFullscreen = false;
      function onComplete() {
        setFullscreenButton(isFullscreen);
        scheduleControlsOff();
      }

      if(shadow.fullscreenElement === rootNode) {
        document.exitFullscreen().then(onComplete);
      } else {
        isFullscreen = true;
        rootNode.requestFullscreen().then(onComplete);
      }
    }
  }

  function onViewerTransition() {
    rotatePage();
  }

  /* Initialization */
  function connect() {
    for(let readerPage of readerPageNodes) {
      readerPage.addEventListener('nav-previous', onNavPrevious);
      readerPage.addEventListener('nav-next', onNavNext);
      readerPage.addEventListener('controls', toggleControlsOpen);
    }
    
    fitHeightBtn.addEventListener('click', onFitHeightClick);
    fitWidthBtn.addEventListener('click', onFitWidthClick);
    fullscreenBtn.addEventListener('click', onFullscreenClick);
    rootNode.addEventListener('keyup', onKeyUp);
    viewerNode.addEventListener('transitionend', onViewerTransition);
  }

  function disconnect() {
    for(let readerPage of readerPageNodes) {
      readerPage.removeEventListener('nav-previous', onNavPrevious);
      readerPage.removeEventListener('nav-next', onNavNext);
      readerPage.removeEventListener('controls', toggleControlsOpen);
    }

    fitHeightBtn.removeEventListener('click', onFitHeightClick);
    fitWidthBtn.removeEventListener('click', onFitWidthClick);
    fullscreenBtn.removeEventListener('click', onFullscreenClick);
    rootNode.removeEventListener('keyup', onKeyUp);
    closeBook();
  }

  function update(data = {}) {
    if(data.src) setSrc(data.src);
    return frag;
  }

  update.connect = connect;
  update.disconnect = disconnect;

  return update;
}

const VIEW = Symbol('comic-reader.view');

class ComicReader extends HTMLElement {
  static get observedAttributes() {
    return ['src'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._src = null;
  }

  connectedCallback() {
    if(!this[VIEW]) {
      let update = this[VIEW] = init(this.shadowRoot);
      let frag = update({ src: this._src });
      this.shadowRoot.appendChild(frag);
    }
    this[VIEW].connect();
  }

  disconnectedCallback() {
    this[VIEW].disconnect();
  }

  attributeChangedCallback(name, _, newVal) {
    this[name] = newVal;
  }

  get src() {
    return this._src;
  }

  set src(src) {
    this._src = src;
    if(this[VIEW])
      this[VIEW]({ src });
  }
}

customElements.define('comic-reader', ComicReader);

export default ComicReader;