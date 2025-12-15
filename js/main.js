/* NAV: highlight active link and ensure dark nav */
(function(){
  const path = window.location.pathname.split('/').pop() || 'index.html';
  const map = {
    'index.html': 'nav-home',
    '': 'nav-home',
    'resources.html': 'nav-resources',
    'more-support.html': 'nav-more',
    'highlights.html': 'nav-highlights',
    'faq.html': 'nav-faq'
  };
  const id = map[path] || 'nav-home';
  document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
  const el = document.getElementById(id);
  if(el) el.classList.add('active');

  // ensure nav dark everywhere
  const nav = document.querySelector('.site-nav');
  if(nav) nav.classList.add('dark');

  // parallax hero for pages with hero-bg
  const heroBg = document.getElementById('heroBg') || document.querySelector('.hero-bg');
  if(heroBg){
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      heroBg.style.transform = `translateY(${scrolled * 0.12}px) scale(1.02)`;
    }, {passive:true});
  }
})();

/* SAFETY MODAL: show once, dismissible, Escape and outside-click support + reopen buttons */
(function(){
  const modal = document.getElementById('safetyModal');
  if(!modal) return;
  const KEY = 'safetyAlertSeen_v1';
  const hasSeen = (() => { try { return !!localStorage.getItem(KEY); } catch(e){ return false; } })();

  const openModal = () => {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    const focusTarget = modal.querySelector('#modalClose') || modal.querySelector('button');
    if(focusTarget) focusTarget.focus();
    document.documentElement.style.overflow = 'hidden';
  };
  const closeModal = (persist = true) => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    try { if(persist) localStorage.setItem(KEY, '1'); } catch(e){}
    const mainHeading = document.querySelector('main h1, main h2, .site-title');
    if(mainHeading) mainHeading.focus?.();
  };

  if(!hasSeen) openModal();

  const btnClose = document.getElementById('modalClose');
  const btnExit = document.getElementById('modalExit');
  if(btnClose) btnClose.addEventListener('click', () => closeModal(true));
  if(btnExit) btnExit.addEventListener('click', () => { try { localStorage.setItem(KEY, '1'); } catch(e){}; window.location.href = 'https://www.google.com'; });

  document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && modal.classList.contains('open')) closeModal(true); });
  modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(true); });

  // footer reopen buttons
  ['reopenSafety','reopenSafetyResources','reopenSafetyMore','reopenSafetyHighlights'].forEach(id=>{
    const btn = document.getElementById(id);
    if(btn) btn.addEventListener('click', () => openModal());
  });
})();

/* STATS CAROUSEL (home) */
(function(){
  const slidesEl = document.querySelector('[data-slides]');
  if(!slidesEl) return;
  const slidesCount = slidesEl.children.length;
  const dotsContainer = document.querySelector('[data-dots]');
  let index = 0;
  let autoTimer = null;

  for(let s=0;s<slidesCount;s++){
    const d = document.createElement('div');
    d.className = 'dot' + (s===0? ' active':'');
    d.dataset.i = s;
    d.addEventListener('click', ()=> goTo(parseInt(d.dataset.i)));
    dotsContainer.appendChild(d);
  }

  function update(){
    slidesEl.style.transform = `translateX(-${index*100}%)`;
    Array.from(dotsContainer.children).forEach((d,i)=> d.classList.toggle('active', i===index));
  }

  window.move = function(dir){
    index = (index + dir + slidesCount) % slidesCount;
    update();
    resetAuto();
  };

  function goTo(i){ index = i % slidesCount; update(); resetAuto(); }

  document.querySelectorAll('.carousel-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> {
      const action = btn.dataset.action;
      if(action === 'prev') move(-1);
      if(action === 'next') move(1);
    });
  });

  let startX = null;
  slidesEl.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
  slidesEl.addEventListener('touchend', e => {
    if(startX === null) return;
    const dx = (e.changedTouches[0].clientX - startX);
    if(Math.abs(dx) > 40) move(dx < 0 ? 1 : -1);
    startX = null;
  });

  document.addEventListener('keydown', e => { if(e.key === 'ArrowLeft') move(-1); if(e.key === 'ArrowRight') move(1); });

  function resetAuto(){ if(autoTimer) clearInterval(autoTimer); autoTimer = setInterval(()=> move(1), 9000); }
  resetAuto();
})();

/* PRINCIPLES reveal */
(function(){
  const el = document.getElementById('principles');
  if(!el) return;
  if('IntersectionObserver' in window){
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if(e.isIntersecting){ el.classList.add('visible'); obs.unobserve(el); } });
    }, {threshold:0.18});
    obs.observe(el);
  } else { el.classList.add('visible'); }
})();

