    const WSP_NUMBER = '56989127815';

    /* ----- lazy-load product images if available ----- */
    document.querySelectorAll('img[data-src]').forEach(img => {
      const probe = new Image();
      probe.onload = () => { img.src = probe.src; };
      probe.src = img.dataset.src;
    });

    /* ----- color circles on cards ----- */
    document.querySelectorAll('.product-card').forEach(card => {
      const circles = card.querySelectorAll('.color-circle');
      circles.forEach(circle => {
        circle.addEventListener('click', (e) => {
          e.stopPropagation();
          circles.forEach(c => c.classList.remove('selected'));
          circle.classList.add('selected');
        });
      });
    });

    /* ----- favorite hearts ----- */
    document.querySelectorAll('[data-fav]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        btn.classList.toggle('active');
      });
    });

    /* ----- modal state ----- */
    const modal = document.getElementById('modal');
    const mImg = document.getElementById('mImg');
    const mName = document.getElementById('mName');
    const mPrice = document.getElementById('mPrice');
    const mColorPick = document.getElementById('mColorPick');
    const mSizePick = document.getElementById('mSizePick');
    const mSwatches = document.getElementById('mSwatches');
    const mSizes = document.getElementById('mSizes');
    const mNote = document.getElementById('mNote');
    const mSend = document.getElementById('mSend');
    const qVal = document.getElementById('qVal');

    let state = { name: '', price: '', color: '', size: '', qty: 1, note: '' };

    function refreshSendBtn() {
      mSend.disabled = !state.size;
    }
    function setQty(v) {
      state.qty = Math.max(1, Math.min(9, v));
      qVal.textContent = state.qty;
    }

    document.getElementById('qMinus').addEventListener('click', () => setQty(state.qty - 1));
    document.getElementById('qPlus').addEventListener('click',  () => setQty(state.qty + 1));

    mSizes.querySelectorAll('.size').forEach(btn => {
      btn.addEventListener('click', () => {
        mSizes.querySelectorAll('.size').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.size = btn.dataset.size;
        mSizePick.textContent = `Talla ${state.size}`;
        refreshSendBtn();
      });
    });

    mNote.addEventListener('input', () => { state.note = mNote.value.trim(); });

    function openModal(card) {
      state = {
        name: card.dataset.name,
        price: card.dataset.price,
        img: card.dataset.img,
        color: '',
        size: '',
        qty: 1,
        note: ''
      };

      mName.textContent = state.name;
      mPrice.textContent = state.price;
      mImg.style.display = 'none';
      const probe = new Image();
      probe.onload = () => { mImg.src = probe.src; mImg.style.display = ''; };
      probe.src = card.dataset.img;

      // build swatches from card colors
      const colors = JSON.parse(card.querySelector('.color-circles').dataset.colors);
      const selectedOnCard = card.querySelector('.color-circle.selected')?.dataset.colorName;
      mSwatches.innerHTML = '';
      colors.forEach((c, i) => {
        const sw = document.createElement('div');
        sw.className = 'swatch';
        sw.style.backgroundColor = c.hex;
        sw.title = c.name;
        sw.dataset.name = c.name;
        if ((selectedOnCard && c.name === selectedOnCard) || (!selectedOnCard && i === 0)) {
          sw.classList.add('selected');
          state.color = c.name;
          mColorPick.textContent = c.name;
        }
        sw.addEventListener('click', () => {
          mSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
          sw.classList.add('selected');
          state.color = c.name;
          mColorPick.textContent = c.name;
        });
        mSwatches.appendChild(sw);
      });

      // reset UI
      mSizes.querySelectorAll('.size').forEach(b => b.classList.remove('selected'));
      mSizePick.textContent = 'Elige una talla';
      setQty(1);
      mNote.value = '';
      refreshSendBtn();

      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-open-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.product-card');
        openModal(card);
      });
    });

    document.getElementById('modalClose').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    /* ===================== CARRITO ===================== */
    const CART_KEY = 'lyv_cart';
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { cart = []; }

    const cartBackdrop = document.getElementById('cartBackdrop');
    const cartDrawer   = document.getElementById('cartDrawer');
    const cartItemsEl  = document.getElementById('cartItems');
    const cartEmptyEl  = document.getElementById('cartEmpty');
    const cartFootEl   = document.getElementById('cartFoot');
    const cartTotalEl  = document.getElementById('cartTotal');
    const cartDot      = document.querySelector('.cart-dot');
    const cartBtn      = document.querySelector('.cart-btn');
    const toastEl      = document.getElementById('toast');

    // "$29.990" -> 29990
    const priceToNumber = (p) => parseInt(String(p).replace(/\D/g, ''), 10) || 0;
    // 29990 -> "$29.990"
    const formatCLP = (n) => '$' + n.toLocaleString('es-CL');

    function saveCart() {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }

    let toastTimer;
    function showToast(msg) {
      toastEl.textContent = msg;
      toastEl.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
    }

    function updateBadge() {
      const count = cart.reduce((sum, it) => sum + it.qty, 0);
      cartDot.textContent = count;
      cartDot.classList.toggle('show', count > 0);
    }

    function renderCart() {
      cartItemsEl.innerHTML = '';
      if (cart.length === 0) {
        cartEmptyEl.classList.add('show');
        cartFootEl.classList.add('hidden');
      } else {
        cartEmptyEl.classList.remove('show');
        cartFootEl.classList.remove('hidden');
        cart.forEach((it, i) => {
          const row = document.createElement('div');
          row.className = 'cart-item';
          const lineTotal = formatCLP(priceToNumber(it.price) * it.qty);
          row.innerHTML = `
            <img class="cart-item-img" src="${it.img}" alt="${it.name}">
            <div class="cart-item-info">
              <div class="cart-item-name">${it.name}</div>
              <div class="cart-item-meta">Color: ${it.color}</div>
              <div class="cart-item-meta">Talla: ${it.size}</div>
              ${it.note ? `<div class="cart-item-note">“${it.note}”</div>` : ''}
              <div class="cart-item-price">${lineTotal}</div>
            </div>
            <div class="cart-item-right">
              <button class="cart-item-remove" data-remove="${i}" aria-label="Quitar">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"></path>
                </svg>
              </button>
              <div class="cart-qty">
                <button data-dec="${i}" aria-label="Restar">−</button>
                <span>${it.qty}</span>
                <button data-inc="${i}" aria-label="Sumar">+</button>
              </div>
            </div>`;
          cartItemsEl.appendChild(row);
        });
      }

      const total = cart.reduce((sum, it) => sum + priceToNumber(it.price) * it.qty, 0);
      cartTotalEl.textContent = formatCLP(total);
      updateBadge();
    }

    function addToCart(item) {
      // si ya existe el mismo producto + color + talla + nota, suma cantidad
      const match = cart.find(it =>
        it.name === item.name && it.color === item.color &&
        it.size === item.size && it.note === item.note);
      if (match) {
        match.qty = Math.min(9, match.qty + item.qty);
      } else {
        cart.push({ ...item });
      }
      saveCart();
      renderCart();
      cartBtn.classList.remove('bump');
      void cartBtn.offsetWidth; // reinicia la animación
      cartBtn.classList.add('bump');
    }

    // delegación de eventos para quitar / +/- dentro del carrito
    cartItemsEl.addEventListener('click', (e) => {
      const inc = e.target.closest('[data-inc]');
      const dec = e.target.closest('[data-dec]');
      const rem = e.target.closest('[data-remove]');
      if (inc) { const i = +inc.dataset.inc; cart[i].qty = Math.min(9, cart[i].qty + 1); }
      else if (dec) { const i = +dec.dataset.dec; cart[i].qty = Math.max(1, cart[i].qty - 1); }
      else if (rem) { cart.splice(+rem.dataset.remove, 1); }
      else return;
      saveCart();
      renderCart();
    });

    /* ----- abrir / cerrar carrito ----- */
    function openCart() {
      cartBackdrop.classList.add('open');
      cartDrawer.classList.add('open');
      cartDrawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeCart() {
      cartBackdrop.classList.remove('open');
      cartDrawer.classList.remove('open');
      cartDrawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
    cartBtn.addEventListener('click', openCart);
    document.getElementById('cartClose').addEventListener('click', closeCart);
    cartBackdrop.addEventListener('click', closeCart);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });

    /* ----- botón "Agregar al carro" del modal ----- */
    mSend.addEventListener('click', () => {
      if (!state.size) return;
      addToCart({
        name: state.name,
        price: state.price,
        color: state.color,
        size: state.size,
        qty: state.qty,
        note: state.note,
        img: state.img
      });
      closeModal();
      showToast(`✓ ${state.name} agregado al carro`);
    });

    /* ----- enviar todo el pedido a WhatsApp ----- */
    function buildCartMessage() {
      const lines = ['¡Hola LYV FIT! 💕', '', 'Quiero hacer este pedido:', ''];
      let total = 0;
      cart.forEach((it, idx) => {
        const lineTotal = priceToNumber(it.price) * it.qty;
        total += lineTotal;
        lines.push(`${idx + 1}. ${it.name}`);
        lines.push(`   • Color: ${it.color}`);
        lines.push(`   • Talla: ${it.size}`);
        lines.push(`   • Cantidad: ${it.qty}`);
        lines.push(`   • Subtotal: ${formatCLP(lineTotal)}`);
        if (it.note) lines.push(`   • Nota: ${it.note}`);
        lines.push('');
      });
      lines.push(`*Total: ${formatCLP(total)}*`);
      lines.push('', '¿Me confirman disponibilidad? ¡Gracias!');
      return lines.join('\n');
    }

    document.getElementById('cartSend').addEventListener('click', () => {
      if (cart.length === 0) return;
      const msg = encodeURIComponent(buildCartMessage());
      window.open(`https://wa.me/${WSP_NUMBER}?text=${msg}`, '_blank');
    });

    renderCart();

    /* ----- floating wsp ----- */
    document.getElementById('wspFloat').addEventListener('click', () => {
      const generic = encodeURIComponent('¡Hola LYV FIT! 💕 Tengo una consulta sobre sus productos.');
      window.open(`https://wa.me/${WSP_NUMBER}?text=${generic}`, '_blank');
    });