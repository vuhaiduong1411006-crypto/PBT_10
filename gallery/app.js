// ─── State ───────────────────────────────────────────────
let currentPage = 1;
const LIMIT = 20;
let isLoading = false;
let hasMore = true;

// ─── API ─────────────────────────────────────────────────
async function fetchPhotos(page) {
  const url = `https://picsum.photos/v2/list?page=${page}&limit=${LIMIT}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Render ──────────────────────────────────────────────
function renderSkeletons(count) {
  const grid = document.getElementById("grid");
  for (let i = 0; i < count; i++) {
    const div = document.createElement("div");
    div.className = "skeleton";
    grid.appendChild(div);
  }
}

function removeSkeletons() {
  document.querySelectorAll(".skeleton").forEach((el) => el.remove());
}

function renderPhotos(photos) {
  const grid = document.getElementById("grid");

  photos.forEach((photo) => {
    const card = document.createElement("div");
    card.className = "photo-card";

    const img = document.createElement("img");
    img.alt = photo.title;

    // Lazy loading: dùng IntersectionObserver
    img.dataset.src = `https://picsum.photos/id/${photo.id}/300/300`;

    lazyObserver.observe(img);

    // Click → lightbox
    card.addEventListener("click", () => openLightbox(photo));
    card.appendChild(img);
    grid.appendChild(card);
  });
}

// ─── Lazy Loading (IntersectionObserver) ─────────────────
const lazyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.onload = () => img.classList.add("loaded");
        lazyObserver.unobserve(img);
      }
    });
  },
  { rootMargin: "100px" },
);

// ─── Load More ───────────────────────────────────────────
async function loadMorePhotos() {
  if (isLoading || !hasMore) return;
  isLoading = true;

  document.getElementById("loading-more").style.display = "block";
  renderSkeletons(LIMIT);

  try {
    const photos = await fetchPhotos(currentPage);

    removeSkeletons();

    if (photos.length === 0) {
      hasMore = false;
      document.getElementById("loading-more").textContent = "Đã tải hết ảnh.";
      return;
    }

    renderPhotos(photos);
    currentPage++;
  } catch (error) {
    removeSkeletons();
    document.getElementById("loading-more").textContent = "Lỗi tải ảnh, thử lại sau.";
  } finally {
    isLoading = false;
    if (hasMore) document.getElementById("loading-more").style.display = "none";
  }
}

// ─── Infinite Scroll (IntersectionObserver) ──────────────
const scrollObserver = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      loadMorePhotos();
    }
  },
  { rootMargin: "200px" },
);

scrollObserver.observe(document.getElementById("load-trigger"));

// ─── Lightbox ────────────────────────────────────────────
function openLightbox(photo) {
  document.getElementById("lightbox-img").src = photo.download_url;
  document.getElementById("lightbox-title").textContent = `Photo by ${photo.author}`;
  document.getElementById("lightbox").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  document.getElementById("lightbox").style.display = "none";
  document.getElementById("lightbox-img").src = "";
  document.body.style.overflow = "";
}

document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
document.getElementById("lightbox-overlay").addEventListener("click", closeLightbox);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

// ─── Start ───────────────────────────────────────────────
loadMorePhotos();
