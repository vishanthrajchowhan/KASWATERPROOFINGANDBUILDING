// ========================================
// PORTFOLIO GALLERY INTERACTIONS
// Filter system + button glow accent
// (scroll reveal and stat counters are handled by site.js)
// ========================================

document.addEventListener('DOMContentLoaded', function () {

  // ========================================
  // PROJECT FILTER SYSTEM
  // ========================================

  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.gallery-card');

  filterButtons.forEach(button => {
    button.addEventListener('click', function () {
      const filterValue = this.getAttribute('data-filter');

      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        card.classList.toggle('is-hidden', filterValue !== 'all' && category !== filterValue);
      });
    });
  });

  // ========================================
  // GOLD BUTTON HOVER GLOW
  // ========================================

  const goldButtons = document.querySelectorAll('.btn-primary-gold, .btn-cta-large');

  goldButtons.forEach(button => {
    button.style.position = 'relative';
    button.style.overflow = 'hidden';

    button.addEventListener('mouseenter', function (e) {
      const rect = button.getBoundingClientRect();
      const glow = document.createElement('span');
      glow.style.cssText = `
        position: absolute;
        left: ${e.clientX - rect.left}px;
        top: ${e.clientY - rect.top}px;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        animation: galleryGlowPulse 0.6s ease-out;
      `;
      button.appendChild(glow);
      setTimeout(() => glow.remove(), 600);
    });
  });

  if (goldButtons.length) {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes galleryGlowPulse {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(0); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
      }
    `;
    document.head.appendChild(style);
  }
});
