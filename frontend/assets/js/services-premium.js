document.addEventListener('DOMContentLoaded', () => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fadeItems = document.querySelectorAll('.fade-up');

  if (prefersReduced) {
    fadeItems.forEach(item => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  fadeItems.forEach(item => observer.observe(item));

  const heroImage = document.querySelector('.hero-image');
  if (!heroImage) return;

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
