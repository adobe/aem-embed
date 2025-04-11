/*
 * AEM Embed WebComponent
 * Include content from one Helix page in any other web surface.
 * https://www.hlx.live/developer/block-collection/TBD
 */

// eslint-disable-next-line import/prefer-default-export
export class AEMEmbed extends HTMLElement {
  constructor() {
    super();

    // Attaches a shadow DOM tree to the element
    // With mode open the shadow root elements are accessible from JavaScript outside the root
    this.attachShadow({ mode: 'open' });

    // Keep track if we have rendered the fragment yet.
    this.initialized = false;
  }

  async loadBlock(body, block, blockName, origin) {
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', `${origin}/blocks/${blockName}/${blockName}.css`);

    const cssLoaded = new Promise((resolve) => {
      link.onload = resolve;
      link.onerror = resolve;
    });

    body.appendChild(link);
    // eslint-disable-next-line no-await-in-loop
    await cssLoaded;

    try {
      const blockScriptUrl = `${origin}/blocks/${blockName}/${blockName}.js`;
      // eslint-disable-next-line no-await-in-loop
      const decorateBlock = await import(blockScriptUrl);
      if (decorateBlock.default) {
        // eslint-disable-next-line no-await-in-loop
        await decorateBlock.default(block);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('An error occured while loading the content');
    }
  }

  async handleHeader(htmlText, body, origin) {
    console.log('header');
    const header = document.createElement('header');
    body.append(header);

    // Load scripts file for embed host site
    window.hlx = window.hlx || {};
    window.hlx.suppressLoadPage = true;

    const { buildBlock, decorateBlock } = await import(`${origin}/scripts/aem.js`);
    const headerBlock = buildBlock('header', '');
    header.append(headerBlock);
    decorateBlock(headerBlock);
    await this.loadBlock(body, headerBlock, 'header', origin);
    headerBlock.dataset.blockStatus = 'loaded';
    body.classList.add('appear');
    body.style.height = 'var(--nav-height)';
  }

  async handleFooter(htmlText, body, origin) {
    console.log('footer');
    const footer = document.createElement('footer');
    body.append(footer);

    // Load scripts file for embed host site
    window.hlx = window.hlx || {};
    window.hlx.suppressLoadPage = true;

    const { buildBlock, decorateBlock } = await import(`${origin}/scripts/aem.js`);
    const footerBlock = buildBlock('footer', '');
    footer.append(footerBlock);
    decorateBlock(footerBlock);
    await this.loadBlock(body, footerBlock, 'footer', origin);
    footerBlock.dataset.blockStatus = 'loaded';
    body.classList.add('appear');
  }


  async handleMain(htmlText, body, origin) {
    const main = document.createElement('main');
    body.append(main);
    main.innerHTML = htmlText;

    // Set initialized to true so we don't run through this again
    this.initialized = true;

    // Query all the blocks in the aem content
    // The blocks are in the first div inside the main tag
    const blockElements = main.querySelectorAll(':scope > div > div');

    // Did we find any blocks or all default content?
    if (blockElements.length > 0) {
      // Get the block names
      const blocks = Array.from(blockElements).map((block) => block.classList.item(0));

      // Load scripts file for embed host site
      window.hlx = window.hlx || {};
      window.hlx.suppressLoadPage = true;

      const { decorateMain } = await import(`${origin}/scripts/scripts.js`);
      if (decorateMain) {
        await decorateMain(main, true);
      }

      // For each block in the embed load it's js/css
      for (let i = 0; i < blockElements.length; i += 1) {
        const blockName = blocks[i];
        const block = blockElements[i];
        this.loadBlock(body, block, blockName, origin);
      }
    }
  
    const sections = main.querySelectorAll('.section');
    sections.forEach((s) => {
      s.dataset.sectionStatus = 'loaded';
      s.style = '';
    });
    
    body.classList.add('appear');
  }

  /**
   * Invoked each time the custom element is appended into a document-connected element.
   * This will happen each time the node is moved, and may happen before the element's contents
   * have been fully parsed.
   */
  async connectedCallback() {
    if (!this.initialized) {
      try {
        const urlAttribute = this.attributes.getNamedItem('url');
        if (!urlAttribute) {
          throw new Error('aem-embed missing url attribute');
        }

        const type = this.getAttribute('type') || 'main';
        console.log('type', type);

        const body = document.createElement('body');
        body.style = 'display: none';
        this.shadowRoot.append(body);

        const url = urlAttribute.value;
        const plainUrl = url.endsWith('/') ? `${url}index.plain.html` : `${url}.plain.html`;
        const { href, origin } = new URL(plainUrl);

        // Load fragment
        const resp = await fetch(href);
        if (!resp.ok) {
          throw new Error(`Unable to fetch ${href}`);
        }

        const styles = document.createElement('link');
        styles.setAttribute('rel', 'stylesheet');
        styles.setAttribute('href', `${origin}/styles/styles.css`);
        styles.onload = () => { body.style = ''; };
        styles.onerror = () => { body.style = ''; };
        this.shadowRoot.appendChild(styles);

        let htmlText = await resp.text();
        // Fix relative image urls
        const regex = /.\/media/g;
        htmlText = htmlText.replace(regex, `${origin}/media`);
        if (type === 'main') await this.handleMain(htmlText, body, origin);
        if (type === 'header') await this.handleHeader(htmlText, body, origin);
        if (type === 'footer') await this.handleFooter(htmlText, body, origin);

      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err || 'An error occured while loading the content');
      }
    }
  }

  /**
   * Imports a script and appends to document body
   * @param {*} url
   * @returns
   */

  // eslint-disable-next-line class-methods-use-this
  async importScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.type = 'module';
      script.onload = resolve;
      script.onerror = reject;

      document.body.appendChild(script);
    });
  }
}

customElements.define('aem-embed', AEMEmbed);
