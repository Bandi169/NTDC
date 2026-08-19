(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  let countdownInterval;

  function formatDate(value, options) {
    return new Intl.DateTimeFormat('en-NG', options).format(new Date(value));
  }

  function renderSermons(sermons) {
    const grid = $('#sermon-grid');
    const status = $('#sermon-status');
    if (!grid || !status) return;

    if (!Array.isArray(sermons) || sermons.length === 0) {
      status.textContent = 'No sermons are available right now. Please check back soon.';
      return;
    }

    grid.replaceChildren();
    sermons.forEach((sermon) => {
      const card = document.createElement('article');
      card.className = 'sermon-card';

      const videoFrame = document.createElement('div');
      videoFrame.className = 'video-frame';
      const iframe = document.createElement('iframe');
      iframe.src = sermon.youtubeEmbedUrl;
      iframe.title = `${sermon.title} by ${sermon.speaker}`;
      iframe.loading = 'lazy';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      videoFrame.append(iframe);

      const body = document.createElement('div');
      body.className = 'sermon-card-body';
      const category = document.createElement('span');
      category.className = 'sermon-category';
      category.textContent = sermon.category;
      const title = document.createElement('h3');
      title.textContent = sermon.title;
      const byline = document.createElement('div');
      byline.className = 'sermon-byline';
      const speaker = document.createElement('span');
      speaker.textContent = sermon.speaker;
      const date = document.createElement('time');
      date.dateTime = sermon.date;
      date.textContent = formatDate(sermon.date, { day: '2-digit', month: 'short', year: 'numeric' });
      byline.append(speaker, date);
      body.append(category, title, byline);
      card.append(videoFrame, body);
      grid.append(card);
    });
    status.hidden = true;
  }

  async function loadSermons() {
    try {
      const response = await fetch('sermons.json');
      if (!response.ok) throw new Error('Sermon data could not be loaded.');
      renderSermons(await response.json());
    } catch (error) {
      const status = $('#sermon-status');
      if (status) status.textContent = 'We could not load the sermon library. Please refresh and try again.';
      console.error(error);
    }
  }

  function renderEvent(event) {
    const date = new Date(event.date);
    const item = document.createElement('article');
    item.className = 'event-item';

    const dateBlock = document.createElement('div');
    dateBlock.className = 'event-date-block';
    const day = document.createElement('strong');
    day.textContent = formatDate(event.date, { day: '2-digit' });
    const month = document.createElement('span');
    month.textContent = formatDate(event.date, { month: 'short' });
    dateBlock.append(day, month);

    const body = document.createElement('div');
    body.className = 'event-item-body';
    const title = document.createElement('h3');
    title.textContent = event.title;
    const description = document.createElement('p');
    description.textContent = event.description;
    const meta = document.createElement('div');
    meta.className = 'event-meta';
    const time = document.createElement('span');
    time.textContent = event.time;
    const location = document.createElement('span');
    location.textContent = event.location;
    meta.append(time, location);
    body.append(title, description, meta);
    item.append(dateBlock, body);
    return item;
  }

  function updateCountdown(event) {
    const target = new Date(event.date).getTime();
    const now = Date.now();
    const remaining = Math.max(0, target - now);
    const day = Math.floor(remaining / 86400000);
    const hour = Math.floor((remaining % 86400000) / 3600000);
    const minute = Math.floor((remaining % 3600000) / 60000);
    const second = Math.floor((remaining % 60000) / 1000);
    const values = { '#count-days': day, '#count-hours': hour, '#count-minutes': minute, '#count-seconds': second };
    Object.entries(values).forEach(([selector, value]) => {
      const element = $(selector);
      if (element) element.textContent = String(value).padStart(2, '0');
    });
    if (remaining <= 0 && countdownInterval) {
      clearInterval(countdownInterval);
    }
  }

  function setCountdown(event) {
    const title = $('#countdown-title');
    const description = $('#countdown-description');
    const date = $('#countdown-date');
    if (!title || !description || !date) return;
    title.textContent = event.title;
    description.textContent = event.description;
    date.textContent = `${formatDate(event.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${event.time}`;
    updateCountdown(event);
    countdownInterval = window.setInterval(() => updateCountdown(event), 1000);
  }

  async function loadEvents() {
    try {
      const response = await fetch('events.json');
      if (!response.ok) throw new Error('Event data could not be loaded.');
      const events = await response.json();
      const upcoming = events.filter((event) => new Date(event.date).getTime() > Date.now()).sort((a, b) => new Date(a.date) - new Date(b.date));
      const eventList = $('#event-list');
      if (!eventList) return;
      eventList.replaceChildren();
      if (!upcoming.length) {
        eventList.innerHTML = '<p class="loading-state">There are no upcoming events listed yet. Please check back soon.</p>';
        return;
      }
      setCountdown(upcoming[0]);
      upcoming.slice(0, 3).forEach((event) => eventList.append(renderEvent(event)));
    } catch (error) {
      const eventList = $('#event-list');
      if (eventList) eventList.innerHTML = '<p class="loading-state">We could not load the event calendar. Please refresh and try again.</p>';
      console.error(error);
    }
  }

  function setupNavigation() {
    const menuToggle = $('.menu-toggle');
    const nav = $('#site-nav');
    if (menuToggle && nav) {
      menuToggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('is-open');
        menuToggle.setAttribute('aria-expanded', String(isOpen));
      });
      nav.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
          const target = document.querySelector(link.getAttribute('href'));
          if (!target) return;
          event.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          nav.classList.remove('is-open');
          menuToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    const sections = document.querySelectorAll('main section[id]');
    const links = document.querySelectorAll('.site-nav a[href^="#"]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach((section) => observer.observe(section));
  }

  function setupPrayerForm() {
    const form = $('#prayer-form');
    const success = $('#form-success');
    const errorMessage = $('#form-error');
    const submitButton = form?.querySelector('[type="submit"]');
    if (!form || !success || !errorMessage || !submitButton) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      success.hidden = true;
      errorMessage.hidden = true;
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');

      try {
        const response = await fetch(form.action, {
          method: form.method,
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });

        if (!response.ok) throw new Error('Formspree rejected the submission.');

        form.reset();
        success.hidden = false;
        success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (error) {
        console.error(error);
        errorMessage.hidden = false;
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } finally {
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const year = $('#current-year');
    if (year) year.textContent = new Date().getFullYear();
    setupNavigation();
    setupPrayerForm();
    loadSermons();
    loadEvents();
  });
})();