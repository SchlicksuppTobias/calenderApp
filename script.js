const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

let now = new Date();
let viewYear = now.getFullYear();
let viewMonth = now.getMonth();
let events = {}; // key: "YYYY-MM-DD" -> [{text, color}]
let activeDay = null;
let selectedColor = 'default';

const YEAR_RANGE = 50;

function dateKey(y, m, d) {
    return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function initDropdowns() {
    const mSel = document.getElementById('month-select');
    MONTHS.forEach((name, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = name;
        mSel.appendChild(opt);
    });
    const ySel = document.getElementById('year-select');
    const base = now.getFullYear();
    for (let y = base - YEAR_RANGE; y <= base + YEAR_RANGE; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        ySel.appendChild(opt);
    }
}

function syncDropdowns() {
    document.getElementById('month-select').value = viewMonth;
    document.getElementById('year-select').value = viewYear;
}

function onMonthChange(val) { viewMonth = parseInt(val); render(); }
function onYearChange(val)  { viewYear = parseInt(val);  render(); }

function render() {
    syncDropdowns();

    const container = document.getElementById('days');
    container.innerHTML = '';

    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);

    // Monday-first: 0=Mon..6=Sun
    let startDow = (firstDay.getDay() + 6) % 7;

    // Cells from previous month
    const prevLast = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
        const d = prevLast - i;
        const m = viewMonth - 1;
        const y = m < 0 ? viewYear - 1 : viewYear;
        const mm = ((m % 12) + 12) % 12;
        appendDay(container, y, mm, d, true);
    }

    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
        appendDay(container, viewYear, viewMonth, d, false);
    }

    // Fill remaining cells
    const total = startDow + lastDay.getDate();
    const remaining = (7 - (total % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
        const m = viewMonth + 1;
        const y = m > 11 ? viewYear + 1 : viewYear;
        const mm = m % 12;
        appendDay(container, y, mm, d, true);
    }
}

function appendDay(container, y, m, d, otherMonth) {
    const key = dateKey(y, m, d);
    const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
    const dow = (new Date(y, m, d).getDay() + 6) % 7; // 0=Mon

    const cell = document.createElement('div');
    cell.className = 'day' +
        (otherMonth ? ' other-month' : '') +
        (key === todayKey ? ' today' : '') +
        (dow >= 5 ? ' weekend' : '');

    const numEl = document.createElement('div');
    numEl.className = 'day-num';
    numEl.textContent = d;
    cell.appendChild(numEl);

    const evList = document.createElement('div');
    evList.className = 'events';
    (events[key] || []).slice(0, 3).forEach(ev => {
        const pill = document.createElement('div');
        pill.className = `event-pill color-${ev.color}`;
        pill.textContent = ev.text;
        pill.onclick = (e) => { e.stopPropagation(); openDay(y, m, d); };
        evList.appendChild(pill);
    });
    cell.appendChild(evList);

    cell.onclick = () => openDay(y, m, d);
    container.appendChild(cell);
}

function openDay(y, m, d) {
    activeDay = dateKey(y, m, d);
    document.getElementById('modal-title').textContent =
        `${d}. ${MONTHS[m]} ${y}`;
    document.getElementById('event-input').value = '';
    selectedColor = 'default';
    document.querySelectorAll('.color-dot').forEach(el => {
        el.classList.toggle('selected', el.dataset.color === 'default');
    });
    renderModalEvents();
    document.getElementById('modal-overlay').classList.add('open');
    setTimeout(() => document.getElementById('event-input').focus(), 50);
}

function renderModalEvents() {
    const list = document.getElementById('modal-events');
    const evs = events[activeDay] || [];
    list.innerHTML = '';
    if (evs.length === 0) {
        list.innerHTML = '<div style="font-size:13px;color:#bbb;font-family:system-ui,sans-serif;margin-bottom:4px;">Keine Ereignisse</div>';
        return;
    }
    evs.forEach((ev, idx) => {
        const row = document.createElement('div');
        row.className = 'event-row';
        row.innerHTML = `
      <div class="dot color-${ev.color}"></div>
      <span class="event-row-name">${escHtml(ev.text)}</span>
      <button class="event-del" onclick="deleteEvent(${idx})" aria-label="Löschen">&times;</button>
    `;
        list.appendChild(row);
    });
}

function addEvent() {
    const inp = document.getElementById('event-input');
    const text = inp.value.trim();
    if (!text) { inp.focus(); return; }
    if (!events[activeDay]) events[activeDay] = [];
    events[activeDay].push({ text, color: selectedColor });
    inp.value = '';
    inp.focus();
    renderModalEvents();
    render();
}

function deleteEvent(idx) {
    events[activeDay].splice(idx, 1);
    renderModalEvents();
    render();
}

function selectColor(el) {
    selectedColor = el.dataset.color;
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
    el.classList.add('selected');
}

function closeModal(e) {
    if (e && e.target !== document.getElementById('modal-overlay')) return;
    document.getElementById('modal-overlay').classList.remove('open');
}

function prevMonth() {
    if (viewMonth === 0) { viewMonth = 11; viewYear--; }
    else viewMonth--;
    render();
}

function nextMonth() {
    if (viewMonth === 11) { viewMonth = 0; viewYear++; }
    else viewMonth++;
    render();
}

function goToday() {
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
    render();
}

function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

document.getElementById('event-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') addEvent();
    if (e.key === 'Escape') closeModal();
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.getElementById('modal-overlay').classList.remove('open');
});

initDropdowns();
render();