/* RESOURCES: tags + filtering */
(function initTagsAndFilters(){
  const grid = document.getElementById('resourceGrid');
  if(!grid) return;
  const resources = Array.from(grid.querySelectorAll('.resource'));
  const tagSet = new Set();
  resources.forEach(r => {
    const tags = (r.dataset.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    tags.forEach(t => tagSet.add(t));
  });

  const tagListEl = document.getElementById('tagList');
  const tags = Array.from(tagSet).sort();
  tags.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'tag';
    btn.type = 'button';
    btn.textContent = t.replace(/-/g,' ');
    btn.dataset.tag = t;
    btn.addEventListener('click', () => { btn.classList.toggle('active'); applyFilters(); });
    tagListEl.appendChild(btn);
  });

  window.applyFilters = function(){
    const q = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
    const area = (document.getElementById('areaSelect')?.value || '').toLowerCase();
    const activeTagButtons = Array.from(document.querySelectorAll('.tag.active'));
    const activeTags = activeTagButtons.map(b => b.dataset.tag);

    resources.forEach(r => {
      const text = (r.textContent || '').toLowerCase();
      const areaMatch = !area || (r.dataset.area || '').toLowerCase() === area;
      const tagList = (r.dataset.tags || '').split(',').map(t => t.trim()).filter(Boolean);
      const tagsMatch = activeTags.length === 0 || activeTags.every(t => tagList.includes(t));
      const searchMatch = !q || text.includes(q);
      const show = areaMatch && tagsMatch && searchMatch;
      r.style.display = show ? '' : 'none';
      highlightMatches(r, q);
    });

    const visible = grid.querySelectorAll('.resource:not([style*="display: none"])').length;
    const noResults = document.getElementById('noResults');
    if(!visible){
      if(!noResults){
        const msg = document.createElement('div');
        msg.id = 'noResults';
        msg.style.padding = '18px';
        msg.style.gridColumn = '1/-1';
        msg.style.color = 'var(--muted)';
        msg.textContent = 'No resources match your filters. Try clearing a filter or searching different keywords.';
        grid.appendChild(msg);
      }
    } else if(noResults) { noResults.remove(); }
  };

  function highlightMatches(resourceEl, q){
    const fields = resourceEl.querySelectorAll('h4, h3, .desc, .meta');
    fields.forEach(f => { f.innerHTML = f.textContent; });
    if(!q) return;
    const regex = new RegExp('(' + escapeRegExp(q) + ')', 'ig');
    fields.forEach(f => { f.innerHTML = f.textContent.replace(regex, '<span class="hl">$1</span>'); });
  }
  function escapeRegExp(string) { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  applyFilters();
})();

/* MORE SUPPORT: search and submit (ensure thank-you hidden until submit) */
(function(){
  const supportSearch = document.getElementById('supportSearch');
  if(supportSearch){
    const items = Array.from(document.querySelectorAll('#supportList li'));
    supportSearch.addEventListener('input', () => {
      const v = supportSearch.value.toLowerCase();
      items.forEach(it => it.style.display = it.textContent.toLowerCase().includes(v) ? 'block' : 'none');
    });
  }

  const submitBtn = document.getElementById('submitResource');
  const formContent = document.getElementById('formContent');
  const thankYou = document.getElementById('thankYouContent');
  if(thankYou) { thankYou.classList.add('hidden'); thankYou.setAttribute('aria-hidden','true'); }
  if(submitBtn){
    submitBtn.addEventListener('click', () => {
      const input = document.getElementById('resourceLink');
      if(input && input.value.trim().length > 0){
        if(formContent) formContent.style.display = 'none';
        if(thankYou){ thankYou.classList.remove('hidden'); thankYou.setAttribute('aria-hidden','false'); }
        input.value = '';
      } else {
        if(input){ input.style.border = '2px solid #b33a3a'; setTimeout(()=> input.style.border = '', 2000); input.focus(); }
      }
    });
  }
  const submitAgain = document.getElementById('submitAgain');
  if(submitAgain){
    submitAgain.addEventListener('click', () => {
      if(thankYou) { thankYou.classList.add('hidden'); thankYou.setAttribute('aria-hidden','true'); }
      if(formContent) formContent.style.display = '';
    });
  }
})();

/* FAQ accordion behavior */
(function(){
  const faqQuestions = Array.from(document.querySelectorAll('.faq-question'));
  if(!faqQuestions.length) return;

  faqQuestions.forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const parentCard = btn.closest('.faq-card');
      if(parentCard){
        parentCard.querySelectorAll('.faq-question').forEach(q => {
          q.setAttribute('aria-expanded','false');
          const ans = q.nextElementSibling;
          if(ans && ans.classList.contains('faq-answer')) ans.hidden = true;
        });
      }
      btn.setAttribute('aria-expanded', String(!expanded));
      const answer = btn.nextElementSibling;
      if(answer && answer.classList.contains('faq-answer')) {
        answer.hidden = expanded;
      }
    });

    btn.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });
})();

/* HIGHLIGHTS carousel */
(function(){
  const track = document.querySelector('.carousel-track');
  const prevBtn = document.querySelector('.carousel-arrow.left');
  const nextBtn = document.querySelector('.carousel-arrow.right');
  if(!track || !prevBtn || !nextBtn) return;
  const cards = Array.from(track.children);
  let index = 0;
  function updateCarousel(){ track.style.transform = `translateX(-${index * 100}%)`; }
  nextBtn.addEventListener('click', () => { index = (index + 1) % cards.length; updateCarousel(); });
  prevBtn.addEventListener('click', () => { index = (index - 1 + cards.length) % cards.length; updateCarousel(); });
  document.addEventListener('keydown', e => {
    if(document.body.contains(track)){
      if(e.key === 'ArrowLeft') { index = (index - 1 + cards.length) % cards.length; updateCarousel(); }
      if(e.key === 'ArrowRight') { index = (index + 1) % cards.length; updateCarousel(); }
    }
  });
})();
