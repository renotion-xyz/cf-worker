import { toUtf8Bytes } from "@ethersproject/strings";
import { keccak256 } from "@ethersproject/keccak256";
import { defaultAbiCoder } from "@ethersproject/abi";

const RPC_URL = "https://polygon-rpc.com/";
const CONTRACT_ADDRESS = "0xD189E333277a8dbd65244A97bE3ecBE4f7Bee5cf";

const DEFAULT_KV_EXPIRATION = 10 * 60;

function generateSitemap(domain, slugs) {
  let sitemap = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  slugs.forEach(
    (slug) =>
      (sitemap +=
        "<url><loc>https://" + domain + "/" + slug + "</loc></url>")
  );
  sitemap += "</urlset>";
  return sitemap;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function handleOptions(request) {
  if (request.headers.get("Origin") !== null &&
    request.headers.get("Access-Control-Request-Method") !== null &&
    request.headers.get("Access-Control-Request-Headers") !== null) {
    // Handle CORS pre-flight request.
    return new Response(null, {
      headers: corsHeaders
    });
  } else {
    // Handle standard OPTIONS request.
    return new Response(null, {
      headers: {
        "Allow": "GET, HEAD, POST, PUT, OPTIONS",
      }
    });
  }
}

class MetaRewriter {
  constructor(domain, title, description) {
    this.domain = domain;
    this.title = title;
    this.description = description;
  }

  element(element) {
    if (this.title !== "") {
      if (element.getAttribute("property") === "og:title"
        || element.getAttribute("name") === "twitter:title") {
        element.setAttribute("content", this.title);
      }
      if (element.tagName === "title") {
        element.setInnerContent(this.title);
      }
    }
    if (this.description !== "") {
      if (element.getAttribute("name") === "description"
        || element.getAttribute("property") === "og:description"
        || element.getAttribute("name") === "twitter:description") {
        element.setAttribute("content", this.description);
      }
    }
    if (element.getAttribute("property") === "og:url"
      || element.getAttribute("name") === "twitter:url") {
      element.setAttribute("content", this.domain);
    }
    if (element.getAttribute("name") === "apple-itunes-app") {
      element.remove();
    }
  }
}

class HeadRewriter {
  element(element) {
    element.append(`<style>
    div.notion-topbar > div > div:nth-child(3) { display: none !important; }
    div.notion-topbar > div > div:nth-child(4) { display: none !important; }
    div.notion-topbar > div > div:nth-child(5) { display: none !important; }
    div.notion-topbar > div > div:nth-child(6) { display: none !important; }
    div.notion-topbar-mobile > div:nth-child(3) { display: none !important; }
    div.notion-topbar-mobile > div:nth-child(4) { display: none !important; }
    div.notion-topbar > div > div:nth-child(1n).toggle-mode { display: block !important; }
    div.notion-topbar-mobile > div:nth-child(1n).toggle-mode { display: block !important; }
    </style>`, {
      html: true
    })
  }
}

class BodyRewriter {
  constructor(domain, slugToPage) {
    this.domain = domain;
    this.slugToPage = slugToPage;
  }

  element(element) {
    element.append(`
    <div style="display: none;">Powered by renotion.xyz</div>
    <script>
    window.CONFIG.domainBaseUrl = 'https://${this.domain}';
    const SLUG_TO_PAGE = ${JSON.stringify(this.slugToPage)};
    const PAGE_TO_SLUG = {};
    const slugs = [];
    const pages = [];
    const el = document.createElement('div');
    let redirected = false;
    Object.keys(SLUG_TO_PAGE).forEach(slug => {
      const page = SLUG_TO_PAGE[slug];
      slugs.push(slug);
      pages.push(page);
      PAGE_TO_SLUG[page] = slug;
    });
    function getPage() {
      return location.pathname.slice(-32);
    }
    function getSlug() {
      return location.pathname.slice(1);
    }
    function updateSlug() {
      const slug = PAGE_TO_SLUG[getPage()];
      if (slug != null) {
        history.replaceState(history.state, '', '/' + slug);
      }
    }
    function onDark() {
      el.innerHTML = '<div title="Change to Light Mode" style="margin-left: auto; margin-right: 14px; min-width: 0px;"><div role="button" tabindex="0" style="user-select: none; transition: background 120ms ease-in 0s; cursor: pointer; border-radius: 44px;"><div style="display: flex; flex-shrink: 0; height: 14px; width: 26px; border-radius: 44px; padding: 2px; box-sizing: content-box; background: rgb(46, 170, 220); transition: background 200ms ease 0s, box-shadow 200ms ease 0s;"><div style="width: 14px; height: 14px; border-radius: 44px; background: white; transition: transform 200ms ease-out 0s, background 200ms ease-out 0s; transform: translateX(12px) translateY(0px);"></div></div></div></div>';
      document.body.classList.add('dark');
      __console.environment.ThemeStore.setState({ mode: 'dark' });
    };
    function onLight() {
      el.innerHTML = '<div title="Change to Dark Mode" style="margin-left: auto; margin-right: 14px; min-width: 0px;"><div role="button" tabindex="0" style="user-select: none; transition: background 120ms ease-in 0s; cursor: pointer; border-radius: 44px;"><div style="display: flex; flex-shrink: 0; height: 14px; width: 26px; border-radius: 44px; padding: 2px; box-sizing: content-box; background: rgba(135, 131, 120, 0.3); transition: background 200ms ease 0s, box-shadow 200ms ease 0s;"><div style="width: 14px; height: 14px; border-radius: 44px; background: white; transition: transform 200ms ease-out 0s, background 200ms ease-out 0s; transform: translateX(0px) translateY(0px);"></div></div></div></div>';
      document.body.classList.remove('dark');
      __console.environment.ThemeStore.setState({ mode: 'light' });
    }
    function toggle() {
      if (document.body.classList.contains('dark')) {
        onLight();
      } else {
        onDark();
      }
    }
    function addDarkModeButton(device) {
      const nav = device === 'web' ? document.querySelector('.notion-topbar').firstChild : document.querySelector('.notion-topbar-mobile');
      el.className = 'toggle-mode';
      el.addEventListener('click', toggle);
      nav.appendChild(el);
      onLight();
    }
    const observer = new MutationObserver(function() {
      if (redirected) return;
      const nav = document.querySelector('.notion-topbar');
      const mobileNav = document.querySelector('.notion-topbar-mobile');
      if (nav && nav.firstChild && nav.firstChild.firstChild
        || mobileNav && mobileNav.firstChild) {
        redirected = true;
        updateSlug();
        addDarkModeButton(nav ? 'web' : 'mobile');
        const onpopstate = window.onpopstate;
        window.onpopstate = function() {
          if (slugs.includes(getSlug())) {
            const page = SLUG_TO_PAGE[getSlug()];
            if (page) {
              history.replaceState(history.state, 'bypass', '/' + page);
            }
          }
          onpopstate.apply(this, [].slice.call(arguments));
          updateSlug();
        };
      }
    });
    observer.observe(document.querySelector('#notion-app'), {
      childList: true,
      subtree: true,
    });
    const replaceState = window.history.replaceState;
    window.history.replaceState = function(state) {
      if (arguments[1] !== 'bypass' && slugs.includes(getSlug())) return;
      return replaceState.apply(window.history, arguments);
    };
    const pushState = window.history.pushState;
    window.history.pushState = function(state) {
      const dest = new URL(location.protocol + location.host + arguments[2]);
      const id = dest.pathname.slice(-32);
      if (pages.includes(id)) {
        arguments[2] = '/' + PAGE_TO_SLUG[id];
      }
      return pushState.apply(window.history, arguments);
    };
    const open = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function() {
      arguments[1] = arguments[1].replace('${this.domain}', 'www.notion.so');
      return open.apply(this, [].slice.call(arguments));
    };
  </script>`, {
      html: true
    });
  }
}

async function appendJavascript(res, domain, slugToPage, title, description) {
  return new HTMLRewriter()
    .on("title", new MetaRewriter(domain, title, description))
    .on("meta", new MetaRewriter(domain, title, description))
    .on("head", new HeadRewriter())
    .on("body", new BodyRewriter(domain, slugToPage))
    .transform(res);
}

async function fetchMappedDomainPage(domain) {
  console.log(`fetchMappedDomainPage ${domain}`);

  const domainHash = keccak256(toUtf8Bytes(domain));

  const selector = "221defb1";
  const callData = defaultAbiCoder.encode(["bytes32"], [domainHash]).substring(2);

  return fetch(RPC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "eth_call",
      params: [
        {
          from: null,
          to: CONTRACT_ADDRESS,
          data: `0x${selector}${callData}`,
        },
        "latest"
      ],
    })
  }).then((res) => res.json())
    .then((data) => {
      const [[,page]] = defaultAbiCoder.decode(["(string, string)"], data.result);
      return page.length === 0 ? null : page;
    })
    .catch((err) => {
      console.error(err);
      return null;
    });
}

