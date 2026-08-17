'use strict';


// --------------------------------------------------
// Shared helpers
// --------------------------------------------------

// element toggle function
const elementToggleFunc = function (elem) {
  elem.classList.toggle("active");
};


// --------------------------------------------------
// Sidebar
// --------------------------------------------------
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
if (sidebar && sidebarBtn) {
  sidebarBtn.addEventListener("click", function () {
    elementToggleFunc(sidebar);
  });
}


// --------------------------------------------------
// Dynamic page navigation
// --------------------------------------------------

const pageContent = document.querySelector("#page-content");
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const validPages = new Set(["about", "resume", "portfolio", "blog"]);

// Cache page HTML after the first fetch so returning to a tab does not
// require another network request during the same visit.
const pageCache = new Map();

// Used to prevent a slower, older fetch from overwriting a newer click.
let pageLoadId = 0;


function getPageFromHash() {
  const page = window.location.hash.replace(/^#/, "").toLowerCase();
  return validPages.has(page) ? page : "about";
}


function setActiveNav(page) {
  for (let i = 0; i < navigationLinks.length; i++) {
    navigationLinks[i].classList.toggle(
      "active",
      navigationLinks[i].dataset.page === page
    );
  }
}


// --------------------------------------------------
// Portfolio filtering
// --------------------------------------------------

// The Portfolio controls do not exist until portfolio.html is fetched and
// inserted into #page-content, so this function must run AFTER that happens.
function initPortfolioFilters() {
  const select = pageContent.querySelector("[data-select]");
  const selectItems = pageContent.querySelectorAll("[data-select-item]");
  const selectValue = pageContent.querySelector("[data-selecct-value]");
  const filterBtn = pageContent.querySelectorAll("[data-filter-btn]");
  const filterItems = pageContent.querySelectorAll("[data-filter-item]");

  if (!filterItems.length) return;

  const filterFunc = function (selectedValue) {
    for (let i = 0; i < filterItems.length; i++) {
      if (selectedValue === "all") {
        filterItems[i].classList.add("active");
      } else if (selectedValue === filterItems[i].dataset.category) {
        filterItems[i].classList.add("active");
      } else {
        filterItems[i].classList.remove("active");
      }
    }
  };

  // custom select toggle
  if (select) {
    select.addEventListener("click", function () {
      elementToggleFunc(this);
    });
  }

  // add event to all select items
  for (let i = 0; i < selectItems.length; i++) {
    selectItems[i].addEventListener("click", function () {
      const selectedValue = this.innerText.toLowerCase();

      if (selectValue) {
        selectValue.innerText = this.innerText;
      }

      if (select) {
        elementToggleFunc(select);
      }

      filterFunc(selectedValue);

      // Keep the large-screen filter buttons synchronized with the
      // small-screen custom select.
      for (let j = 0; j < filterBtn.length; j++) {
        filterBtn[j].classList.toggle(
          "active",
          filterBtn[j].innerText.toLowerCase() === selectedValue
        );
      }
    });
  }

  // Preserve the original large-screen filter behavior.
  let lastClickedBtn = filterBtn.length ? filterBtn[0] : null;

  for (let i = 0; i < filterBtn.length; i++) {
    filterBtn[i].addEventListener("click", function () {
      const selectedValue = this.innerText.toLowerCase();

      if (selectValue) {
        selectValue.innerText = this.innerText;
      }

      filterFunc(selectedValue);

      if (lastClickedBtn) {
        lastClickedBtn.classList.remove("active");
      }

      this.classList.add("active");
      lastClickedBtn = this;
    });
  }
}


// --------------------------------------------------
// Load a page partial
// --------------------------------------------------

async function loadPage(page) {
  if (!pageContent) {
    console.error('Could not find an element with id="page-content".');
    return;
  }

  const safePage = validPages.has(page) ? page : "about";
  const thisLoadId = ++pageLoadId;

  setActiveNav(safePage);

  try {
    let html;

    if (pageCache.has(safePage)) {
      html = pageCache.get(safePage);
    } else {
      // const response = await fetch(`./pages/${safePage}.html`); // deployment only

      const response = await fetch(`./pages/${safePage}.html`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(
          `Failed to load ./pages/${safePage}.html ` +
          `(${response.status} ${response.statusText})`
        );
      }

      html = await response.text();
      pageCache.set(safePage, html);
    }

    // If the user clicked another tab while this page was loading,
    // ignore this now-stale result.
    if (thisLoadId !== pageLoadId) return;

    pageContent.innerHTML = html;

    // The original stylesheet shows pages through article.active.
    // Because only one page partial is present at a time now,
    // activate the article that was just inserted.
    const loadedPage = pageContent.querySelector("[data-page]");

    if (loadedPage) {
      loadedPage.classList.add("active");
    }

    // Re-bind behavior for elements that were dynamically inserted.
    if (safePage === "portfolio") {
      initPortfolioFilters();
    }

    // Preserve the original behavior of returning to the top after
    // a tab change, without performing a full-page reload.
    window.scrollTo(0, 0);

  } catch (error) {
    console.error(error);

    if (thisLoadId !== pageLoadId) return;

    pageContent.innerHTML = `
      <article class="active">
        <header>
          <h2 class="h2 article-title">Page unavailable</h2>
        </header>

        <section class="about-text">
          <p>Sorry, this section could not be loaded.</p>
        </section>
      </article>
    `;
  }
}


// --------------------------------------------------
// Navbar events + browser history
// --------------------------------------------------

for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    const page = this.dataset.page;

    if (!validPages.has(page)) return;

    // If this tab is already selected, no hashchange event will fire.
    // Just reproduce the old scroll-to-top behavior.
    if (window.location.hash === `#${page}`) {
      setActiveNav(page);
      window.scrollTo(0, 0);
      return;
    }

    // Changing only the hash does NOT reload index.html.
    // It also creates URLs such as #resume and gives native
    // Back/Forward browser support.
    window.location.hash = page;
  });
}


window.addEventListener("hashchange", function () {
  loadPage(getPageFromHash());
});


// Initial page load.
// If there is no hash, About is shown.
loadPage(getPageFromHash());


// --------------------------------------------------
// Existing custom Portfolio link behavior
// --------------------------------------------------

function openTPLLinks(event) {
  event.preventDefault();

  window.open(
    "https://drive.mathworks.com/sharing/4de7cc67-57d8-442c-ac6d-07fd4c9f1639/live_script_dimen.mlx",
    "_blank"
  );

  window.open(
    "assets/papers/beng227_tpl_report.pdf",
    "_blank"
  );
}