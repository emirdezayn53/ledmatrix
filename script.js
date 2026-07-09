// ===== CONFIGURATION =====
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbytPlwraT4eTwGzSpBIBEmupW9oYHh6xSVNpLeW-mXcna8EsJZor61afiHAtlmmBlIUfA/exec';

// ===== PRICING =====
const PACKAGES = {
  '1': { qty: 1, price: 1799, label: '1 Adet Matrix LED Panel' },
  '2': { qty: 2, price: 3299, label: '2 Adet Matrix LED Panel' }
};

// ===== CAROUSEL =====
class Carousel {
  constructor(el) {
    this.el = el;
    this.track = el.querySelector('.carousel__track');
    this.dots = el.querySelectorAll('.carousel__dot');
    this.slides = el.querySelectorAll('.carousel__slide');
    this.current = 0;
    this.total = this.slides.length;
    this.startX = 0;
    this.isDragging = false;
    this.diffX = 0;
    this.init();
  }

  init() {
    this.dots.forEach((dot, i) => {
      dot.addEventListener('click', () => this.goTo(i));
    });
    this.track.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: true });
    this.track.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: true });
    this.track.addEventListener('touchend', () => this.onTouchEnd());
    this.autoTimer = setInterval(() => this.next(), 4000);
    this.el.addEventListener('touchstart', () => clearInterval(this.autoTimer), { passive: true });
  }

  goTo(index) {
    this.current = index;
    this.track.style.transform = `translateX(-${index * 100}%)`;
    this.dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  }

  next() {
    this.goTo((this.current + 1) % this.total);
  }

  onTouchStart(e) {
    this.startX = e.touches[0].clientX;
    this.isDragging = true;
  }

  onTouchMove(e) {
    if (!this.isDragging) return;
    this.diffX = e.touches[0].clientX - this.startX;
  }

  onTouchEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (Math.abs(this.diffX) > 50) {
      if (this.diffX < 0 && this.current < this.total - 1) this.goTo(this.current + 1);
      else if (this.diffX > 0 && this.current > 0) this.goTo(this.current - 1);
    }
    this.diffX = 0;
  }
}

// ===== PACKAGE SELECTION =====
function initPackageSelection() {
  const options = document.querySelectorAll('.package-option');
  const stickyPrice = document.querySelector('.sticky-cta__price');
  const stickyOldPrice = document.querySelector('.sticky-cta__old-price');

  options.forEach(option => {
    const radio = option.querySelector('input[type="radio"]');

    option.addEventListener('click', () => {
      options.forEach(o => o.classList.remove('active'));
      option.classList.add('active');
      radio.checked = true;

      const pkg = PACKAGES[radio.value];
      if (pkg) {
        if (stickyPrice) stickyPrice.textContent = `₺${pkg.price.toLocaleString('tr-TR')}`;
        if (stickyOldPrice) {
          // If 2 items are selected, show 4000 old price, otherwise 2000
          stickyOldPrice.textContent = radio.value === '2' ? '₺4.000' : '₺2.000';
        }
      }
    });
  });
}

// ===== DISTRICT DROPDOWN =====
function initDistricts() {
  const citySelect = document.getElementById('input-city');
  const districtGroup = document.getElementById('district-group');
  const districtSelect = document.getElementById('input-district');

  if (!citySelect || !districtSelect || !districtGroup) return;

  citySelect.addEventListener('change', () => {
    const city = citySelect.value;
    const districts = (typeof DISTRICTS !== 'undefined') ? DISTRICTS[city] : null;

    // Clear existing options
    districtSelect.innerHTML = '<option value="" disabled selected>İlçe seçiniz</option>';

    if (districts && districts.length > 0) {
      districts.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        districtSelect.appendChild(opt);
      });
      districtGroup.style.display = '';
      // Smooth reveal animation
      districtGroup.style.opacity = '0';
      districtGroup.style.transform = 'translateY(-8px)';
      requestAnimationFrame(() => {
        districtGroup.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        districtGroup.style.opacity = '1';
        districtGroup.style.transform = 'translateY(0)';
      });
    } else {
      districtGroup.style.display = 'none';
    }
  });
}

