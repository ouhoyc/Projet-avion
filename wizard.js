// Parcours d'accueil : à chaque nouvelle visite (nouvel onglet), une question par écran avant
// les résultats — 1. dates ou période, 2. durée (sautée avec des dates fixes), 3. voyageurs,
// 4. budget (facultatif), 5. une idée de lieu (facultatif). Les réponses remplissent les mêmes
// champs que les pastilles du haut, qui servent ensuite à tout modifier.
// Utilise search.js (cal, commitCalendar, sEls, matchPlaces…) et voyageurs.js (paxInline).

const WIZ_KEY = 'parcours-vu';  // gardé le temps de l'onglet : le parcours ne revient pas au retour d'une page guide
const WIZ_TOTAL = 5;
const wiz = { step: 1, dialog: $('wizard') };

// Étapes à parcourir : la durée n'est demandée que sans dates fixes.
function wizardSteps() {
  return [1, ...(exactDates() ? [] : [2]), 3, 4, 5];
}

function wizardShow(n) {
  wiz.step = n;
  for (const sec of wiz.dialog.querySelectorAll('.w-step')) sec.hidden = Number(sec.dataset.wstep) !== n;
  $('w-count').textContent = `Question ${n} sur ${WIZ_TOTAL}${n >= 4 ? ' · facultatif' : ''}`;
  $('w-bar').style.width = `${(n / WIZ_TOTAL) * 100}%`;
  wiz.dialog.querySelector('[data-w-back]').hidden = n === 1;

  if (n === 1) {
    paintCalendar();
    scrollCalendar($('w-cal-months'));
  }
  if (n === 2) {
    const from = sEls.from.value;
    const to = sEls.to.value;
    $('w-stay-help').textContent = from && to && from !== to
      ? `Vous êtes libre du ${formatDayShort(from)} au ${formatDayShort(to)} : on cherche le moins cher dans cette période.`
      : from ? `Départ à partir du ${formatDayShort(from)}.` : 'On cherche les meilleurs prix sur les 12 prochains mois.';
  }
  if (n === 3) paxInline($('w-pax'), () => showPax());
  if (n === 4) {
    const n2 = seats();
    $('w-budget').value = sEls.budget.value;
    $('w-budget-help').textContent = `Prix maximum du vol aller-retour, pour ${n2 > 1 ? `vous ${n2}` : 'vous'}. Laissez vide si vous n'avez pas de limite.`;
  }
  if (n === 5) {
    $('w-where').value = whereLabel();
    renderWizardPlaces();
  }
  wizardUpdate();
}

// Texte et état des boutons du bas selon l'étape (appelé aussi par le calendrier).
function wizardUpdate() {
  if (!wiz.dialog?.open) return;
  const next = $('w-next');
  const skip = $('w-skip');
  const n = wiz.step;
  next.disabled = false;
  next.textContent = 'Suivant';
  skip.hidden = false;
  if (n === 1) {
    next.disabled = !cal.start || (cal.mode === 'exact' && !cal.end);
    next.textContent = cal.mode === 'exact' && cal.start && !cal.end ? 'Choisissez le retour'
      : !cal.start ? (cal.mode === 'exact' ? "Choisissez l'aller et le retour" : 'Choisissez la période') : 'Suivant';
    skip.textContent = 'Je ne sais pas encore';
  } else if (n === 2) {
    const stay = sEls.form.elements.stay.value;
    for (const b of wiz.dialog.querySelectorAll('[data-w-stay]')) b.setAttribute('aria-pressed', b.dataset.wStay === stay);
    next.disabled = !stay;
    if (!stay) next.textContent = 'Choisissez une durée';
    skip.hidden = true;
  } else if (n === 3) {
    skip.hidden = true;
  } else if (n === 4) {
    skip.textContent = 'Passer';
  } else {
    next.textContent = 'Voir les destinations';
    skip.textContent = 'Surprenez-moi';
  }
}

function wizardGo(delta) {
  const steps = wizardSteps();
  const i = steps.indexOf(wiz.step);
  const target = steps[i + delta];
  if (target) wizardShow(target);
  else if (delta > 0) wizardFinish();
}

function wizardFinish() {
  wiz.dialog.close();
}

// Lieux proposés sous le champ (8 au plus) ; le lieu choisi est mis en avant.
function renderWizardPlaces() {
  const list = $('w-where-list');
  const chosen = whereLabel();
  const typed = $('w-where').value;
  const shown = (typed && typed === chosen ? [] : matchPlaces(typed)).slice(0, 8);
  list.innerHTML = chosen && typed === chosen
    ? `<li class="w-where-chosen"><span>${escapeHtml(chosen)}</span><button type="button" data-w-clear>Effacer</button></li>`
    : shown.length
      ? shown.map((p, i) => `<li><button type="button" data-w-place="${i}">${flag(p.cc)}<span>${escapeHtml(p.label)}</span><small>${p.type === 'country' ? 'Pays' : escapeHtml(p.country)}</small></button></li>`).join('')
      : typed ? '<li class="where-empty">Aucun vol direct vers ce lieu</li>' : '';
  list.onclick = (e) => {
    const pick = e.target.closest('[data-w-place]');
    if (pick) setWizardPlace(shown[Number(pick.dataset.wPlace)]);
    if (e.target.closest('[data-w-clear]')) setWizardPlace(null);
  };
}

function setWizardPlace(p) {
  sEls.country.value = p ? p.country : '';
  sEls.city.value = p && p.type === 'city' ? p.code : '';
  sEls.where.value = whereLabel();
  sEls.whereClear.hidden = !sEls.where.value;
  $('w-where').value = whereLabel();
  renderWizardPlaces();
}

function setupWizard() {
  const d = wiz.dialog;
  if (!d) return;

  $('w-next').addEventListener('click', () => {
    if (wiz.step === 1 && !commitCalendar()) return;
    if (wiz.step === 4) sEls.budget.value = $('w-budget').value;
    wizardGo(1);
  });
  $('w-skip').addEventListener('click', () => {
    if (wiz.step === 1) { cal.start = cal.end = ''; commitCalendar(); }
    if (wiz.step === 4) { $('w-budget').value = ''; sEls.budget.value = ''; }
    if (wiz.step === 5) setWizardPlace(null);
    wizardGo(1);
  });
  d.querySelector('[data-w-back]').addEventListener('click', () => wizardGo(-1));
  d.querySelector('[data-w-close]').addEventListener('click', wizardFinish);
  d.addEventListener('click', (e) => {
    const stay = e.target.closest('[data-w-stay]')?.dataset.wStay;
    if (!stay) return;
    const radio = sEls.form.querySelector(`input[name="stay"][value="${stay}"]`);
    radio.checked = true;
    updateFormHelp();
    wizardGo(1); // un seul choix possible : on passe directement à la suite
  });
  $('w-where').addEventListener('input', renderWizardPlaces);
  $('w-budget').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('w-next').click(); } });
  // Fermeture (fin du parcours, croix ou touche Échap) : les pastilles et la liste se mettent à jour.
  d.addEventListener('close', () => {
    updatePills();
    updateFormHelp();
    runSearch();
  });

  let seen = false;
  try { seen = sessionStorage.getItem(WIZ_KEY) === '1'; sessionStorage.setItem(WIZ_KEY, '1'); } catch {}
  if (seen) return;
  cal.start = sEls.from.value;
  cal.end = sEls.to.value === sEls.from.value ? '' : sEls.to.value;
  cal.mode = sEls.exact.checked ? 'exact' : 'flex';
  d.showModal();
  wizardShow(1);
}

setupWizard();