async function getMappedDomainPage(domain, env) {
  console.log("getMappedDomainPage");
  const cached = await env.RENOTION.get(`domain:${domain}`);
  if (cached) {
    return cached;
  }
  const remote = await fetchMappedDomainPage(domain);
  if (remote) {
    await env.RENOTION.put(`domain:${domain}`, remote, { expirationTtl: DEFAULT_KV_EXPIRATION });
    return remote;
  } else {
    return null;
  }
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return handleOptions(request);
    }
    let url = new URL(request.url);
    const domain = url.hostname;
    const page = await getMappedDomainPage(domain, env);
    if (!page) {
      return new Response("Your page is not registered. And this is under construction");
    }
    const slugToPage = {
      "": page
    };
    const pageTitle = "";
    const pageDescription = "";

    const pageToSlug = {};
    const slugs = [];
    const pages = [];
    Object.keys(slugToPage).forEach(slug => {
      const page = slugToPage[slug];
      slugs.push(slug);
      pages.push(page);
      pageToSlug[page] = slug;
    });

    url.hostname = "www.notion.so";
    if (url.pathname === "/robots.txt") {
      return new Response("Sitemap: https://" + domain + "/sitemap.xml");
    }
    if (url.pathname === "/sitemap.xml") {
      let response = new Response(generateSitemap(domain, slugs));
      response.headers.set("content-type", "application/xml");
      return response;
    }
    let response;
    if (url.pathname.startsWith("/app") && url.pathname.endsWith("js")) {
      response = await fetch(url.toString());
      let body = await response.text();
      response = new Response(body.replace(/www.notion.so/g, domain).replace(/notion.so/g, domain), response);
      response.headers.set("Content-Type", "application/x-javascript");
      return response;
    } else if ((url.pathname.startsWith("/api"))) {
      // Forward API
      response = await fetch(url.toString(), {
        body: url.pathname.startsWith("/api/v3/getPublicPageData") ? null : request.body,
        headers: {
          "content-type": "application/json;charset=UTF-8",
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36"
        },
        method: "POST",
      });
      response = new Response(response.body, response);
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    } else if (slugs.indexOf(url.pathname.slice(1)) > -1) {
      const pageId = slugToPage[url.pathname.slice(1)];
      return Response.redirect("https://" + domain + "/" + pageId, 301);
    } else {
      response = await fetch(url.toString(), {
        body: request.body,
        headers: request.headers,
        method: request.method,
      });
      response = new Response(response.body, response);
      response.headers.delete("Content-Security-Policy");
      response.headers.delete("X-Content-Security-Policy");
    }

    return appendJavascript(response, domain, slugToPage, pageTitle, pageDescription);
  }
}