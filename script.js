// ===== CONFIGURATION =====
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzzRTGFWU8HzdqUg-ssMH7ZhCSYAFbaTcx4qW-cS7cXclswexRrvNKsSxf94dVlXAJUow/exec';

// ===== IP YAKALAMA =====
let visitorIP = 'Bilinmiyor';
fetch('https://api.ipify.org?format=json')
  .then(r => r.json())
  .then(d => { visitorIP = d.ip; })
  .catch(() => {});

// ===== MÜKERRER SİPARİŞ TESPİTİ =====
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000; // 10 dakika

function isDuplicateOrder(ip) {
  try {
    const key = 'recent_orders';
    const now = Date.now();
    let records = JSON.parse(localStorage.getItem(key) || '[]');
    // Eski kayıtları temizle
    records = records.filter(r => now - r.time < DUPLICATE_WINDOW_MS);
    const isDuplicate = records.some(r => r.ip === ip);
    records.push({ ip, time: now });
    localStorage.setItem(key, JSON.stringify(records));
    return isDuplicate;
  } catch { return false; }
}


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

// ===== TELEFON FORMATLAMA =====
function initPhoneFormat() {
  const phone = document.getElementById('input-phone') || document.querySelector('input[name="phone"]');
  if (!phone) return;

  phone.addEventListener('input', (e) => {
    let raw = e.target.value;
    let digits = raw.replace(/\D/g, '');

    // Kullanıcı tamamen sildiyse boş bırak (placeholder görünsün)
    if (digits.length === 0) {
      e.target.value = '';
      return;
    }

    // Ülke kodu ve başlangıç temizliği (+90, 0090, 090, 90, 9, 0)
    // 0 veya 9 ile başlayıp 5 girildiğinde doğrudan 5'ten başlat
    if (digits.startsWith('0090')) {
      digits = digits.slice(4);
    } else if (digits.startsWith('090')) {
      digits = digits.slice(3);
    } else if (digits.startsWith('90')) {
      digits = digits.slice(2);
    } else if (digits.startsWith('9')) {
      digits = digits.slice(1);
    }

    // Başındaki fazla sıfırları temizle
    while (digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    // Sadece 0 veya 9 basıldıysa (henüz 5 veya numara devamı girilmediyse)
    if (digits.length === 0) {
      e.target.value = '0';
      return;
    }

    // Türkiye cep numaraları 5 ile başlar, başına 0 ekle
    digits = '0' + digits;

    if (digits.length > 11) digits = digits.slice(0, 11);

    // Format: 0 (5XX) XXX XX XX
    let formatted = '0';
    if (digits.length > 1) {
      formatted += ' (' + digits.slice(1, Math.min(4, digits.length));
    }
    if (digits.length >= 4) {
      formatted += ') ' + digits.slice(4, Math.min(7, digits.length));
    }
    if (digits.length >= 7) {
      formatted += ' ' + digits.slice(7, Math.min(9, digits.length));
    }
    if (digits.length >= 9) {
      formatted += ' ' + digits.slice(9, Math.min(11, digits.length));
    }

    e.target.value = formatted;
  });

  // Backspace basıldığında sadece 0 veya parantez kaldığında temizle
  phone.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') {
      const val = phone.value.trim();
      if (val === '0 (' || val === '0' || val === '0 ()') {
        phone.value = '';
      }
    }
  });
}

// ===== FORM HANDLING =====
function initForm() {
  const form = document.getElementById('order-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // ===== HONEYPOT BOT KONTROLÜ =====
    const honeypot = form.querySelector('#input-website');
    if (honeypot && honeypot.value) {
      // Bot tespit edildi — sessizce sahte başarı göster
      window.location.href = 'thankyou.html';
      return;
    }

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

    let phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.startsWith('0090')) phoneDigits = phoneDigits.slice(4);
    else if (phoneDigits.startsWith('090')) phoneDigits = phoneDigits.slice(3);
    else if (phoneDigits.startsWith('90')) phoneDigits = phoneDigits.slice(2);
    else if (phoneDigits.startsWith('9')) phoneDigits = phoneDigits.slice(1);

    while (phoneDigits.startsWith('0')) phoneDigits = phoneDigits.slice(1);
    if (phoneDigits.startsWith('5')) phoneDigits = '0' + phoneDigits;

    const isValidPhone = phoneDigits.startsWith('05') && phoneDigits.length === 11;
    if (!isValidPhone) {
      showMessage(messageEl, 'error', '⚠️ Lütfen geçerli bir cep telefonu numarası giriniz (05XX...).');
      return;
    }

    const cleanFormattedPhone = `0 (${phoneDigits.slice(1, 4)}) ${phoneDigits.slice(4, 7)} ${phoneDigits.slice(7, 9)} ${phoneDigits.slice(9, 11)}`;

    submitBtn.disabled = true;
    spinner.style.display = 'inline-block';
    btnText.textContent = 'Gönderiliyor...';

    // Mükerrer sipariş tespiti
    const duplicate = isDuplicateOrder(visitorIP);

    const orderData = {
      name,
      phone: cleanFormattedPhone,
      city,
      district,
      address,
      quantity: pkg.qty,
      totalPrice: `₺${pkg.price.toLocaleString('tr-TR')}`,
      package: pkg.label,
      date: new Date().toLocaleString('tr-TR'),
      product: 'LED Matrix Panel 12×60cm',
      ip: visitorIP,
      isDuplicate: duplicate
    };

    try {
      // Dönüşüm işareti: teşekkürler sayfası sadece bunu görürse Google/Meta'ya satış bildirir
      try {
        sessionStorage.setItem('pending_conversion', JSON.stringify({
          value: pkg.price,
          tid: 'ORD-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)
        }));
      } catch (e) {}

      if (!GOOGLE_SCRIPT_URL) {
        await new Promise(resolve => setTimeout(resolve, 500));
        window.location.href = 'thankyou.html';
      } else {
        // Send to Google Sheets with keepalive
        fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
          keepalive: true
        });
        
        // Wait a tiny 300ms for browser to initialize transmission, then redirect
        await new Promise(resolve => setTimeout(resolve, 300));
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

// ===== HERO SLIDER =====
function initHeroSlider() {
  const imgs = document.querySelectorAll('.hero-slider__img');
  const dots = document.querySelectorAll('.hero-slider__dot');
  if (imgs.length < 2) return;

  let current = 0;
  const total = imgs.length;

  function goTo(index) {
    imgs[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = index % total;
    imgs[current].classList.add('active');
    dots[current].classList.add('active');
  }

  // Auto-rotate every 3 seconds
  let timer = setInterval(() => goTo(current + 1), 3000);

  // Clicking a dot
  dots.forEach((dot, i) => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      clearInterval(timer);
      goTo(i);
      timer = setInterval(() => goTo(current + 1), 3000);
    });
  });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  const carouselEl = document.querySelector('.carousel');
  if (carouselEl) new Carousel(carouselEl);

  initHeroSlider();
  initPhoneFormat();
  initPackageSelection();
  initDistricts();
  initForm();
  initReveal();
  initStickyCTA();
  initGlobalClickRedirect();
});
