const CACHE_NAME = 'site-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/food.js',
  '/Images/Misc/cloche.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

/* ========== js/food.js ========== */

document.addEventListener('DOMContentLoaded', async () => {
  const foodGrids = {
    Main:      document.getElementById('main-grid'),
    Side:      document.getElementById('side-grid'),
    Dessert:   document.getElementById('dessert-grid'),
    Snack:     document.getElementById('snack-grid'),
    Drink:     document.getElementById('drink-grid'),
    Condiment: document.getElementById('condiment-grid'),
  };

  const eatenItems = new Set(JSON.parse(localStorage.getItem('eatenItems')) || []);
  const foodLink = document.querySelector('.navbar-links a[href$="food.html"]');

  function checkAllFood() {
    const allItems = Object.values(foodGrids).flatMap(grid => grid ? Array.from(grid.querySelectorAll('.grid-item')) : []);
    const allDone = allItems.length > 0 && allItems.every(item => {
      const name = item.querySelector('img.food-img').src.split('/').pop();
      return eatenItems.has(name);
    });
    localStorage.setItem('foodAllDone', allDone);
    if (foodLink) foodLink.classList.toggle('completed', allDone);
  }

  let counter = 1;

  async function loadFoodImages(category, grid) {
    if (!grid) return;
    try {
      const res = await fetch(`/images?folder=Food/${category}`);
      if (!res.ok) throw new Error(`Failed to fetch images for ${category}`);
      const images = await res.json();

      images.forEach(src => {
        const name = src.split('/').pop();
        const item = document.createElement('div');
        item.className = 'grid-item';
        let animating = false;
        let collected = eatenItems.has(name);

        const img = document.createElement('img');
        img.src = src;
        img.alt = `${category} ${counter}`;
        img.classList.add('food-img');
        img.style.cursor = 'pointer';

        const num = document.createElement('span');
        num.className = 'number';
        num.textContent = `${counter}`.padStart(2, '0');

        item.append(img, num);
        grid.appendChild(item);

        // If already collected, show overlay in rotated state
        if (collected) {
          const staticOverlay = document.createElement('img');
          staticOverlay.src = '/Images/Misc/cloche.png';
          staticOverlay.className = 'cloche-overlay visible rotate';
          item.appendChild(staticOverlay);
        }

        item.addEventListener('click', () => {
          if (animating) return;
          animating = true;
          const existing = item.querySelector('.cloche-overlay');

          if (collected && existing) {
            // Un-collect: rotate back, then lift
            existing.classList.remove('rotate');
            existing.addEventListener('transitionend', () => {
              existing.classList.remove('visible');
              existing.addEventListener('transitionend', () => {
                existing.remove();
                animating = false;
              }, { once: true });
            }, { once: true });

            collected = false;
            eatenItems.delete(name);
            localStorage.setItem('eatenItems', JSON.stringify([...eatenItems]));
            checkAllFood();

          } else {
            // Collect: create overlay, drop, then rotate
            const overlay = document.createElement('img');
            overlay.src = '/Images/Misc/cloche.png';
            overlay.className = 'cloche-overlay';
            item.appendChild(overlay);

            // Drop
            requestAnimationFrame(() => {
              overlay.classList.add('visible');
            });

            // After drop transition, rotate
            overlay.addEventListener('transitionend', () => {
              overlay.classList.add('rotate');
              overlay.addEventListener('transitionend', () => {
                animating = false;
                collected = true;
                eatenItems.add(name);
                localStorage.setItem('eatenItems', JSON.stringify([...eatenItems]));
                checkAllFood();
              }, { once: true });
            }, { once: true });
          }
        });
        counter++;
      });
    } catch (err) {
      console.error(`Error loading ${category}:`, err);
    }
  }

  for (const cat in foodGrids) {
    await loadFoodImages(cat, foodGrids[cat]);
  }
  checkAllFood();
});
