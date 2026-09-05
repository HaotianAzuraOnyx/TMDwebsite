(() => {
  const root = document.documentElement;
  const header = document.getElementById("header");
  const menuToggle = document.getElementById("menu-toggle");
  const navOverlay = document.getElementById("nav-overlay");
  const navLinks = document.getElementById("nav-links");
  const mapFrame = document.querySelector(".map-frame iframe");
  const progress = document.getElementById("scroll-progress");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  let lenis = null;

  const setMenu = (open) => {
    document.body.classList.toggle("nav-open", open);
    if (menuToggle) menuToggle.setAttribute("aria-expanded", String(open));
    if (navOverlay) navOverlay.hidden = !open;
    if (lenis) {
      if (open) lenis.stop();
      else lenis.start();
    }
  };

  const setLang = (lang) => {
    root.lang = lang;
    localStorage.setItem("tmd-lang", lang);
    document.querySelectorAll(".lang-toggle button").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.lang === lang));
    });
    if (mapFrame) {
      mapFrame.src = mapFrame.src.replace(/hl=(en|zh-CN)/, "hl=" + (lang === "zh" ? "zh-CN" : "en"));
    }
  };

  const saved = localStorage.getItem("tmd-lang");
  if (saved === "zh" || saved === "en") setLang(saved);

  document.querySelectorAll(".lang-toggle button").forEach((button) => {
    button.addEventListener("click", () => setLang(button.dataset.lang));
  });

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      setMenu(!document.body.classList.contains("nav-open"));
    });
  }

  if (navOverlay) navOverlay.addEventListener("click", () => setMenu(false));
  if (navLinks) {
    navLinks.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) setMenu(false);
  });

  const updateHeader = () => {
    const y = lenis ? lenis.scroll : window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    }
  };

  const revealItems = [...document.querySelectorAll("[data-reveal]")];
  const reveal = () => {
    const view = window.innerHeight;
    revealItems.forEach((el) => {
      if (el.classList.contains("is-in")) return;
      const top = el.getBoundingClientRect().top;
      if (top < view * 0.88) el.classList.add("is-in");
    });
  };

  const parallaxItems = [...document.querySelectorAll("[data-parallax]")];
  const parallax = () => {
    if (reduceMotion) return;
    parallaxItems.forEach((el) => {
      const speed = Number(el.dataset.parallax) || 0.2;
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      el.style.transform = `translate3d(0, ${center * speed * -0.15}px, 0)`;
    });
  };

  const heroMedia = document.querySelector(".hero-media img");
  const heroTitle = document.querySelector(".hero-content");
  const hero = document.querySelector(".hero");
  const heroScroll = () => {
    if (!hero || reduceMotion) return;
    const y = lenis ? lenis.scroll : window.scrollY;
    const p = Math.min(y / Math.max(hero.offsetHeight, 1), 1);
    if (heroMedia) heroMedia.style.transform = `scale(${1 + p * 0.18}) translate3d(0, ${p * 8}%, 0)`;
    if (heroTitle) {
      heroTitle.style.opacity = String(1 - p * 1.15);
      heroTitle.style.transform = `translate3d(0, ${p * -40}px, 0)`;
    }
  };

  const hsWrap = document.querySelector("[data-horizontal]");
  const hsTrack = hsWrap ? hsWrap.querySelector(".hs-track") : null;
  const setupHorizontal = () => {
    if (!hsWrap || !hsTrack) return;
    if (window.innerWidth <= 900 || reduceMotion) {
      hsWrap.style.height = "";
      hsTrack.style.transform = "";
      hsWrap.classList.remove("is-pinned");
      return;
    }
    const extra = Math.max(hsTrack.scrollWidth - window.innerWidth, 0);
    const pin = window.innerHeight;
    hsWrap.style.height = `${pin + extra}px`;
  };

  const horizontal = () => {
    if (!hsWrap || !hsTrack || window.innerWidth <= 900 || reduceMotion) return;
    const rect = hsWrap.getBoundingClientRect();
    const extra = Math.max(hsTrack.scrollWidth - window.innerWidth, 0);
    const total = hsWrap.offsetHeight - window.innerHeight;
    const progressX = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;
    hsTrack.style.transform = `translate3d(${-progressX * extra}px, 0, 0)`;
  };

  const tick = () => {
    updateHeader();
    reveal();
    parallax();
    heroScroll();
    horizontal();
  };

  const startLenis = () => {
    if (reduceMotion || typeof Lenis !== "function") {
      window.addEventListener("scroll", tick, { passive: true });
      tick();
      return;
    }
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on("scroll", tick);
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
    tick();
  };

  window.addEventListener("resize", () => {
    setupHorizontal();
    tick();
  });

  document.querySelectorAll('a[href$=".html"], a[href^="index.html"], a[href="./"]').forEach((link) => {
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname) return;
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      document.body.classList.add("is-leaving");
      window.setTimeout(() => {
        window.location.href = link.href;
      }, reduceMotion ? 0 : 520);
    });
  });

  if (isFine && !reduceMotion) {
    const glow = document.getElementById("cursor-glow");
    if (glow) {
      window.addEventListener("pointermove", (event) => {
        glow.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      }, { passive: true });
    }
  }

  setupHorizontal();
  startLenis();
  requestAnimationFrame(() => document.body.classList.add("is-ready"));
})();
