// Voyageurs (adultes + enfants avec leur âge), partagés entre l'accueil et les pages guides.
// Gardés dans le navigateur : { adults: 2, children: [8, 4] } (âges des enfants).

const PAX_KEY = 'voyageurs';
const PAX_MAX = 9;

function paxGet() {
  try {
    const p = JSON.parse(localStorage.getItem(PAX_KEY));
    if (p && p.adults >= 1 && Array.isArray(p.children)) return p;
  } catch {}
  return { adults: 1, children: [] };
}

function paxSave(p) {
  try { localStorage.setItem(PAX_KEY, JSON.stringify(p)); } catch {}
}

function paxCount(p) {
  return p.adults + p.children.length;
}

function paxLabel(p) {
  const a = `${p.adults} adulte${p.adults > 1 ? 's' : ''}`;
  const n = p.children.length;
  return n ? `${a}, ${n} enfant${n > 1 ? 's' : ''}` : a;
}

// Ouvre la fenêtre de choix dans un <dialog> vide ; onDone(p) est appelé à la validation.
function paxOpen(dialog, onDone) {
  const p = structuredClone(paxGet());
  const ageOptions = (sel) => Array.from({ length: 18 }, (_, i) =>
    `<option value="${i}"${i === sel ? ' selected' : ''}>${i === 0 ? 'moins de 1 an' : `${i} an${i > 1 ? 's' : ''}`}</option>`).join('');
  const render = () => {
    dialog.innerHTML = `
      <div class="pax-body">
        <h2 class="pax-title">Qui part ?</h2>
        <p class="pax-help">Les prix des activités sont calculés pour tout le groupe (tarifs enfants compris).</p>
        <div class="pax-row">
          <span><b>Adultes</b><small>18 ans et plus</small></span>
          <span class="pax-step">
            <button type="button" data-step="a:-1" aria-label="Un adulte de moins" ${p.adults <= 1 ? 'disabled' : ''}>−</button>
            <output>${p.adults}</output>
            <button type="button" data-step="a:1" aria-label="Un adulte de plus" ${paxCount(p) >= PAX_MAX ? 'disabled' : ''}>+</button>
          </span>
        </div>
        <div class="pax-row">
          <span><b>Enfants</b><small>moins de 18 ans</small></span>
          <span class="pax-step">
            <button type="button" data-step="c:-1" aria-label="Un enfant de moins" ${p.children.length ? '' : 'disabled'}>−</button>
            <output>${p.children.length}</output>
            <button type="button" data-step="c:1" aria-label="Un enfant de plus" ${paxCount(p) >= PAX_MAX ? 'disabled' : ''}>+</button>
          </span>
        </div>
        ${p.children.map((age, i) => `
          <label class="pax-age">Âge de l'enfant ${i + 1}
            <select data-age="${i}">${ageOptions(age)}</select>
          </label>`).join('')}
        <button type="button" class="pax-ok" data-ok>Valider</button>
      </div>`;
  };
  render();
  dialog.onclick = (e) => {
    if (e.target === dialog) return dialog.close();
    const step = e.target.closest('[data-step]')?.dataset.step;
    if (step) {
      const [who, d] = step.split(':');
      if (who === 'a') p.adults = Math.max(1, p.adults + Number(d));
      else if (d === '1') p.children.push(8);
      else p.children.pop();
      render();
    }
    if (e.target.closest('[data-ok]')) {
      paxSave(p);
      dialog.close();
      onDone?.(p);
    }
  };
  dialog.onchange = (e) => {
    const i = e.target.dataset.age;
    if (i != null) p.children[i] = Number(e.target.value);
  };
  dialog.showModal();
}
