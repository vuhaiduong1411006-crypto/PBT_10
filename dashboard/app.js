// ─── APIs ────────────────────────────────────────────────
const APIS = {
  weather:
    "https://api.open-meteo.com/v1/forecast?latitude=21.03&longitude=105.85&current_weather=true&hourly=relativehumidity_2m,apparent_temperature&timezone=Asia/Bangkok",
  country: "https://restcountries.com/v3.1/name/vietnam?fullText=true",
  users: "https://randomuser.me/api/?results=5",
  posts: "https://jsonplaceholder.typicode.com/posts?_limit=4",
  dogs: "https://dog.ceo/api/breeds/image/random/5",
};

// ─── Helpers ─────────────────────────────────────────────
function get(json) {
  return fetch(json).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });
}

function setBody(id, html) {
  document.getElementById(id).innerHTML = html;
}

function showSkeleton(id, lines = 3) {
  setBody(
    id,
    Array(lines)
      .fill(0)
      .map((_, i) => `<div class="skeleton-line${i === lines - 1 ? " short" : ""}"></div>`)
      .join(""),
  );
}

function showWidgetError(id, msg) {
  setBody(id, `<div class="widget-error">❌ ${msg}</div>`);
}

// ─── Renderers ───────────────────────────────────────────
function renderWeather(data) {
  const cw = data.current_weather;
  const hour = new Date().getHours();
  const humidity = data.hourly.relativehumidity_2m[hour];
  const feelsLike = data.hourly.apparent_temperature[hour];
  const icon = getWeatherIcon(cw.weathercode);

  setBody(
    "body-weather",
    `
    <div class="weather-temp">${icon} ${cw.temperature}°C</div>
    <div class="weather-detail">Cảm giác như: ${feelsLike}°C</div>
    <div class="weather-detail">Độ ẩm: ${humidity}%</div>
    <div class="weather-detail">Gió: ${cw.windspeed} km/h</div>
  `,
  );
}

function renderCountry(data) {
  const c = data[0];
  const pop = Number(c.population).toLocaleString("vi-VN");
  const area = Number(c.area).toLocaleString("vi-VN");
  const capital = c.capital?.[0] || "—";
  const currency = Object.values(c.currencies || {})[0];

  setBody(
    "body-country",
    `
    <div class="country-row"><span class="country-label">Thủ đô</span>${capital}</div>
    <div class="country-row"><span class="country-label">Dân số</span>${pop}</div>
    <div class="country-row"><span class="country-label">Diện tích</span>${area} km²</div>
    <div class="country-row"><span class="country-label">Tiền tệ</span>${currency?.name || "—"} (${currency?.symbol || "—"})</div>
    <div class="country-row"><span class="country-label">Vùng</span>${c.subregion || c.region}</div>
  `,
  );
}

function renderUsers(data) {
  const users = data.results;
  setBody(
    "body-users",
    users
      .map(
        (u) => `
    <div class="user-row">
      <img class="user-avatar" src="${u.picture.thumbnail}" alt="${u.name.first}" />
      <div>
        <div class="user-name">${u.name.first} ${u.name.last}</div>
        <div class="user-email">${u.email}</div>
      </div>
    </div>
  `,
      )
      .join(""),
  );
}

function renderPosts(data) {
  setBody(
    "body-posts",
    data
      .map(
        (p) => `
    <div class="post-item">
      <div class="post-title">${p.title}</div>
    </div>
  `,
      )
      .join(""),
  );
}

function renderDogs(data) {
  setBody(
    "body-dogs",
    `
    <div class="dog-grid">
      ${data.message.map((url) => `<img src="${url}" alt="dog" />`).join("")}
    </div>
  `,
  );
}

// ─── Weather icon ─────────────────────────────────────────
function getWeatherIcon(code) {
  if (code === 0) return "☀️";
  if (code <= 2) return "⛅";
  if (code === 3) return "☁️";
  if (code <= 49) return "🌫️";
  if (code <= 59) return "🌦️";
  if (code <= 69) return "🌧️";
  if (code <= 79) return "❄️";
  if (code <= 82) return "🌧️";
  if (code <= 99) return "⛈️";
  return "🌤️";
}

// ─── Load Dashboard ──────────────────────────────────────
async function loadDashboard() {
  const btn = document.getElementById("refresh-btn");
  btn.disabled = true;
  document.getElementById("load-time").textContent = "";

  // Show skeletons
  showSkeleton("body-weather", 3);
  showSkeleton("body-country", 4);
  showSkeleton("body-users", 3);
  showSkeleton("body-posts", 4);
  showSkeleton("body-dogs", 1);

  const startTime = Date.now();

  // Gọi song song 5 APIs
  const results = await Promise.allSettled([get(APIS.weather), get(APIS.country), get(APIS.users), get(APIS.posts), get(APIS.dogs)]);

  const elapsed = Date.now() - startTime;

  // Xử lý từng kết quả độc lập
  const handlers = [
    { id: "body-weather", render: renderWeather },
    { id: "body-country", render: renderCountry },
    { id: "body-users", render: renderUsers },
    { id: "body-posts", render: renderPosts },
    { id: "body-dogs", render: renderDogs },
  ];

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      handlers[i].render(result.value);
    } else {
      showWidgetError(handlers[i].id, "Không tải được dữ liệu");
      console.error(`Widget ${i} failed:`, result.reason);
    }
  });

  document.getElementById("load-time").textContent = `Loaded in ${elapsed}ms`;
  btn.disabled = false;
}

// ─── Refresh ─────────────────────────────────────────────
document.getElementById("refresh-btn").addEventListener("click", loadDashboard);

// ─── Start ───────────────────────────────────────────────
loadDashboard();
