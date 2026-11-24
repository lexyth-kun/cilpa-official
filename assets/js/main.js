(() => {
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));
  const body = document.body;
  const root = document.documentElement;
  const isHome = body.classList.contains('super-motion-home');
  const isMotion = body.classList.contains('site-motion') || isHome;
  const toTop = qs('.to-top');
  const toast = qs('#toast');

  let latestScrollY = window.scrollY;
  let ticking = false;

  function updateProgressAndParallax() {
    latestScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = latestScrollY / max;
    root.style.setProperty('--scroll', progress.toFixed(4));
    if (toTop) toTop.classList.toggle('show', latestScrollY > 480);

    if (isMotion && window.innerWidth > 900) {
      qsa('[data-parallax]').forEach(el => {
        const speed = parseFloat(el.dataset.parallax || '0.12');
        const rect = el.getBoundingClientRect();
        const viewportMid = window.innerHeight * 0.5;
        const elementMid = rect.top + rect.height * 0.5;
        const distance = (viewportMid - elementMid) * speed;
        el.style.transform = `translate3d(0, ${distance}px, 0)`;
      });
    }
    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      window.requestAnimationFrame(updateProgressAndParallax);
      ticking = true;
    }
  }
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  updateProgressAndParallax();

  // --------------------------------------------------------------------------
  // CUSTOM CILPA ICON CURSOR (DESKTOP FINE POINTER ONLY)
  // --------------------------------------------------------------------------
  if (isMotion) {
    const canCursor = window.matchMedia('(pointer: fine)').matches && window.innerWidth > 900;
    let cilpaCursor = qs('.cilpa-cursor');

    if (canCursor) {
      if (!cilpaCursor) {
        cilpaCursor = document.createElement('div');
        cilpaCursor.className = 'cilpa-cursor';
        cilpaCursor.setAttribute('aria-hidden', 'true');
        cilpaCursor.innerHTML = '<img src="assets/img/external/cilpa-logo.png" alt="" width="28" height="28">';
        body.prepend(cilpaCursor);
      }

      body.classList.add('has-cilpa-cursor');

      let pointerX = -100;
      let pointerY = -100;
      let cursorRaf = null;
      const halfSize = 14;

      const interactiveSelector = 'a, button, select, [role="button"], .project-card, .tab-btn, .filter-btn, .hero-showreel-card.has-controls, .portfolio-card-motion, .video-portfolio-card, .case-study-card, .article-gallery-item, .about-dot, .slide-dot';
      const textSelector = 'input[type="text"], input[type="email"], input[type="search"], textarea';

      function syncCursorPosition() {
        cilpaCursor.style.transform = `translate3d(${pointerX - halfSize}px, ${pointerY - halfSize}px, 0)`;
        cursorRaf = null;
      }

      window.addEventListener('pointermove', e => {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        pointerX = e.clientX;
        pointerY = e.clientY;
        root.style.setProperty('--mx', `${pointerX}px`);
        root.style.setProperty('--my', `${pointerY}px`);
        cilpaCursor.classList.add('is-visible');

        const target = e.target;
        const isText = Boolean(target && target.closest && target.closest(textSelector));
        const isInteractive = !isText && Boolean(target && target.closest && target.closest(interactiveSelector));
        cilpaCursor.classList.toggle('is-text', isText);
        cilpaCursor.classList.toggle('is-hover', isInteractive);

        if (!cursorRaf) {
          cursorRaf = window.requestAnimationFrame(syncCursorPosition);
        }
      }, { passive: true });

      window.addEventListener('pointerdown', () => {
        cilpaCursor.classList.add('is-press');
      }, { passive: true });

      window.addEventListener('pointerup', () => {
        cilpaCursor.classList.remove('is-press');
      }, { passive: true });

      document.documentElement.addEventListener('pointerleave', () => {
        cilpaCursor.classList.remove('is-visible', 'is-hover', 'is-press');
      });

      window.addEventListener('blur', () => {
        cilpaCursor.classList.remove('is-visible', 'is-hover', 'is-press');
      });
    }
  }

  // --------------------------------------------------------------------------
  // REVEAL ANIMATIONS & COUNTERS
  // --------------------------------------------------------------------------
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        if (entry.target.hasAttribute('data-counter-group')) runCounters(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -4% 0px' });

  qsa('.reveal,[data-counter-group]').forEach((el, index) => {
    el.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`;
    revealObserver.observe(el);
  });

  function runCounters(group) {
    if (group.dataset.ran) return;
    group.dataset.ran = '1';
    qsa('[data-count]', group).forEach(counter => {
      const end = Number(counter.dataset.count || 0);
      const suffix = counter.dataset.suffix || '';
      const duration = 1600;
      const start = performance.now();
      function tick(now) {
        const p = Math.min(1, (now - start) / duration);
        const ease = 1 - Math.pow(1 - p, 4);
        counter.textContent = `${Math.floor(ease * end)}${suffix}`;
        if (p < 1) requestAnimationFrame(tick);
        else counter.textContent = `${end}${suffix}`;
      }
      requestAnimationFrame(tick);
    });
  }

  // --------------------------------------------------------------------------
  // HERO ROTATOR
  // --------------------------------------------------------------------------
  const rotatorWords = qsa('.rotator-word');
  if (rotatorWords.length > 1) {
    let activeWordIndex = 0;
    setInterval(() => {
      const current = rotatorWords[activeWordIndex];
      activeWordIndex = (activeWordIndex + 1) % rotatorWords.length;
      const next = rotatorWords[activeWordIndex];
      current.classList.add('out');
      current.classList.remove('active');
      next.classList.add('active');
      setTimeout(() => current.classList.remove('out'), 460);
    }, 3400);
  }

  // --------------------------------------------------------------------------
  // MOBILE NAVIGATION DRAWER
  // --------------------------------------------------------------------------
  const menuBtn = qs('.menu-btn');
  if (menuBtn) {
    function closeMobileMenu() {
      if (body.classList.contains('menu-open')) {
        body.classList.remove('menu-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    }

    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = body.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });

    qsa('.nav-links a').forEach(a => {
      a.addEventListener('click', closeMobileMenu);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.site-header') && body.classList.contains('menu-open')) {
        closeMobileMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileMenu();
    });
  }

  // Smooth Anchor Scrolling
  qsa('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href === '#') return;
      const target = qs(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Services Tab Switcher
  qsa('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      qsa('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      qsa('.tab-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.panel === tab));
    });
  });

  // FAQ Accordion
  qsa('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      if (!item) return;
      const wasOpen = item.classList.contains('open');
      qsa('.faq-item').forEach(other => {
        other.classList.remove('open');
        const indicator = qs('.faq-question span', other);
        if (indicator) indicator.textContent = '+';
      });
      if (!wasOpen) {
        item.classList.add('open');
        const indicator = qs('span', btn);
        if (indicator) indicator.textContent = '−';
      }
    });
  });

  // --------------------------------------------------------------------------
  // PORTFOLIO SHOWREEL VIDEO CONTROLS (ONLY WHEN .has-controls IS PRESENT)
  // --------------------------------------------------------------------------
  const interactiveShowreelCard = qs('.hero-showreel-card.has-controls');
  if (interactiveShowreelCard) {
    const showreelVideo = qs('video', interactiveShowreelCard);
    const soundToggle = qs('#showreelSoundToggle', interactiveShowreelCard);
    const playToggle = qs('#showreelPlayToggle', interactiveShowreelCard);
    const showreelBar = qs('#showreelBar', interactiveShowreelCard);

    if (showreelVideo) {
      showreelVideo.addEventListener('timeupdate', () => {
        if (showreelBar && showreelVideo.duration) {
          const pct = (showreelVideo.currentTime / showreelVideo.duration) * 100;
          showreelBar.style.width = `${pct}%`;
        }
      });

      if (soundToggle) {
        const syncSoundUI = () => {
          const muted = showreelVideo.muted;
          soundToggle.classList.toggle('is-muted', muted);
          soundToggle.setAttribute('aria-pressed', String(!muted));
          const label = qs('.sound-label', soundToggle);
          if (label) label.textContent = muted ? 'Unmute Audio' : 'Mute Audio';
        };
        syncSoundUI();

        soundToggle.addEventListener('click', e => {
          e.stopPropagation();
          showreelVideo.muted = !showreelVideo.muted;
          syncSoundUI();
          showToast(showreelVideo.muted ? 'Audio showreel dibisukan' : 'Audio showreel diaktifkan');
        });
      }

      const syncPlayUI = () => {
        if (!playToggle) return;
        const paused = showreelVideo.paused;
        playToggle.classList.toggle('is-paused', paused);
        playToggle.setAttribute('aria-pressed', String(paused));
        playToggle.setAttribute('aria-label', paused ? 'Putar showreel' : 'Jeda showreel');
      };

      function toggleShowreelPlay(e) {
        if (e) e.stopPropagation();
        if (showreelVideo.paused) {
          showreelVideo.play();
          showToast('Memutar showreel');
        } else {
          showreelVideo.pause();
          showToast('Showreel dijeda');
        }
        syncPlayUI();
      }

      showreelVideo.addEventListener('play', syncPlayUI);
      showreelVideo.addEventListener('pause', syncPlayUI);
      syncPlayUI();

      if (playToggle) playToggle.addEventListener('click', toggleShowreelPlay);
      interactiveShowreelCard.addEventListener('click', toggleShowreelPlay);
    }
  }

  // --------------------------------------------------------------------------
  // PORTFOLIO HERO SLIDESHOW (GRAPHIC DESIGN / PRODUCT PHOTOS / TALENT)
  // --------------------------------------------------------------------------
  qsa('.portfolio-slideshow').forEach(stage => {
    const imgs = qsa('img', stage);
    if (imgs.length <= 1) return;

    let currentIdx = 0;
    imgs.forEach((img, idx) => img.classList.toggle('active', idx === 0));

    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'slide-dots';
    const dots = imgs.map((_, idx) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `slide-dot${idx === 0 ? ' active' : ''}`;
      dot.setAttribute('aria-label', `Slide ${idx + 1}`);
      dotsWrap.appendChild(dot);
      return dot;
    });
    stage.appendChild(dotsWrap);

    function go(idx) {
      imgs.forEach((img, i) => img.classList.toggle('active', i === idx));
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      currentIdx = idx;
    }

    let timer = setInterval(() => go((currentIdx + 1) % imgs.length), 4200);
    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        clearInterval(timer);
        go(idx);
        timer = setInterval(() => go((currentIdx + 1) % imgs.length), 4200);
      });
    });

    stage.addEventListener('mouseenter', () => clearInterval(timer));
    stage.addEventListener('mouseleave', () => {
      clearInterval(timer);
      timer = setInterval(() => go((currentIdx + 1) % imgs.length), 4200);
    });
  });

  // --------------------------------------------------------------------------
  // PORTFOLIO FILTERING
  // --------------------------------------------------------------------------
  qsa('.filter-bar').forEach(bar => {
    qsa('.filter-btn', bar).forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        qsa('.filter-btn', bar).forEach(b => b.classList.toggle('active', b === btn));

        const cards = qsa('.portfolio-card-motion, .video-portfolio-card');
        cards.forEach(card => {
          const cat = card.dataset.category || 'all';
          const match = filter === 'all' || cat === filter;
          if (match) {
            card.classList.remove('is-hidden');
            card.style.opacity = '0';
            card.style.transform = 'translateY(14px)';
            setTimeout(() => {
              card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, 30);
          } else {
            card.classList.add('is-hidden');
          }
        });

        // Toggle parent video section headings when filtering vertical/landscape
        qsa('.video-block').forEach(block => {
          const visibleCards = qsa('.video-portfolio-card:not(.is-hidden)', block);
          block.style.display = visibleCards.length > 0 ? '' : 'none';
        });
      });
    });
  });

  // --------------------------------------------------------------------------
  // ABOUT PAGE: AUTO SLIDESHOW & DOTS
  // --------------------------------------------------------------------------
  const slideItems = qsa('.about-slide-item');
  const slideDots = qsa('.about-dot');
  if (slideItems.length > 1) {
    let currentSlide = 0;
    let slideTimer = null;

    function goToSlide(idx) {
      slideItems.forEach((s, i) => s.classList.toggle('active', i === idx));
      slideDots.forEach((d, i) => d.classList.toggle('active', i === idx));
      currentSlide = idx;
    }

    function startSlideInterval() {
      slideTimer = setInterval(() => {
        goToSlide((currentSlide + 1) % slideItems.length);
      }, 4200);
    }

    slideDots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        clearInterval(slideTimer);
        goToSlide(idx);
        startSlideInterval();
      });
    });

    const stage = qs('.about-hero-stage');
    if (stage) {
      stage.addEventListener('mouseenter', () => clearInterval(slideTimer));
      stage.addEventListener('mouseleave', () => startSlideInterval());
    }
    startSlideInterval();
  }

  // --------------------------------------------------------------------------
  // FULLSCREEN LIGHTBOX & CINEMA MODAL
  // --------------------------------------------------------------------------
  let lightbox = qs('#cilpaLightbox');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.id = 'cilpaLightbox';
    lightbox.className = 'lightbox-modal';
    lightbox.innerHTML = `
      <div class="lightbox-dialog">
        <button type="button" class="lightbox-close-btn" aria-label="Tutup Lightbox">✕</button>
        <button type="button" class="lightbox-nav-btn lightbox-prev-btn" aria-label="Sebelumnya">‹</button>
        <button type="button" class="lightbox-nav-btn lightbox-next-btn" aria-label="Selanjutnya">›</button>
        <div class="lightbox-stage" id="lightboxStage"></div>
        <div class="lightbox-caption-bar">
          <h4 id="lightboxTitle">Project Title</h4>
          <span id="lightboxCategory">Category</span>
        </div>
      </div>
    `;
    body.appendChild(lightbox);
  }

  let galleryItems = [];
  let currentGalleryIndex = 0;

  function openLightbox(index) {
    if (!galleryItems.length || index < 0 || index >= galleryItems.length) return;
    currentGalleryIndex = index;
    const item = galleryItems[index];
    const stage = qs('#lightboxStage');
    const title = qs('#lightboxTitle');
    const cat = qs('#lightboxCategory');

    if (item.type === 'video') {
      stage.innerHTML = `
        <video controls autoplay playsinline style="width:100%; height:100%; object-fit:contain;">
          <source src="${item.src}" type="video/mp4">
        </video>
      `;
    } else {
      stage.innerHTML = `<img src="${item.src}" alt="${item.title}" style="max-width:100%; max-height:100%; object-fit:contain;">`;
    }

    if (title) title.textContent = item.title;
    if (cat) cat.textContent = `${index + 1} / ${galleryItems.length} • ${item.category}`;

    lightbox.classList.add('is-active');
    body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('is-active');
    body.style.overflow = '';
    const stage = qs('#lightboxStage');
    if (stage) stage.innerHTML = '';
  }

  qs('.lightbox-close-btn', lightbox)?.addEventListener('click', closeLightbox);
  qs('.lightbox-prev-btn', lightbox)?.addEventListener('click', () => {
    openLightbox((currentGalleryIndex - 1 + galleryItems.length) % galleryItems.length);
  });
  qs('.lightbox-next-btn', lightbox)?.addEventListener('click', () => {
    openLightbox((currentGalleryIndex + 1) % galleryItems.length);
  });
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  window.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('is-active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') openLightbox((currentGalleryIndex - 1 + galleryItems.length) % galleryItems.length);
    if (e.key === 'ArrowRight') openLightbox((currentGalleryIndex + 1) % galleryItems.length);
  });

  function initGalleryTriggers() {
    const photoCards = qsa('.portfolio-card-motion');
    if (photoCards.length > 0) {
      galleryItems = photoCards.map(card => {
        const img = qs('img', card);
        const title = qs('h3', card)?.textContent || 'Portfolio Item';
        const cat = qs('.portfolio-category-pill, span', card)?.textContent || 'Creative';
        return {
          type: 'image',
          src: img ? img.getAttribute('src') : '',
          title,
          category: cat
        };
      });

      photoCards.forEach((card, idx) => {
        card.addEventListener('click', () => openLightbox(idx));
      });
    }

    const videoCards = qsa('.video-portfolio-card');
    if (videoCards.length > 0) {
      videoCards.forEach(card => {
        card.addEventListener('click', () => {
          const v = qs('source', card);
          const title = qs('h3', card)?.textContent || 'Video Ads Preview';
          const cat = qs('span', card)?.textContent || 'Video Production';
          const src = v ? v.getAttribute('src') : 'assets/videos/cilpa.mp4';

          galleryItems = [{
            type: 'video',
            src,
            title,
            category: cat
          }];
          openLightbox(0);
        });
      });
    }

    const articleImages = qsa('.article-gallery-item, .milestone-summary-media img');
    if (articleImages.length > 0) {
      articleImages.forEach((el) => {
        el.addEventListener('click', () => {
          const img = el.tagName === 'IMG' ? el : qs('img', el);
          if (!img) return;
          galleryItems = [{
            type: 'image',
            src: img.getAttribute('src'),
            title: img.getAttribute('alt') || 'Event Documentation',
            category: 'Dokumentasi Event'
          }];
          openLightbox(0);
        });
      });
    }
  }
  initGalleryTriggers();

  // 3D Card Tilt (Subtle on desktop)
  qsa('[data-tilt]').forEach(card => {
    card.addEventListener('pointermove', e => {
      if (window.innerWidth < 900) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (0.5 - py) * 6;
      const ry = (px - 0.5) * 6;
      card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(4px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });

  // Subtle Magnetic Pull Effect on Primary CTAs
  qsa('.magnet, .nav-cta, .showreel-sound-btn').forEach(el => {
    el.addEventListener('pointermove', e => {
      if (window.innerWidth < 900) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate3d(${x * 0.1}px, ${y * 0.1}px, 0)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  // Contact Form -> WhatsApp
  const form = qs('#projectForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const brand = String(data.get('brand') || '').trim();
      const service = String(data.get('service') || '').trim();
      const detail = String(data.get('detail') || '').trim();
      const message = [
        'Halo CILPA Creative Studio, saya ingin konsultasi project.',
        '',
        `Nama: ${name}`,
        `Brand / Bisnis: ${brand}`,
        `Layanan: ${service}`,
        `Detail Kebutuhan: ${detail}`,
        '',
        'Mohon arahan dan estimasi kerjasamanya. Terima kasih!'
      ].join('\n');
      window.open(`https://wa.me/6283119963064?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    });
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  // Strict Zoom Locking on Mobile/Tablet
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => {
    document.addEventListener(ev, e => e.preventDefault(), { passive: false });
  });

  document.addEventListener('touchstart', e => {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  let lastTouchEnd = 0;
  document.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

  window.addEventListener('wheel', e => {
    if (e.ctrlKey) e.preventDefault();
  }, { passive: false });

  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Footer Jakarta Clock, Email Copy & Back to Top
  const jakartaTimeEl = document.getElementById('jakartaTime');
  function updateJakartaTime() {
    if (!jakartaTimeEl) return;
    try {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(now);
      jakartaTimeEl.textContent = `${timeStr.replace(/\./g, ':')} WIB`;
    } catch (err) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      jakartaTimeEl.textContent = `${hours}:${minutes}:${seconds} WIB`;
    }
  }
  if (jakartaTimeEl) {
    updateJakartaTime();
    setInterval(updateJakartaTime, 1000);
  }

  const copyEmailBtn = document.getElementById('copyEmailBtn');
  const copyBadge = document.getElementById('copyBadge');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', async () => {
      const email = copyEmailBtn.dataset.email || 'info@cilpa.biz.id';
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(email);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = email;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }
        if (copyBadge) {
          copyBadge.textContent = 'Tersalin';
          copyBadge.style.color = '#38ef7d';
          setTimeout(() => {
            copyBadge.textContent = 'Salin';
            copyBadge.style.color = '';
          }, 2400);
        }
        showToast(`Email ${email} berhasil disalin.`);
      } catch (e) {
        showToast(`Silakan kirim email ke: ${email}`);
      }
    });
  }

  const backToTopBtn = document.getElementById('backToTopBtn');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    backToTopBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
})();
