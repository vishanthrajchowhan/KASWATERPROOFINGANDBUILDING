// ============================
// SHARED SITE BEHAVIOR
// Header/footer includes, mobile nav, scroll reveal, counters
// ============================
(function () {
  "use strict";

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function setActiveNavLinks() {
    const path = window.location.pathname.replace(/\/index\.html$/, "/");
    document.querySelectorAll(".nav-links a").forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (href === path || (href !== "/" && path.startsWith(href))) {
        a.classList.add("active");
      }
    });
  }

  function wireMobileNav() {
    const navbar = document.querySelector(".navbar");
    const toggle = document.getElementById("navToggle");
    const overlay = document.getElementById("navOverlay");
    if (!navbar || !toggle) return;

    function closeNav() {
      navbar.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", () => {
      const isOpen = navbar.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    if (overlay) overlay.addEventListener("click", closeNav);

    document.querySelectorAll(".nav-links a").forEach((a) => {
      a.addEventListener("click", closeNav);
    });

    window.addEventListener("scroll", () => {
      navbar.classList.toggle("scrolled", window.scrollY > 60);
    });
  }

  function injectHeader() {
    const target = document.getElementById("header");
    if (!target) return Promise.resolve();
    return fetch("/header.html")
      .then((res) => res.text())
      .then((html) => {
        target.innerHTML = html;
        setActiveNavLinks();
        wireMobileNav();
      })
      .catch(() => {});
  }

  function injectFooter() {
    const target = document.getElementById("footer");
    if (!target) return Promise.resolve();
    return fetch("/footer.html")
      .then((res) => res.text())
      .then((html) => {
        target.innerHTML = html;
      })
      .catch(() => {});
  }

  function wireScrollToContact() {
    function scrollToContact() {
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth" });
        return true;
      }
      return false;
    }

    document.querySelectorAll(".service-btn, .btn-quote").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (window.location.pathname === "/" || window.location.pathname === "/index.html") {
          if (scrollToContact()) e.preventDefault();
        }
      });
    });
  }

  function wireScrollReveal() {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = document.querySelectorAll(".reveal, .reveal-scale, .stagger-children");

    if (prefersReduced) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    items.forEach((item) => observer.observe(item));
  }

  function wireCounters() {
    const counters = document.querySelectorAll("[data-counter]");
    if (!counters.length) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function animateCounter(el) {
      const raw = el.getAttribute("data-counter") || el.textContent || "0";
      const suffix = raw.replace(/[\d,]/g, "");
      const target = parseInt(raw.replace(/[^\d]/g, ""), 10) || 0;

      if (prefersReduced) {
        el.textContent = target.toLocaleString() + suffix;
        return;
      }

      const duration = 1600;
      const start = performance.now();

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target.toLocaleString() + suffix;
      }

      requestAnimationFrame(tick);
    }

    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCounter);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach((el) => observer.observe(el));
  }

  onReady(() => {
    Promise.all([injectHeader(), injectFooter()]).finally(() => {
      wireScrollToContact();
      wireScrollReveal();
      wireCounters();
    });
  });
})();
