const HISTORY_KEY = "weather_history";

document.getElementById("search-btn").addEventListener("click", handleSearch);
document.getElementById("city-input").addEventListener("keydown", function (e) {
  if (e.key === "Enter") handleSearch();
});

renderHistory();

function handleSearch() {
  const city = document.getElementById("city-input").value.trim();
  if (!city) return;
  fetchWeather(city);
}

async function fetchWeather(city) {
  showLoading();

  try {
    // Bước 1: Geocoding — tìm tọa độ từ tên thành phố
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=vi`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    // Nếu không có kết quả → thành phố không tồn tại
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error(`Không tìm thấy thành phố "${city}"`);
    }

    const place = geoData.results[0];
    const { latitude, longitude, name, country } = place;

    // Bước 2: Lấy thời tiết từ tọa độ
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    const current = weatherData.current_weather;
    const temp = current.temperature;
    const windspeed = current.windspeed;
    // Lấy độ ẩm giờ hiện tại
    const currentHour = new Date().getHours();
    const humidity = weatherData.hourly.relativehumidity_2m[currentHour];
    const desc = getWeatherDesc(current.weathercode);
    const icon = getWeatherIcon(current.weathercode);

    showSuccess({ cityName: name, country, temp, humidity, windspeed, desc, icon });
    saveHistory(city);
  } catch (error) {
    if (error instanceof TypeError) {
      showError("Mất kết nối mạng, vui lòng thử lại");
    } else {
      showError(error.message);
    }
  }
}

function showLoading() {
  document.getElementById("result").innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <span>Đang tải...</span>
    </div>
  `;
}

function showSuccess({ cityName, country, temp, humidity, windspeed, desc, icon }) {
  document.getElementById("result").innerHTML = `
    <div class="weather-card">
      <div class="weather-icon">${icon}</div>
      <div class="weather-city">${cityName}, ${country}</div>
      <div class="weather-temp">${temp}°C</div>
      <div class="weather-desc">${desc}</div>
      <div class="weather-humidity">Độ ẩm: ${humidity}%</div>
      <div class="weather-humidity">Gió: ${windspeed} km/h</div>
    </div>
  `;
}

function showError(msg) {
  document.getElementById("result").innerHTML = `
    <div class="error-box">❌ ${msg}</div>
  `;
}

// WMO weather code → mô tả
function getWeatherDesc(code) {
  if (code === 0) return "Trời quang";
  if (code <= 2) return "Ít mây";
  if (code === 3) return "Nhiều mây";
  if (code <= 49) return "Sương mù";
  if (code <= 59) return "Mưa phùn";
  if (code <= 69) return "Mưa";
  if (code <= 79) return "Tuyết";
  if (code <= 82) return "Mưa rào";
  if (code <= 99) return "Dông bão";
  return "Không xác định";
}

// WMO weather code → icon
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

function saveHistory(city) {
  let history = getHistory();
  history = history.filter((c) => c.toLowerCase() !== city.toLowerCase());
  history.unshift(city);
  if (history.length > 5) history = history.slice(0, 5);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function renderHistory() {
  const history = getHistory();
  const section = document.getElementById("history-section");
  const list = document.getElementById("history-list");

  if (history.length === 0) {
    section.style.display = "none";
    return;
  }

  section.style.display = "block";
  list.innerHTML = history
    .map(
      (city) => `
    <button class="history-btn" onclick="searchFromHistory('${city}')">${city}</button>
  `,
    )
    .join("");
}

function searchFromHistory(city) {
  document.getElementById("city-input").value = city;
  fetchWeather(city);
}
