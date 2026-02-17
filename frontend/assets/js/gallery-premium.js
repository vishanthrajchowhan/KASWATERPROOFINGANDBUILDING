// ========================================
// PREMIUM GALLERY INTERACTIONS
// Filter, Scroll Animations & Effects
// ========================================

document.addEventListener('DOMContentLoaded', function() {
  
  // ========================================
  // 1️⃣ PROJECT FILTER SYSTEM
  // ========================================
  
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card-premium');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const filterValue = this.getAttribute('data-filter');
      
      // Update active state
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Filter projects with smooth animation
      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        
        if (filterValue === 'all' || category === filterValue) {
          card.classList.remove('hidden');
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.9)';
          setTimeout(() => {
            card.classList.add('hidden');
          }, 400);
        }
      });
    });
  });
  
  // ========================================
  // 2️⃣ SCROLL-TRIGGERED ANIMATIONS
  // ========================================
  
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const fadeElements = document.querySelectorAll(
    '.project-card-premium, .trust-card, .featured-project-section, .trust-section'
  );
  
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-on-scroll', 'visible');
      }
    });
  }, observerOptions);
  
  fadeElements.forEach(element => {
    element.classList.add('fade-in-on-scroll');
    observer.observe(element);
  });
  
  // ========================================
  // 3️⃣ SMOOTH PARALLAX EFFECT ON HERO
  // ========================================
  
  const heroSection = document.querySelector('.hero-portfolio');
  
  if (heroSection) {
    window.addEventListener('scroll', function() {
      const scrolled = window.pageYOffset;
      const parallaxSpeed = 0.5;
      
      if (scrolled < window.innerHeight) {
        heroSection.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
        heroSection.style.opacity = 1 - (scrolled / window.innerHeight) * 0.5;
      }
    });
  }
  
  // ========================================
  // 4️⃣ STICKY FILTER BAR ENHANCEMENT
  // ========================================
  
  const filterSection = document.querySelector('.filter-section');
  let lastScroll = 0;
  
  if (filterSection) {
    window.addEventListener('scroll', function() {
      const currentScroll = window.pageYOffset;
      
      if (currentScroll > 500) {
        filterSection.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
      } else {
        filterSection.style.boxShadow = 'none';
      }
      
      lastScroll = currentScroll;
    });
  }
  
  // ========================================
  // 5️⃣ PROJECT CARD TILT EFFECT (SUBTLE)
  // ========================================
  
  projectCards.forEach(card => {
    card.addEventListener('mousemove', function(e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });
    
    card.addEventListener('mouseleave', function() {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
  });
  
  // ========================================
  // 6️⃣ SMOOTH SCROLL FOR ANCHOR LINKS
  // ========================================
  
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      
      if (target) {
        const offsetTop = target.offsetTop - 100;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // ========================================
  // 7️⃣ STATS COUNTER ANIMATION
  // ========================================
  
  const statNumbers = document.querySelectorAll('.stat-number');
  let statsAnimated = false;
  
  function animateStats() {
    statNumbers.forEach(stat => {
      const target = stat.textContent;
      const isPercentage = target.includes('%');
      const number = parseInt(target);
      const duration = 2000;
      const increment = number / (duration / 16);
      let current = 0;
      
      const updateCounter = () => {
        current += increment;
        if (current < number) {
          stat.textContent = Math.floor(current) + (isPercentage ? '%' : '+');
          requestAnimationFrame(updateCounter);
        } else {
          stat.textContent = target;
        }
      };
      
      updateCounter();
    });
  }
  
  const statsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting && !statsAnimated) {
        animateStats();
        statsAnimated = true;
      }
    });
  }, { threshold: 0.5 });
  
  const statsSection = document.querySelector('.hero-stats-float');
  if (statsSection) {
    statsObserver.observe(statsSection);
  }
  
  // ========================================
  // 8️⃣ LOADING PERFORMANCE OPTIMIZATION
  // ========================================
  
  // Lazy load images when they come into viewport
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
  
  // ========================================
  // 9️⃣ HERO CTA HOVER GLOW EFFECT
  // ========================================
  
  const goldButtons = document.querySelectorAll('.btn-primary-gold, .btn-cta-large');
  
  goldButtons.forEach(button => {
    button.addEventListener('mouseenter', function(e) {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const glow = document.createElement('span');
      glow.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        animation: glowPulse 0.6s ease-out;
      `;
      
      button.style.position = 'relative';
      button.appendChild(glow);
      
      setTimeout(() => glow.remove(), 600);
    });
  });
  
  // Add glow animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes glowPulse {
      0% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(0);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(2);
      }
    }
  `;
  document.head.appendChild(style);
  
  // ========================================
  // 🔟 CONSOLE LOG FOR DEBUGGING
  // ========================================
  
  console.log('✅ Premium Gallery JavaScript Loaded');
  console.log(`Found ${projectCards.length} project cards`);
  console.log(`Found ${filterButtons.length} filter buttons`);
});
