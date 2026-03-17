(function () {
  'use strict';

  const scriptTag = document.currentScript || (function () {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  const CONFIG = {
    apiUrl:    (scriptTag && scriptTag.getAttribute('data-api')) || 'http://localhost:3001',
    color:     '#0a7f88',
    colorDark: '#086b73',
    name:      'Consulting Group',
  };

  let sessionId = null;
  let isOpen    = false;

  // ═══════════════════════════════════════════════════════════════════════════
  // STYLES
  // ═══════════════════════════════════════════════════════════════════════════
  function injectStyles() {
    const s = document.createElement('style');
    s.id = 'regal-styles';
    s.textContent = `
    #regal-root *, #regal-root *::before, #regal-root *::after {
      box-sizing: border-box; margin: 0; padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    }

    /* ── Trigger ── */
    #regal-trigger {
      position: fixed; bottom: 28px; right: 28px; z-index: 9998;
      width: 58px; height: 58px; border-radius: 50%; border: none; cursor: pointer;
      background: ${CONFIG.color};
      box-shadow: 0 4px 24px rgba(10,127,136,0.5);
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s, box-shadow .2s;
    }
    #regal-trigger:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(10,127,136,0.6); }

    #regal-pill {
      position: fixed; bottom: 38px; right: 96px; z-index: 9997;
      background: #fff; color: #222; font-size: 13px; font-weight: 600;
      padding: 9px 18px; border-radius: 24px; cursor: pointer; white-space: nowrap;
      box-shadow: 0 3px 14px rgba(0,0,0,0.14);
      transition: opacity .3s, transform .3s;
    }
    #regal-pill.hidden { opacity: 0; pointer-events: none; transform: translateX(8px); }

    /* ── Unread badge ── */
    #regal-badge {
      position: absolute; top: -3px; right: -3px;
      width: 18px; height: 18px; border-radius: 50%;
      background: #ef4444; color: #fff; font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #fff;
      animation: rPulse 2s infinite;
    }
    @keyframes rPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }

    /* ── Chat window ── */
    #regal-window {
      position: fixed; bottom: 96px; right: 28px; z-index: 9999;
      width: 390px;
      height: min(620px, calc(100dvh - 116px));
      max-height: calc(100dvh - 116px);
      border-radius: 20px;
      background: #fff; display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 12px 56px rgba(0,0,0,0.22);
      transform: scale(.92) translateY(20px); opacity: 0; pointer-events: none;
      transition: transform .28s cubic-bezier(.34,1.56,.64,1), opacity .22s ease;
    }
    #regal-window.open {
      transform: scale(1) translateY(0); opacity: 1; pointer-events: all;
    }

    /* ── Header ── */
    #regal-header {
      background: linear-gradient(135deg, #0a7f88 0%, #065f65 100%);
      padding: 14px 18px; display: flex; align-items: center; gap: 12px; flex-shrink: 0;
    }
    .r-av {
      width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
      background: rgba(255,255,255,.18); border: 2px solid rgba(255,255,255,.3);
      display: flex; align-items: center; justify-content: center; font-size: 18px;
      position: relative;
    }
    .r-av-dot {
      position: absolute; bottom: 1px; right: 1px;
      width: 10px; height: 10px; background: #4ade80;
      border-radius: 50%; border: 2px solid #065f65;
    }
    .r-hdr-info { flex: 1; }
    .r-hdr-name { color: #fff; font-weight: 700; font-size: 14.5px; letter-spacing: -.2px; }
    .r-hdr-sub  { color: rgba(255,255,255,.8); font-size: 11.5px; margin-top: 1px; }
    #regal-close {
      background: rgba(255,255,255,.15); border: none; cursor: pointer;
      color: rgba(255,255,255,.9); width: 30px; height: 30px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-size: 16px;
      transition: background .15s; flex-shrink: 0;
    }
    #regal-close:hover { background: rgba(255,255,255,.28); }

    /* ── Progress bar ── */
    #regal-progress-wrap {
      background: rgba(255,255,255,.15); height: 3px; flex-shrink: 0;
    }
    #regal-progress-bar {
      height: 100%; background: #fff;
      transition: width .5s ease; width: 0%;
    }

    /* ── Messages ── */
    #regal-msgs {
      flex: 1; overflow-y: auto; padding: 18px 16px 12px;
      background: #f2f6f6;
      display: flex; flex-direction: column; gap: 10px;
      scroll-behavior: smooth;
    }
    #regal-msgs::-webkit-scrollbar { width: 4px; }
    #regal-msgs::-webkit-scrollbar-thumb { background: #c5d5d6; border-radius: 2px; }

    .r-row { display: flex; align-items: flex-end; gap: 10px; animation: rFadeUp .2s ease; }
    .r-row.user { flex-direction: row-reverse; }
    @keyframes rFadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

    .r-ico {
      width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
      background: ${CONFIG.color}; display: flex; align-items: center;
      justify-content: center; font-size: 13px; color: #fff; font-weight: 700;
      margin-bottom: 2px; box-shadow: 0 2px 6px rgba(10,127,136,.25);
    }
    .r-row.user .r-ico { background: #b8d8da; color: #065f65; }

    .r-bubble {
      max-width: 78%; padding: 11px 16px; border-radius: 18px;
      font-size: 14px; line-height: 1.6; color: #1a1a1a;
      background: #ffffff;
      box-shadow: 0 1px 6px rgba(0,0,0,.09);
      border-bottom-left-radius: 4px;
      word-break: break-word; white-space: pre-wrap;
    }
    .r-row.user .r-bubble {
      background: ${CONFIG.color}; color: #fff;
      border-bottom-right-radius: 4px; border-bottom-left-radius: 18px;
      box-shadow: 0 2px 8px rgba(10,127,136,.3);
    }
    .r-bubble strong { font-weight: 700; }

    /* ── Inline quick-reply chips ── */
    .r-chips {
      display: flex; flex-wrap: wrap; gap: 8px;
      padding: 2px 0 4px 42px;
      animation: rFadeUp .2s ease;
    }
    .r-chip {
      padding: 9px 18px;
      border: 1.5px solid ${CONFIG.color};
      color: ${CONFIG.color}; background: #fff;
      border-radius: 22px; font-size: 13.5px; font-weight: 600;
      cursor: pointer; white-space: nowrap;
      transition: background .15s, color .15s, transform .1s, box-shadow .15s;
      box-shadow: 0 1px 5px rgba(10,127,136,.13);
    }
    .r-chip:hover {
      background: ${CONFIG.color}; color: #fff;
      transform: translateY(-1px); box-shadow: 0 3px 10px rgba(10,127,136,.3);
    }
    .r-chip:active { transform: translateY(0); }

    /* ── Typing indicator ── */
    .r-typing-wrap { display: flex; align-items: flex-end; gap: 8px; animation: rFadeUp .2s ease; }
    .r-typing {
      background: #fff; border-radius: 18px; border-bottom-left-radius: 5px;
      padding: 12px 16px; display: flex; gap: 4px; align-items: center;
      box-shadow: 0 1px 4px rgba(0,0,0,.08);
    }
    .r-typing span {
      width: 7px; height: 7px; background: #aaa; border-radius: 50%;
      animation: rBounce 1.3s infinite ease-in-out;
    }
    .r-typing span:nth-child(2) { animation-delay: .18s; }
    .r-typing span:nth-child(3) { animation-delay: .36s; }
    @keyframes rBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

    /* ── Confirmation card ── */
    .r-card {
      background: #fff; border: 1.5px solid #c8e8ea;
      border-radius: 14px; overflow: hidden; margin: 2px 0 2px 36px;
      box-shadow: 0 2px 8px rgba(10,127,136,.1);
      animation: rFadeUp .2s ease;
    }
    .r-card-hdr {
      background: linear-gradient(135deg,#0a7f88,#065f65);
      color: #fff; padding: 10px 16px; font-size: 12.5px; font-weight: 700;
    }
    .r-card-row {
      display: flex; padding: 9px 16px;
      border-bottom: 1px solid #f0f7f7; font-size: 12.5px;
    }
    .r-card-row:last-child { border-bottom: none; }
    .r-card-lbl { width: 88px; color: #999; flex-shrink: 0; font-size: 12px; }
    .r-card-val { color: #111; font-weight: 600; }

    /* ── File upload ── */
    #regal-file-wrap {
      padding: 10px 14px; background: #fff;
      border-top: 1px solid #eef2f2; flex-shrink: 0;
    }
    #regal-file-lbl {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; border: 2px dashed #c5dfe0; border-radius: 12px;
      cursor: pointer; color: #888; font-size: 13px;
      transition: border-color .15s, color .15s, background .15s;
    }
    #regal-file-lbl:hover { border-color: ${CONFIG.color}; color: ${CONFIG.color}; background: #f0fafa; }
    #regal-file-input { display: none; }
    #regal-file-name { font-size: 12px; color: ${CONFIG.color}; margin-top: 6px; padding-left: 4px; font-weight: 500; }

    /* ── Input area ── */
    #regal-input-wrap {
      padding: 10px 12px; background: #fff;
      border-top: 1px solid #eef2f2;
      display: flex; align-items: flex-end; gap: 8px; flex-shrink: 0;
    }
    #regal-input {
      flex: 1; border: 1.5px solid #e0e8e8; border-radius: 22px;
      padding: 10px 16px; font-size: 13.5px; resize: none; max-height: 90px;
      line-height: 1.45; color: #222; outline: none; font-family: inherit;
      background: #f9fbfb; transition: border-color .15s, background .15s;
    }
    #regal-input:focus { border-color: ${CONFIG.color}; background: #fff; }
    #regal-input:disabled { background: #f3f5f5; color: #bbb; cursor: not-allowed; }
    #regal-input::placeholder { color: #b0bfc0; }

    #regal-send {
      width: 40px; height: 40px; flex-shrink: 0; border: none; border-radius: 50%;
      background: ${CONFIG.color}; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s, transform .1s, box-shadow .15s;
      box-shadow: 0 2px 8px rgba(10,127,136,.35);
    }
    #regal-send:hover:not(:disabled) { background: ${CONFIG.colorDark}; transform: scale(1.08); }
    #regal-send:disabled { background: #c8d8d9; cursor: default; box-shadow: none; }

    /* ── Mobile ── */
    @media (max-width: 430px) {
      #regal-window {
        bottom: 0; right: 0; left: 0; width: 100%; height: 100dvh;
        border-radius: 0;
      }
      #regal-trigger { bottom: 20px; right: 20px; }
      #regal-pill { display: none; }
    }
    `;
    document.head.appendChild(s);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DOM
  // ═══════════════════════════════════════════════════════════════════════════
  function buildDOM() {
    const root = document.createElement('div');
    root.id = 'regal-root';
    root.innerHTML = `
      <div id="regal-pill">Apply for a Job</div>

      <div style="position:fixed;bottom:28px;right:28px;z-index:9998;">
        <button id="regal-trigger" aria-label="Open job application chat">
          <svg width="24" height="24" fill="none" stroke="#fff" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        <div id="regal-badge" style="display:none">1</div>
      </div>

      <div id="regal-window" role="dialog" aria-modal="true" aria-label="Job Application Chat">

        <div id="regal-header">
          <div class="r-av">
            &#128338;
            <span class="r-av-dot"></span>
          </div>
          <div class="r-hdr-info">
            <div class="r-hdr-name">${CONFIG.name}</div>
            <div class="r-hdr-sub">Typically replies instantly</div>
          </div>
          <button id="regal-close" aria-label="Close chat">&#10005;</button>
        </div>

        <div id="regal-progress-wrap">
          <div id="regal-progress-bar"></div>
        </div>

        <div id="regal-msgs" aria-live="polite"></div>

        <div id="regal-file-wrap" style="display:none">
          <label id="regal-file-lbl" for="regal-file-input">
            <span style="font-size:20px">&#128206;</span>
            <span>Upload resume — PDF, DOC or DOCX (max 5 MB)</span>
          </label>
          <input type="file" id="regal-file-input" accept=".pdf,.doc,.docx">
          <div id="regal-file-name"></div>
        </div>

        <div id="regal-input-wrap">
          <textarea id="regal-input" rows="1" placeholder="Type your message..." disabled></textarea>
          <button id="regal-send" disabled aria-label="Send">
            <svg width="17" height="17" fill="none" stroke="#fff" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

      </div>
    `;
    document.body.appendChild(root);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROGRESS BAR
  // State index out of 11 total steps → percentage
  // ═══════════════════════════════════════════════════════════════════════════
  const STATE_PROGRESS = {
    JOB_SELECTION: 9, LOCATION_SELECTION: 18, SHIFT_SELECTION: 27,
    COLLECT_NAME: 36, COLLECT_EMAIL: 45, COLLECT_PHONE: 54,
    COLLECT_DOB: 63, COLLECT_START_DATE: 72, COLLECT_RESUME: 81,
    COLLECT_LINKEDIN: 90, CONFIRMATION: 96, SUBMITTED: 100,
  };

  function updateProgress(state) {
    const pct = STATE_PROGRESS[state] || 0;
    const bar = document.getElementById('regal-progress-bar');
    if (bar) bar.style.width = pct + '%';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  function addMessage(text, isUser, confirmationData) {
    const msgs = document.getElementById('regal-msgs');

    const row = document.createElement('div');
    row.className = 'r-row' + (isUser ? ' user' : '');

    const ico = document.createElement('div');
    ico.className = 'r-ico';
    ico.textContent = isUser ? 'U' : 'R';

    const bubble = document.createElement('div');
    bubble.className = 'r-bubble';
    bubble.innerHTML = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    row.appendChild(ico);
    row.appendChild(bubble);
    msgs.appendChild(row);

    if (confirmationData) {
      msgs.appendChild(buildCard(confirmationData));
    }

    scrollToBottom();
    return row;
  }

  // Render quick-reply chips INLINE in the message flow
  function addChips(buttons, onSelect) {
    if (!buttons || !buttons.length) return null;
    const msgs = document.getElementById('regal-msgs');

    const wrap = document.createElement('div');
    wrap.className = 'r-chips';
    wrap.id = 'regal-chips-active';

    buttons.forEach(label => {
      const chip = document.createElement('button');
      chip.className = 'r-chip';
      chip.textContent = label;
      chip.onclick = () => {
        removeChips();
        onSelect(label);
      };
      wrap.appendChild(chip);
    });

    msgs.appendChild(wrap);
    scrollToBottom();
    return wrap;
  }

  function removeChips() {
    const existing = document.getElementById('regal-chips-active');
    if (existing) existing.remove();
  }

  function buildCard(data) {
    const rows = [
      ['Position',   data.jobRole],
      ['Location',   data.location + ', ON'],
      ['Shift',      data.shift],
      ['Name',       data.name],
      ['Email',      data.email],
      ['Phone',      data.phone],
      ['Start Date', data.startDate],
      ['Resume',     data.hasResume ? 'Uploaded' : 'Not provided'],
    ];
    if (data.linkedIn) rows.push(['LinkedIn', 'Provided']);

    const card = document.createElement('div');
    card.className = 'r-card';
    card.innerHTML = `
      <div class="r-card-hdr">Application Summary — Please Review</div>
      ${rows.map(([l, v]) => `
        <div class="r-card-row">
          <span class="r-card-lbl">${l}</span>
          <span class="r-card-val">${v || '—'}</span>
        </div>`).join('')}
    `;
    return card;
  }

  function showTyping() {
    const msgs = document.getElementById('regal-msgs');
    const wrap = document.createElement('div');
    wrap.className = 'r-typing-wrap';
    wrap.id = 'regal-typing';
    wrap.innerHTML = `
      <div class="r-ico">R</div>
      <div class="r-typing"><span></span><span></span><span></span></div>
    `;
    msgs.appendChild(wrap);
    scrollToBottom();
  }

  function hideTyping() {
    const el = document.getElementById('regal-typing');
    if (el) el.remove();
  }

  function scrollToBottom() {
    const msgs = document.getElementById('regal-msgs');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INPUT CONTROL
  // ═══════════════════════════════════════════════════════════════════════════
  function setInputMode(inputType, enabled) {
    const inputWrap = document.getElementById('regal-input-wrap');
    const fileWrap  = document.getElementById('regal-file-wrap');
    const input     = document.getElementById('regal-input');
    const send      = document.getElementById('regal-send');

    if (inputType === 'file') {
      inputWrap.style.display = 'none';
      fileWrap.style.display  = 'block';
    } else {
      fileWrap.style.display  = 'none';
      inputWrap.style.display = 'flex';
      input.disabled = !enabled;
      send.disabled  = !enabled;
      if (enabled) setTimeout(() => input.focus(), 60);
    }
  }

  function lockInput() {
    document.getElementById('regal-input').disabled = true;
    document.getElementById('regal-send').disabled  = true;
  }

  function hideInputArea() {
    document.getElementById('regal-input-wrap').style.display = 'none';
    document.getElementById('regal-file-wrap').style.display  = 'none';
    removeChips();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // API
  // ═══════════════════════════════════════════════════════════════════════════
  async function startSession() {
    showTyping();
    try {
      const res  = await fetch(CONFIG.apiUrl + '/api/chat/start', { method: 'POST' });
      const data = await res.json();
      hideTyping();

      sessionId = data.sessionId;

      addMessage(data.message, false);
      updateProgress(data.state);

      // Chips appear inline right after the message
      addChips(data.buttons, handleButtonClick);
      setInputMode('text', false); // text input disabled until free-text state
    } catch {
      hideTyping();
      addMessage('Having trouble connecting. Please call +1\u00a0647-292-5145.', false);
    }
  }

  async function sendMessage(text, file) {
    removeChips();
    lockInput();
    addMessage(text, true);
    showTyping();

    try {
      let res;
      if (file) {
        const fd = new FormData();
        fd.append('sessionId', sessionId);
        fd.append('message', text);
        fd.append('resume', file);
        res = await fetch(CONFIG.apiUrl + '/api/chat/message', { method: 'POST', body: fd });
      } else {
        res = await fetch(CONFIG.apiUrl + '/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, message: text }),
        });
      }

      const data = await res.json();
      hideTyping();

      if (data.error === 'SESSION_EXPIRED') {
        addMessage('Your session expired. Please refresh to start again.', false);
        hideInputArea();
        return;
      }

      updateProgress(data.state);
      addMessage(data.message, false, data.confirmationData);

      if (data.state === 'SUBMITTED') {
        hideInputArea();
        return;
      }

      // Show chips inline for button states
      if (data.buttons && data.buttons.length) {
        addChips(data.buttons, handleButtonClick);
      }

      // Free-text states — enable typing
      const freeText = [
        'COLLECT_NAME','COLLECT_EMAIL','COLLECT_PHONE',
        'COLLECT_DOB','COLLECT_START_DATE','COLLECT_LINKEDIN',
      ];
      const textEnabled = freeText.includes(data.state) || data.isError;

      if (data.state === 'CONFIRMATION') {
        setInputMode('text', false); // only buttons at confirmation
      } else {
        setInputMode(data.inputType || 'text', textEnabled);
      }

    } catch {
      hideTyping();
      addMessage('Something went wrong. Please try again.', false);
      setInputMode('text', true);
    }
  }

  async function submitApplication() {
    removeChips();
    showTyping();
    try {
      const res  = await fetch(CONFIG.apiUrl + '/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      hideTyping();

      if (data.success) {
        updateProgress('SUBMITTED');
        addMessage(data.message, false);
        hideInputArea();
        sessionId = null;
      } else {
        addMessage('There was an issue submitting. Please try again or call +1\u00a0647-292-5145.', false);
        addChips(['Submit Application', 'Edit Details'], handleButtonClick);
      }
    } catch {
      hideTyping();
      addMessage('Submission failed. Please try again.', false);
      addChips(['Submit Application', 'Edit Details'], handleButtonClick);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  function handleButtonClick(label) {
    if (label === 'Submit Application') { submitApplication(); return; }
    sendMessage(label);
  }

  function handleSend() {
    const input = document.getElementById('regal-input');
    const text  = input.value.trim();
    if (!text || !sessionId) return;
    input.value = '';
    input.style.height = 'auto';
    sendMessage(text);
  }

  function toggleChat() {
    isOpen = !isOpen;
    document.getElementById('regal-window').classList.toggle('open', isOpen);
    document.getElementById('regal-pill').classList.toggle('hidden', isOpen);

    const badge = document.getElementById('regal-badge');
    if (badge) badge.style.display = 'none';

    if (isOpen && !sessionId) startSession();
    if (isOpen) setTimeout(scrollToBottom, 300);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════════════════════════════
  function init() {
    injectStyles();
    buildDOM();

    document.getElementById('regal-trigger').addEventListener('click', toggleChat);
    document.getElementById('regal-pill').addEventListener('click', toggleChat);
    document.getElementById('regal-close').addEventListener('click', toggleChat);

    const input = document.getElementById('regal-input');
    input.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 90) + 'px';
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });
    document.getElementById('regal-send').addEventListener('click', handleSend);

    document.getElementById('regal-file-input').addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;
      document.getElementById('regal-file-name').textContent = file.name + ' ready to upload';
      setTimeout(() => sendMessage('Resume: ' + file.name, file), 400);
    });

    // Show unread badge after 3s if chat not opened
    setTimeout(() => {
      if (!isOpen) {
        const badge = document.getElementById('regal-badge');
        if (badge) badge.style.display = 'flex';
      }
    }, 3000);

    // Hide pill after 7s
    setTimeout(() => {
      if (!isOpen) document.getElementById('regal-pill').classList.add('hidden');
    }, 7000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
