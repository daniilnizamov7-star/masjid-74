/**
 * 🕌 Prayer Times Module
 * Загружает расписание с GitHub (Namaz Chelyabinsk)
 */

const PrayerTimes = {
  // 🔗 Raw-ссылка на твой prayer-data.json
  apiUrl: 'https://raw.githubusercontent.com/daniilnizamov7-star/Namaz/main/api/prayer-data.json',
  
  // Ключи для localStorage
  cacheKey: 'prayer_cache_v1',

  /**
   * Найти данные на сегодня
   */
  getToday(data) {
    const today = new Date();
    const currentDay = today.getDate();
    
    // Ищем день в расписании (d: 1, 2, 3...)
    const entry = data.schedule?.find(item => item.d === currentDay);
    
    if (entry) {
      console.log(`✅ Найдено расписание на ${currentDay} ${data.monthName?.trim()}`);
      return entry;
    }
    
    // Если не нашли — берём первый день
    console.warn('⚠️ День не найден, используем первый день месяца');
    return data.schedule?.[0];
  },

  /**
   * Обновить интерфейс
   */
  renderUI(times) {
    if (!times) return;
    
    const elements = {
      'fajr-time': times.fajr?.trim(),
      'dhuhr-time': times.dhuhr?.trim(),
      'asr-time': times.asr?.trim(),
      'maghrib-time': times.maghrib?.trim(),
      'isha-time': times.isha?.trim()
    };

    for (const [id, time] of Object.entries(elements)) {
      const el = document.getElementById(id);
      if (el && time) {
        // Плавное обновление
        el.style.transition = 'opacity 0.2s';
        el.style.opacity = '0';
        setTimeout(() => {
          el.textContent = time;
          el.style.opacity = '1';
        }, 100);
      }
    }
    
    // Подсветка следующего намаза
    this.highlightNext(times);
  },

  /**
   * Подсветить ближайший намаз
   */
  highlightNext(times) {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    
    const prayers = [
      { id: 'fajr-time', time: times.fajr?.trim() },
      { id: 'dhuhr-time', time: times.dhuhr?.trim() },
      { id: 'asr-time', time: times.asr?.trim() },
      { id: 'maghrib-time', time: times.maghrib?.trim() },
      { id: 'isha-time', time: times.isha?.trim() }
    ];

    // Убираем старую подсветку
    document.querySelectorAll('.prayer-time').forEach(el => {
      el.classList.remove('next-prayer');
    });

    // Находим следующий
    for (const p of prayers) {
      if (!p.time) continue;
      const [h, m] = p.time.split(':').map(Number);
      const prayerMinutes = h * 60 + m;
      
      if (prayerMinutes > nowMinutes) {
        const el = document.getElementById(p.id);
        if (el) el.classList.add('next-prayer');
        break;
      }
    }
  },

  /**
   * Загрузить и показать расписание
   */
  async init() {
    try {
      // Загружаем с ?t=... чтобы браузер не кэшировал
      const response = await fetch(this.apiUrl + '?t=' + Date.now());
      if (!response.ok) throw new Error('HTTP ' + response.status);
      
      const data = await response.json();
      const today = this.getToday(data);
      
      if (today) {
        // Кэшируем
        localStorage.setItem(this.cacheKey, JSON.stringify({
          date: new Date().toDateString(),
          data: today
        }));
        
        // Обновляем UI
        this.renderUI(today);
      }
      
    } catch (error) {
      console.error('❌ Ошибка загрузки расписания:', error);
      
      // Пробуем загрузить из кэша
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        const { date, data } = JSON.parse(cached);
        if (date === new Date().toDateString()) {
          console.log('✅ Загружено из кэша');
          this.renderUI(data);
          return;
        }
      }
      
      // Запасные данные
      console.warn('⚠️ Используем запасное расписание');
      this.renderUI({
        fajr: '04:05',
        dhuhr: '13:20',
        asr: '18:24',
        maghrib: '20:04',
        isha: '21:44'
      });
    }
  }
};

// Автозапуск
document.addEventListener('DOMContentLoaded', () => {
  PrayerTimes.init();
});
