(() => {
  'use strict';
  const root = window.SITE_ROOT || '';
  const products = window.SAPOQUINHAS_PRODUCTS || [];
  const page = document.body.dataset.view;
  const $ = (s, el=document) => el.querySelector(s);
  const asset = (name) => `${root}assets/${name}.webp`;
  const productUrl = (p) => `${root}brinquedos/${p.id}/`;
  const quoteUrl = (p, size='') => `${root}?brinquedo=${encodeURIComponent(p.id)}${size ? `&tamanho=${encodeURIComponent(size)}` : ''}#orcamento`;
  const clean = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const card = (p) => {
    const image = p.photo || `catalogo-${String(p.page).padStart(2,'0')}`;
    const specs = [p.age,p.dimensions].filter(Boolean).map(x=>`<span>${x}</span>`).join('');
    return `<article class="product-card"><a class="product-image" href="${productUrl(p)}" aria-label="Ver detalhes de ${p.name}"><img src="${asset(image)}" alt="${p.name} da Sapoquinhas Festas" loading="lazy" width="680" height="520"><span class="category-label">${p.category}</span></a><div class="product-info"><h3><a href="${productUrl(p)}">${p.name}</a></h3><p>${p.summary}</p>${specs ? `<div class="product-specs">${specs}</div>`:''}<div class="card-actions"><a class="details-link" href="${productUrl(p)}">Ver detalhes</a><a class="reserve-link" href="${quoteUrl(p)}">Quero este brinquedo</a></div></div></article>`;
  };

  const navButton = $('.menu-toggle');
  const nav = $('#site-nav');
  navButton?.addEventListener('click', () => {
    const open = navButton.getAttribute('aria-expanded') !== 'true';
    navButton.setAttribute('aria-expanded', String(open));
    navButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.classList.toggle('is-open', open);
  });
  nav?.addEventListener('click', e => {
    if(e.target.closest('a')) {nav.classList.remove('is-open'); navButton?.setAttribute('aria-expanded','false');navButton?.setAttribute('aria-label','Abrir menu');}
  });
  document.addEventListener('keydown', e=>{
    if(e.key==='Escape' && nav?.classList.contains('is-open')) {nav.classList.remove('is-open');navButton?.setAttribute('aria-expanded','false');navButton?.focus();}
  });
  if($('#year')) $('#year').textContent = new Date().getFullYear();

  if(page === 'home') {
    const featuredIds = ['futebol-de-sabao','toboga-inflavel','kid-play-1','corrida-de-obstaculos','toboga-com-piscina-de-bolinhas','bubble-house'];
    $('#featured-grid').innerHTML = featuredIds.map(id=>products.find(p=>p.id===id)).filter(Boolean).map(card).join('');

    const slides = [...document.querySelectorAll('.hero-slide')];
    const dots = $('.hero-dots'); let current = 0; let timer;
    dots.innerHTML = slides.map((_,i)=>`<button type="button" aria-label="Mostrar foto ${i+1}" aria-current="${i===0}"></button>`).join('');
    const show = (n) => {
      current = (n+slides.length)%slides.length;
      slides.forEach((s,i)=>{s.classList.toggle('is-active', i===current);s.setAttribute('aria-hidden',String(i!==current));});
      [...dots.children].forEach((d,i)=>d.setAttribute('aria-current',String(i===current)));
      $('#slide-label').textContent = `${String(current+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
    };
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pause = () => clearInterval(timer);
    const resume = () => {pause();if(!reduce && !document.hidden)timer=setInterval(()=>show(current+1),5400);};
    $('#hero-prev').addEventListener('click',()=>{show(current-1);resume();});
    $('#hero-next').addEventListener('click',()=>{show(current+1);resume();});
    dots.addEventListener('click', e=>{const i=[...dots.children].indexOf(e.target.closest('button'));if(i>=0){show(i);resume();}});
    let startX=0;
    $('.hero-media').addEventListener('touchstart',e=>{startX=e.changedTouches[0].clientX;},{passive:true});
    $('.hero-media').addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-startX;if(Math.abs(dx)>45){show(current+(dx<0?1:-1));resume();}},{passive:true});
    $('.hero').addEventListener('mouseenter',pause);
    $('.hero').addEventListener('mouseleave',resume);
    $('.hero').addEventListener('focusin',pause);
    $('.hero').addEventListener('focusout',resume);
    document.addEventListener('visibilitychange',()=>document.hidden?pause():resume());
    show(0);resume();

    const box = $('#lightbox');
    document.querySelectorAll('[data-lightbox]').forEach(button=>button.addEventListener('click',()=>{
      const img=$('img',box);img.src=button.dataset.lightbox;img.alt=button.dataset.alt;box.showModal();
    }));
    $('.lightbox-close')?.addEventListener('click',()=>box.close());
    box?.addEventListener('click',e=>{if(e.target===box)box.close();});

    const toyChoices = $('#toy-choices');
    const sizesOf = p => p.sizes || (p.dimensions ? [p.dimensions] : []);
    toyChoices.innerHTML = `<input class="toy-search" type="search" aria-label="Filtrar brinquedos para o orçamento" placeholder="Busque um brinquedo na lista"><div class="toy-checklist">${products.map(p=>{
      const sizes=sizesOf(p);
      const sizeField=sizes.length
        ? `<select name="tamanho-${p.id}" aria-label="Tamanho de ${p.name}"><option value="">Definir tamanho com a equipe</option>${sizes.map(size=>`<option value="${size}">${size}</option>`).join('')}</select>`
        : `<input name="tamanho-${p.id}" aria-label="Tamanho desejado de ${p.name}" placeholder="Tamanho desejado (se souber)">`;
      return `<div class="toy-choice" data-toy-name="${p.name}"><label><input type="checkbox" name="brinquedos" value="${p.id}"><span>${p.name}</span></label><div class="toy-size" hidden><span>Tamanho</span>${sizeField}</div></div>`;
    }).join('')}</div>`;
    $('.toy-search').addEventListener('input',e=>{
      [...document.querySelectorAll('.toy-choice')].forEach(item=>item.hidden=!clean(item.dataset.toyName).includes(clean(e.target.value)));
    });
    const showSize = checkbox => {
      const item=checkbox.closest('.toy-choice');
      item.classList.toggle('selected', checkbox.checked);
      item.querySelector('.toy-size').hidden=!checkbox.checked;
    };
    const params = new URLSearchParams(location.search);
    const selected = params.get('brinquedo');
    if(selected) {
      const check=[...document.querySelectorAll('[name="brinquedos"]')].find(c=>c.value===selected);
      if(check) {
        check.checked=true;showSize(check);
        const requestedSize=params.get('tamanho');
        const sizeControl=check.closest('.toy-choice').querySelector('.toy-size select, .toy-size input');
        if(requestedSize && (sizeControl.tagName!=='SELECT' || [...sizeControl.options].some(o=>o.value===requestedSize))) sizeControl.value=requestedSize;
      }
    }
    toyChoices.addEventListener('change', e=>{if(e.target.matches('[type=checkbox]')) showSize(e.target);});
    const decorationFields = $('#decoration-fields');
    const useDecoration = name => {decorationFields.hidden=false;document.querySelector('[name="decoracao"]').value=name;};
    if(params.get('decoracao')) useDecoration(params.get('decoracao'));
    document.querySelectorAll('[data-decoration]').forEach(link=>link.addEventListener('click',()=>useDecoration(link.dataset.decoration)));
    const form = $('#quote-form');
    const feedback = $('#form-feedback');
    const date = form.elements.data;
    const localDate = new Date();
    date.min = `${localDate.getFullYear()}-${String(localDate.getMonth()+1).padStart(2,'0')}-${String(localDate.getDate()).padStart(2,'0')}`;
    form.addEventListener('submit',e=>{
      e.preventDefault();
      feedback.textContent='';feedback.classList.remove('error');
      const fields=['nome','telefone','local','data'];
      for(const key of fields){const el=form.elements[key]; if(!el.value.trim() || !el.checkValidity()){feedback.textContent='Preencha os campos obrigatórios para continuar.';feedback.classList.add('error');el.focus();return;}}
      const phoneDigits = form.elements.telefone.value.replace(/\D/g,'');
      if(phoneDigits.length<10 || phoneDigits.length>13){feedback.textContent='Confira o número de telefone com DDD.';feedback.classList.add('error');form.elements.telefone.focus();return;}
      const picked=[...form.querySelectorAll('[name="brinquedos"]:checked')].map(el=>{
        const product=products.find(p=>p.id===el.value);
        if(!product)return null;
        const size=el.closest('.toy-choice').querySelector('.toy-size select, .toy-size input').value.trim();
        return `${product.name} — tamanho: ${size || 'a confirmar'}`;
      }).filter(Boolean);
      const values=new FormData(form);
      const dateText=new Date(`${values.get('data')}T12:00:00`).toLocaleDateString('pt-BR');
      const lines=['Olá! Vim pelo site da Sapoquinhas Festas e gostaria de solicitar um orçamento.','',`Nome: ${values.get('nome').trim()}`,`WhatsApp: ${values.get('telefone').trim()}`,`Data do evento: ${dateText}`,`Local do evento: ${values.get('local').trim()}`];
      if(values.get('tipo'))lines.push(`Tipo de evento: ${values.get('tipo')}`);
      if(values.get('pessoas'))lines.push(`Quantidade estimada de pessoas: ${values.get('pessoas')}`);
      if(picked.length)lines.push(`Brinquedo(s): ${picked.join(', ')}`);
      if(values.get('decoracao'))lines.push(`Decoração desejada: ${values.get('decoracao').trim()}`);
      if(values.get('idade'))lines.push(`Idade a comemorar: ${values.get('idade').trim()}`);
      if(values.get('obsDecoracao'))lines.push(`Detalhes da decoração: ${values.get('obsDecoracao').trim()}`);
      if(values.get('mensagem'))lines.push(`Mais informações: ${values.get('mensagem').trim()}`);
      feedback.textContent='Pedido preparado. Confira a mensagem e toque em enviar no WhatsApp.';
      const url=`https://wa.me/5561992900497?text=${encodeURIComponent(lines.join('\n'))}`;
      setTimeout(()=>{location.href=url;},180);
    });
  }
  if(page === 'catalog') {
    const search=$('#catalog-search'), filters=$('#category-filters'), grid=$('#catalog-grid');
    const categories=['Todos',...new Set(products.map(p=>p.category))];let category='Todos';
    filters.innerHTML=categories.map(c=>`<button type="button" data-category="${c}" aria-pressed="${c==='Todos'}">${c}</button>`).join('');
    const render=()=>{
      const q=clean(search.value.trim());
      const shown=products.filter(p=>(category==='Todos'||category===p.category)&&clean(p.name+' '+p.summary).includes(q));
      grid.innerHTML=shown.map(card).join('');
      $('#result-count').textContent=`${shown.length} ${shown.length===1?'item encontrado':'itens encontrados'}`;
      $('#catalog-empty').hidden=!!shown.length;
    };
    search.addEventListener('input',render);
    filters.addEventListener('click',e=>{const btn=e.target.closest('button');if(!btn)return;category=btn.dataset.category;[...filters.children].forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));render();});
    $('#clear-filters').addEventListener('click',()=>{search.value='';category='Todos';[...filters.children].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category==='Todos')));render();search.focus();});
    render();
  }
  if(page === 'product') {
    const p=products.find(item=>item.id===document.body.dataset.product);
    if(!p)return;
    const mainImage=asset(p.photo||`catalogo-${String(p.page).padStart(2,'0')}`);
    const images=p.photos || [{image:p.photo||`catalogo-${String(p.page).padStart(2,'0')}`,label:`${p.name} da Sapoquinhas Festas`},...(!p.hideCatalogPage?[{image:`catalogo-pagina-${String(p.page).padStart(2,'0')}`,label:`Página do catálogo de ${p.name}`}]:[])];
    const thumbs=images.map((photo,i)=>`<button type="button" class="${i===0?'is-active':''}" data-src="${asset(photo.image)}" data-alt="${photo.label}" aria-label="Mostrar foto: ${photo.label}"><img src="${asset(photo.image)}" alt="${photo.label}" loading="lazy"></button>`).join('');
    const specs=[p.age&&['Idade indicada',p.age],p.dimensions&&['Dimensões informadas',p.dimensions]].filter(Boolean);
    const sizes=p.sizes || (p.dimensions?[p.dimensions]:[]);
    const selector=sizes.length?`<label class="product-size-label" for="product-size">Escolha o tamanho</label><select id="product-size"><option value="">Escolher no formulário</option>${sizes.map(size=>`<option value="${size}">${size}</option>`).join('')}</select>`:'';
    $('#product-detail').innerHTML=`<div class="detail-gallery"><div class="detail-main"><img id="detail-main-image" src="${mainImage}" alt="${images[0].label}" fetchpriority="high"></div><div class="detail-thumbs">${thumbs}</div></div><div class="detail-copy"><p class="eyebrow">${p.category}</p><h1>${p.name}</h1><p class="detail-lead">${p.summary}</p>${specs.length?`<dl class="detail-specs">${specs.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`:'<p class="detail-note">Consulte a equipe para mais informações sobre este item.</p>'}${selector}<a id="product-quote" class="button button-blue" href="${quoteUrl(p)}">Quero este brinquedo no meu evento</a><p class="detail-hint">Ao clicar, o brinquedo já aparece selecionado no formulário.</p></div>`;
    $('#product-size')?.addEventListener('change',e=>{$('#product-quote').href=quoteUrl(p,e.target.value);});
    document.querySelector('.detail-thumbs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const image=$('#detail-main-image');image.src=b.dataset.src;image.alt=b.dataset.alt;document.querySelectorAll('.detail-thumbs button').forEach(x=>x.classList.toggle('is-active',x===b));});
    const related=products.filter(x=>x.id!==p.id&&x.category===p.category).slice(0,3);
    $('#related-grid').innerHTML=related.map(card).join('');
  }
})();
