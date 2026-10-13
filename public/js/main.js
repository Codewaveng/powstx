// POWtfolio v2 | Main JS

// ── Toast notification system ──────────────────────────
function showToast(msg, type = 'info', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.setProperty('--toast-dur', `${duration / 1000}s`);
  toast.innerHTML = `
    <i class="fas ${icons[type] || icons.info} toast-icon"></i>
    <span class="toast-msg">${msg}</span>
    <button class="toast-close" aria-label="Dismiss"><i class="fas fa-times"></i></button>`;

  function dismiss() {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 260);
  }

  toast.querySelector('.toast-close').addEventListener('click', dismiss);
  container.appendChild(toast);
  setTimeout(dismiss, duration);
}

// Show toasts injected by server (via window.__toasts array)
document.addEventListener('DOMContentLoaded', () => {
  if (window.__toasts && Array.isArray(window.__toasts)) {
    window.__toasts.forEach(({ msg, type }) => showToast(msg, type));
  }
});

document.addEventListener('DOMContentLoaded', () => {

  // ── Mobile nav toggle ──────────────────────────────
  const navToggle = document.getElementById('navToggle');
  const navLinks  = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      const icon = navToggle.querySelector('i');
      icon.classList.toggle('fa-bars');
      icon.classList.toggle('fa-times');
    });
  }

  // ── Copy-to-clipboard buttons ──────────────────────
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copied'); }, 2200);
      } catch {
        // fallback
        const el = document.createElement('textarea');
        el.value = text; document.body.appendChild(el);
        el.select(); document.execCommand('copy');
        document.body.removeChild(el);
      }
    });
  });

  // ── Skills tag input ───────────────────────────────
  const skillsWrap = document.querySelector('.skills-tags-wrap');
  const skillsHidden = document.getElementById('skillsHidden');
  if (skillsWrap && skillsHidden) {
    const tagInput = skillsWrap.querySelector('.tag-input');
    let tags = skillsHidden.value
      ? skillsHidden.value.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    function renderTags() {
      skillsWrap.querySelectorAll('.tag-pill').forEach(el => el.remove());
      tags.forEach(tag => {
        const pill = document.createElement('span');
        pill.className = 'tag-pill';
        pill.innerHTML = `${escHtml(tag)} <button class="tag-remove" type="button" aria-label="Remove">✕</button>`;
        pill.querySelector('.tag-remove').addEventListener('click', () => {
          tags = tags.filter(t => t !== tag);
          renderTags();
          updateHidden();
        });
        skillsWrap.insertBefore(pill, tagInput);
      });
    }

    function updateHidden() { skillsHidden.value = tags.join(', '); }

    function addTag(val) {
      const t = val.trim();
      if (t && !tags.includes(t)) { tags.push(t); renderTags(); updateHidden(); }
    }

    tagInput.addEventListener('keydown', e => {
      if (['Enter', ','].includes(e.key)) {
        e.preventDefault();
        addTag(tagInput.value.replace(',', ''));
        tagInput.value = '';
      } else if (e.key === 'Backspace' && !tagInput.value && tags.length) {
        tags.pop(); renderTags(); updateHidden();
      }
    });
    tagInput.addEventListener('blur', () => {
      if (tagInput.value.trim()) { addTag(tagInput.value); tagInput.value = ''; }
    });
    skillsWrap.addEventListener('click', () => tagInput.focus());
    renderTags();
  }

  // ── Custom links builder ───────────────────────────
  const addLinkBtn  = document.getElementById('addLinkBtn');
  const linksList   = document.getElementById('linksList');
  if (addLinkBtn && linksList) {
    addLinkBtn.addEventListener('click', () => {
      const idx = linksList.querySelectorAll('.link-row').length;
      const row = document.createElement('div');
      row.className = 'link-row';
      row.innerHTML = `
        <input type="text"  name="linkTitle[]" class="form-input" placeholder="Link title" required>
        <input type="url"   name="linkUrl[]"   class="form-input" placeholder="https://" required>
        <button type="button" class="link-row-remove"><i class="fas fa-trash"></i></button>`;
      row.querySelector('.link-row-remove').addEventListener('click', () => row.remove());
      linksList.appendChild(row);
    });

    linksList.querySelectorAll('.link-row-remove').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('.link-row').remove());
    });
  }

  // ── Avatar preview on select ───────────────────────
  const avatarFile = document.getElementById('avatarFile');
  const avatarPreviewEl = document.getElementById('avatarPreview');
  if (avatarFile && avatarPreviewEl) {
    avatarFile.addEventListener('change', () => {
      const file = avatarFile.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (avatarPreviewEl.tagName === 'IMG') {
          avatarPreviewEl.src = e.target.result;
        } else {
          const img = document.createElement('img');
          img.src = e.target.result;
          img.className = 'avatar-preview-img';
          img.id = 'avatarPreview';
          avatarPreviewEl.replaceWith(img);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Featured image drop zone ───────────────────────
  const coverImageFile = document.getElementById('coverImageFile');
  const coverPreview = document.getElementById('coverPreview');
  const coverPreviewEmpty = document.getElementById('coverPreviewEmpty');
  if (coverImageFile && coverPreview) {
    coverImageFile.addEventListener('change', () => {
      const file = coverImageFile.files[0];
      if (!file) return;
      coverPreview.src = URL.createObjectURL(file);
      coverPreview.style.display = 'block';
      if (coverPreviewEmpty) coverPreviewEmpty.style.display = 'none';
      const removeCover = document.querySelector('input[name="removeCoverImage"]');
      if (removeCover) removeCover.checked = false;
    });
  }

  // Keep the preset accent swatches and free color picker in sync.
  const accentPicker = document.getElementById('accentHex');
  const accentPresets = {
    purple: '#8b6acb', blue: '#4f87bd', green: '#5f936e',
    rose: '#dc7185', orange: '#ee795d', dark: '#35413d'
  };
  document.querySelectorAll('input[name="accentColor"]').forEach(input => {
    input.addEventListener('change', () => {
      if (accentPicker && accentPresets[input.value]) accentPicker.value = accentPresets[input.value];
    });
  });

  const featImgDrop = document.getElementById('featuredImgDrop');
  const featImgFile = document.getElementById('featuredImageFile');
  const featImgPreview = document.getElementById('featuredImgPreview');
  const featImgPlaceholder = document.getElementById('featuredImgPlaceholder');
  if (featImgDrop && featImgFile) {
    featImgFile.addEventListener('change', () => {
      if (featImgFile.files[0]) showFeatPreview(featImgFile.files[0]);
    });
    featImgDrop.addEventListener('dragover', e => { e.preventDefault(); featImgDrop.classList.add('drag'); });
    featImgDrop.addEventListener('dragleave', () => featImgDrop.classList.remove('drag'));
    featImgDrop.addEventListener('drop', e => {
      e.preventDefault(); featImgDrop.classList.remove('drag');
      if (e.dataTransfer.files[0]) {
        const dt = e.dataTransfer;
        try { featImgFile.files = dt.files; } catch {}
        showFeatPreview(dt.files[0]);
      }
    });
    function showFeatPreview(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (featImgPreview) { featImgPreview.src = e.target.result; featImgPreview.style.display = 'block'; }
        if (featImgPlaceholder) featImgPlaceholder.style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  }

  // ── File upload preview ────────────────────────────
  const fileDrop = document.querySelector('.file-drop');
  const fileChosen = document.querySelector('.file-chosen');
  if (fileDrop) {
    const inp = fileDrop.querySelector('input[type="file"]');
    if (inp && fileChosen) {
      inp.addEventListener('change', () => {
        if (inp.files[0]) {
          fileChosen.style.display = 'flex';
          fileChosen.querySelector('.file-chosen-name').textContent = inp.files[0].name;
        }
      });
    }
    fileDrop.addEventListener('dragover', e => { e.preventDefault(); fileDrop.classList.add('drag'); });
    fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('drag'));
    fileDrop.addEventListener('drop', e => {
      e.preventDefault(); fileDrop.classList.remove('drag');
      if (inp && e.dataTransfer.files[0]) {
        inp.files = e.dataTransfer.files;
        inp.dispatchEvent(new Event('change'));
      }
    });
  }

  // ── Date validation (end > start) ─────────────────
  const startDate = document.getElementById('startDate');
  const endDate   = document.getElementById('endDate');
  if (startDate && endDate) {
    endDate.addEventListener('change', () => {
      if (endDate.value && startDate.value && endDate.value < startDate.value) {
        endDate.setCustomValidity('End date must be after start date');
      } else {
        endDate.setCustomValidity('');
      }
    });
  }

  // ── Auto-dismiss alerts ────────────────────────────
  document.querySelectorAll('.alert').forEach(el => {
    setTimeout(() => {
      el.style.transition = 'opacity 0.5s ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 500);
    }, 5000);
  });

  // ── Scroll-reveal for cards ────────────────────────
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.feature-card, .role-card, .stat-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
    obs.observe(el);
  });

  // ── ZeroAuth DAO reputation fetch ─────────────────
  const fetchDaoBtn = document.getElementById('fetchDaoBtn');
  const daoAddressInput = document.getElementById('daoAddress');
  const daoResultEl = document.getElementById('daoResult');
  if (fetchDaoBtn && daoAddressInput) {
    fetchDaoBtn.addEventListener('click', async () => {
      const addr = daoAddressInput.value.trim();
      if (!addr) {
        daoResultEl.className = 'dao-result error';
        daoResultEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Enter a Stacks wallet address first.';
        daoResultEl.style.display = 'block';
        return;
      }
      fetchDaoBtn.disabled = true;
      fetchDaoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching...';
      daoResultEl.style.display = 'none';
      try {
        const res = await fetch(`/dashboard/fetch-dao?address=${encodeURIComponent(addr)}`);
        const json = await res.json();
        if (json.error) {
          daoResultEl.className = 'dao-result error';
          daoResultEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${escHtml(json.error)}`;
        } else {
          const d = json.data;
          daoResultEl.className = 'dao-result success';
          daoResultEl.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem;">
              <div style="font-weight:700;color:var(--purple);">
                <i class="fas fa-check-circle"></i>
                ${escHtml(d.displayName || 'DAO Member')}
                ${d.bnsName ? `<span style="font-weight:500;color:var(--gray-500);font-size:0.8rem;">&nbsp;&middot;&nbsp;${escHtml(d.bnsName)}</span>` : ''}
              </div>
              <span style="font-size:0.72rem;color:var(--gray-400);">Synced now</span>
            </div>
            <div class="dao-stat-row">
              <div class="dao-stat">
                <span class="dao-stat-num">${d.score ?? 0}</span>
                <span class="dao-stat-lbl">Activity Score</span>
              </div>
              <div class="dao-stat">
                <span class="dao-stat-num">${d.badges ?? 0}</span>
                <span class="dao-stat-lbl">Endorsements</span>
              </div>
              <div class="dao-stat">
                <span class="dao-stat-num">${d.bounties ?? 0}</span>
                <span class="dao-stat-lbl">Bounties</span>
              </div>
              <div class="dao-stat">
                <span class="dao-stat-num">${d.submissions ?? 0}</span>
                <span class="dao-stat-lbl">Submissions</span>
              </div>
            </div>`;
        }
        daoResultEl.style.display = 'block';
      } catch {
        daoResultEl.className = 'dao-result error';
        daoResultEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Network error. Please try again.';
        daoResultEl.style.display = 'block';
      }
      fetchDaoBtn.disabled = false;
      fetchDaoBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Fetch Reputation';
    });
  }

  // ── Confirm delete ─────────────────────────────────
  document.querySelectorAll('[data-confirm]').forEach(btn => {
    btn.addEventListener('click', e => {
      if (!confirm(btn.dataset.confirm || 'Are you sure? This cannot be undone.')) {
        e.preventDefault();
      }
    });
  });

  // ── Smooth anchor scroll ───────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  console.log('POWtfolio v2 ready 🚀');
});