// ===== FORM HANDLING =====
function initForm() {
  const form = document.getElementById('order-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = form.querySelector('.submit-btn');
    const spinner = submitBtn.querySelector('.spinner');
    const btnText = submitBtn.querySelector('.submit-btn__label');
    const messageEl = document.getElementById('form-message');

    messageEl.className = 'form-message';
    messageEl.style.display = 'none';

    const name = form.querySelector('#input-name').value.trim();
    const phone = form.querySelector('#input-phone').value.trim();
    const city = form.querySelector('#input-city').value;
    const district = form.querySelector('#input-district').value;
    const address = form.querySelector('#input-address').value.trim();
    const selectedPackage = form.querySelector('input[name="package"]:checked');
    const pkg = PACKAGES[selectedPackage ? selectedPackage.value : '1'];

    if (!name || !phone || !city || !address) {
      showMessage(messageEl, 'error', '⚠️ Lütfen tüm alanları doldurunuz.');
      return;
    }

    if (district === '' || !district) {
      showMessage(messageEl, 'error', '⚠️ Lütfen ilçe seçiniz.');
      return;
    }

    const phoneClean = phone.replace(/\s/g, '');
    if (!/^(05\d{9}|5\d{9}|\+905\d{9})$/.test(phoneClean)) {
      showMessage(messageEl, 'error', '⚠️ Geçerli bir telefon numarası giriniz.');
      return;
    }

    submitBtn.disabled = true;
    spinner.style.display = 'inline-block';
    btnText.textContent = 'Gönderiliyor...';

    const orderData = {
      name,
      phone,
      city,
      district,
      address,
      quantity: pkg.qty,
      totalPrice: `₺${pkg.price.toLocaleString('tr-TR')}`,
      package: pkg.label,
      date: new Date().toLocaleString('tr-TR'),
      product: 'LED Matrix Panel 12×60cm'
    };

    try {
      if (!GOOGLE_SCRIPT_URL) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        window.location.href = 'thankyou.html';
      } else {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });
        window.location.href = 'thankyou.html';
      }
    } catch (err) {
      console.error('Order submission error:', err);
      showMessage(messageEl, 'error', '❌ Bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      submitBtn.disabled = false;
      spinner.style.display = 'none';
      btnText.textContent = 'Siparişi Onayla';
    }
  });
}

function resetPackageSelection() {
  const options = document.querySelectorAll('.package-option');
  options.forEach(o => o.classList.remove('active'));
  const first = document.getElementById('option-1');
  if (first) {
    first.classList.add('active');
    const radio = first.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
  }
  const districtGroup = document.getElementById('district-group');
  if (districtGroup) districtGroup.style.display = 'none';
  const stickyPrice = document.querySelector('.sticky-cta__price');
  const stickyOldPrice = document.querySelector('.sticky-cta__old-price');
  if (stickyPrice) stickyPrice.textContent = '₺1.799';
  if (stickyOldPrice) stickyOldPrice.textContent = '₺2.000';
}

function showMessage(el, type, text) {
  el.className = `form-message ${type}`;
  el.textContent = text;
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ===== SCROLL REVEAL =====
function initReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(el => observer.observe(el));
}

// ===== STICKY CTA =====
function initStickyCTA() {
  const cta = document.querySelector('.sticky-cta');
  const orderSection = document.getElementById('order-section');
  const ctaBtn = document.querySelector('.sticky-cta__btn');

  if (!cta || !orderSection) return;

  ctaBtn.addEventListener('click', () => {
    orderSection.scrollIntoView({ behavior: 'smooth' });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      cta.style.transform = entry.isIntersecting
        ? 'translateX(-50%) translateY(100%)'
        : 'translateX(-50%) translateY(0)';
    });
  }, { threshold: 0.3 });

  observer.observe(orderSection);
}

// ===== GLOBAL CLICK REDIRECT =====
function initGlobalClickRedirect() {
  document.addEventListener('click', (e) => {
    const orderSection = document.getElementById('order-section');
    if (!orderSection) return;

    // If the click is inside the order section (inputs, selects, buttons, labels etc.), do nothing
    if (orderSection.contains(e.target)) {
      return;
    }

    // Also do not trigger if clicking the sticky CTA button since it already scrolls
    const cta = document.querySelector('.sticky-cta');
    if (cta && cta.contains(e.target)) {
      return;
    }

    // Scroll to the order section
    orderSection.scrollIntoView({ behavior: 'smooth' });
  });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  const carouselEl = document.querySelector('.carousel');
  if (carouselEl) new Carousel(carouselEl);

  initPackageSelection();
  initDistricts();
  initForm();
  initReveal();
  initStickyCTA();
  initGlobalClickRedirect();
});
