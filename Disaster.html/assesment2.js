document.addEventListener("DOMContentLoaded", () => {
  const KEY = "reliefconnect_demo_data_v1";
  const initial = {
    donations: [],
    volunteers: [],
    messages: []
  };

  const readData = () => {
    try {
      return { ...initial, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
    } catch {
      return { ...initial };
    }
  };

  const saveData = data => localStorage.setItem(KEY, JSON.stringify(data));
  const money = n => "$" + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const data = readData();
  const page = document.body.dataset.page || "home";

  const toggle = $(".menu-toggle"), nav = $(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  const DEMO_RAISED = 85000, GOAL = 100000;
  const liveRaised = DEMO_RAISED + data.donations.reduce((sum, d) => sum + Number(d.amount), 0);
  
  $$("[data-raised]").forEach(el => el.textContent = money(liveRaised));
  $$("[data-goal]").forEach(el => el.textContent = money(GOAL));
  $$("[data-progress]").forEach(el => el.style.width = Math.min(100, liveRaised / GOAL * 100) + "%");
  $$("[data-donation-count]").forEach(el => el.textContent = data.donations.length);
  $$("[data-volunteer-count]").forEach(el => el.textContent = data.volunteers.length);
  $$("[data-total-donations]").forEach(el => el.textContent = money(data.donations.reduce((s, d) => s + Number(d.amount), 0)));

  const donationForm = $("#donation-form");
  if (donationForm) {
    let selectedAmount = 0;
    const amountInput = $("#custom-amount");
    const nameInput = $("#donor-name");
    const presetBtns = $$(".preset-btn");

    presetBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        presetBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedAmount = Number(btn.dataset.amount);
        if (amountInput) amountInput.value = "";
      });
    });

    amountInput?.addEventListener("input", () => {
      presetBtns.forEach(b => b.classList.remove("active"));
      selectedAmount = Number(amountInput.value);
    });

    donationForm.addEventListener("submit", e => {
      e.preventDefault();
      const amount = Number(selectedAmount);
      if (!Number.isFinite(amount) || amount <= 0) return showToast("Please enter a valid donation amount.");
      const donor = nameInput?.value.trim() || "Anonymous";
      const current = readData();
      current.donations.push({ name: donor, amount, time: new Date().toISOString(), id: Date.now() });
      saveData(current);
      showModal(amount, donor);
      donationForm.reset();
      selectedAmount = 0;
      presetBtns.forEach(b => b.classList.remove("active"));
      renderDonations();
      updateStats();
    });
  }

  function showModal(amount, donor) {
    const modal = $("#success-modal");
    if (!modal) return showToast("Demo donation recorded locally.");
    const amountEl = $("#modal-amount"), donorEl = $("#modal-donor");
    if (amountEl) amountEl.textContent = money(amount);
    if (donorEl) donorEl.textContent = donor;
    modal.classList.remove("hidden");
  }

  const closeModal = () => $("#success-modal")?.classList.add("hidden");
  $("#close-modal-btn")?.addEventListener("click", closeModal);
  $("#success-modal")?.addEventListener("click", e => {
    if (e.target.id === "success-modal") closeModal();
  });

  function renderDonations() {
    const list = $("#history-list");
    if (!list) return;
    const items = readData().donations.slice().reverse();
    const empty = $("#history-empty");
    if (empty) empty.hidden = items.length > 0;
    list.innerHTML = "";
    items.forEach(d => {
      const li = document.createElement("li");
      const left = document.createElement("span");
      const right = document.createElement("strong");
      left.textContent = `${d.name} · ${new Date(d.time).toLocaleString()}`;
      right.textContent = money(d.amount);
      li.className = "row-between";
      li.style.cssText = "padding:12px 0;border-bottom:1px solid var(--line);gap:12px";
      li.append(left, right);
      list.append(li);
    });

    const supporters = $("#supporter-list");
    if (supporters) {
      supporters.innerHTML = "";
      items.slice(0, 5).forEach(d => {
        const span = document.createElement("span");
        span.className = "badge";
        span.textContent = `${d.name} · ${money(d.amount)}`;
        supporters.append(span);
      });
      if (!items.length) supporters.textContent = "No demo donations recorded yet.";
    }
  }

  function updateStats() {
    const d = readData();
    const total = d.donations.reduce((s, x) => s + Number(x.amount), 0);
    $$("[data-raised]").forEach(el => el.textContent = money(DEMO_RAISED + total));
    $$("[data-total-donations]").forEach(el => el.textContent = money(total));
    $$("[data-donation-count]").forEach(el => el.textContent = d.donations.length);
    $$("[data-volunteer-count]").forEach(el => el.textContent = d.volunteers.length);
    $$("[data-progress]").forEach(el => el.style.width = Math.min(100, (DEMO_RAISED + total) / GOAL * 100) + "%");
  }

  renderDonations();

  const volunteerForm = $("#volunteer-form");
  volunteerForm?.addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(volunteerForm);
    const entry = Object.fromEntries(fd.entries());
    if (!entry.name || !entry.email || !entry.skill) return showToast("Please complete the required fields.");
    const d = readData();
    d.volunteers.push({ ...entry, time: new Date().toISOString() });
    saveData(d);
    volunteerForm.reset();
    showToast("Volunteer registration saved in this browser (demo).");
    updateStats();
  });

  const contactForm = $("#contact-form");
  contactForm?.addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(contactForm), entry = Object.fromEntries(fd.entries());
    const d = readData();
    d.messages.push({ ...entry, time: new Date().toISOString() });
    saveData(d);
    contactForm.reset();
    showToast("Your demo message has been saved locally.");
  });

  const dashboardList = $("#dashboard-donations");
  if (dashboardList) {
    const items = readData().donations.slice().reverse().slice(0, 8);
    dashboardList.innerHTML = "";
    if (!items.length) dashboardList.innerHTML = '<tr><td colspan="3" class="muted">No user-submitted demo donations yet.</td></tr>';
    items.forEach(d => {
      const tr = document.createElement("tr");
      [d.name, new Date(d.time).toLocaleDateString(), money(d.amount)].forEach(v => {
        const td = document.createElement("td");
        td.textContent = v;
        tr.append(td);
      });
      dashboardList.append(tr);
    });
  }

  const chart = $("#donation-chart");
  if (chart) {
    const vals = [12, 18, 14, 24, 31, 27, 38];
    chart.innerHTML = "";
    vals.forEach((v, i) => {
      const col = document.createElement("div");
      col.className = "bar-col";
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.height = v * 3 + "px";
      const label = document.createElement("small");
      label.textContent = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i];
      col.append(bar, label);
      chart.append(col);
    });
  }

  function showToast(message) {
    let toast = $("#toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast";
      document.body.append(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3200);
  }
});