// Subtle parallax on the services hero image.
// Scroll-reveal (.reveal/.stagger-children) is handled by site.js.
document.addEventListener('DOMContentLoaded', () => {
  const heroImage = document.querySelector('.hero-image');
  if (!heroImage) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const parallax = () => {
    const rect = heroImage.getBoundingClientRect();
    const windowHeight = window.innerHeight || 0;

    if (rect.top < windowHeight && rect.bottom > 0) {
      const progress = (windowHeight - rect.top) / (windowHeight + rect.height);
      const offset = Math.min(Math.max(progress * 18, 0), 18);
      heroImage.style.transform = `translateY(${offset}px)`;
    }
  };

  window.addEventListener('scroll', parallax, { passive: true });
  parallax();
});
