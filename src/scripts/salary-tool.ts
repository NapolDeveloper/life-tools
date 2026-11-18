/** 연봉 실수령액 계산기 인터랙션. 외부 라이브러리 없이 바닐라 TS로만 작성한다(JS 30KB gzip 이하). */
import { calculateSalary, type SalaryInput } from '../lib/salary';
import { SALARY_DEFAULTS, parseSalaryQuery, toSalaryQuery, validateSalary } from '../lib/salary-query';
import { won, koreanAmount, parseDigits } from '../lib/format';
import { viewOf, DEDUCTION_ROWS, TOTAL_ROWS } from '../lib/salary-view';
import { SITE_NAME } from '../config';

const MAX_DIGITS_VALUE = 999_999_999_999;
const $ = (id: string) => document.getElementById(id) as HTMLInputElement;
const form = document.getElementById('calc-form') as HTMLFormElement;
const annual = $('annual');
const nontax = $('nontax');
const deps = $('deps');
const kids = $('kids');
const hero = document.querySelector<HTMLElement>('[data-hero]')!;
const heroError = document.querySelector<HTMLElement>('[data-result-error]')!;
const note = document.querySelector<HTMLElement>('[data-result-note]')!;
const toastEl = document.querySelector<HTMLElement>('[data-toast]')!;
const stickyBar = document.querySelector<HTMLElement>('[data-sticky-bar]');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let last: { input: SalaryInput; net: number } | null = null;

function setText(el: Element, text: string): void {
  if (el.textContent === text) return;
  el.textContent = text;
  if (reduceMotion) return;
  el.classList.remove('flash');
  void (el as HTMLElement).offsetWidth;
  el.classList.add('flash');
}

/* ---------- 금액 입력: 콤마, 커서 위치 유지, 한글 읽기 ---------- */
function formatMoney(el: HTMLInputElement): void {
  const raw = el.value;
  const caret = el.selectionStart ?? raw.length;
  const digitsBefore = raw.slice(0, caret).replace(/\D/g, '').length;
  const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 12);
  const formatted = digits ? Number(digits).toLocaleString('ko-KR') : '';
  el.value = formatted;
  let pos = 0;
  let seen = 0;
  while (pos < formatted.length && seen < digitsBefore) {
    if (/\d/.test(formatted[pos])) seen++;
    pos++;
  }
  try { el.setSelectionRange(pos, pos); } catch { /* 일부 브라우저는 포커스 밖에서 불가 */ }
  const reading = document.getElementById(`${el.id}-reading`);
  if (reading) reading.textContent = koreanAmount(parseDigits(el.value));
}

function setMoney(el: HTMLInputElement, value: number): void {
  el.value = String(Math.min(Math.max(0, value), MAX_DIGITS_VALUE));
  formatMoney(el);
}

/* ---------- 스테퍼 ---------- */
function stepperOf(input: HTMLInputElement): HTMLElement {
  return input.closest<HTMLElement>('[data-stepper]')!;
}
function setStepper(input: HTMLInputElement, value: number): void {
  const box = stepperOf(input);
  const min = Number(box.dataset.min);
  const max = Number(box.dataset.max);
  const v = Math.min(Math.max(value, min), max);
  input.value = String(v);
  box.querySelector<HTMLButtonElement>('[data-step="-1"]')!.disabled = v <= min;
  box.querySelector<HTMLButtonElement>('[data-step="1"]')!.disabled = v >= max;
}
/** 자녀 수는 부양가족 수 - 1을 넘을 수 없다. */
function syncFamily(): void {
  stepperOf(kids).dataset.max = String(Math.max(0, Number(deps.value) - 1));
  setStepper(deps, Number(deps.value));
  setStepper(kids, Number(kids.value));
}

/* ---------- 입력 읽기 / 쓰기 ---------- */
const readInput = (): SalaryInput => ({
  annualSalary: parseDigits(annual.value),
  monthlyNonTaxable: parseDigits(nontax.value),
  dependents: Number(deps.value) || 1,
  children: Number(kids.value) || 0,
});

function writeInput(i: SalaryInput): void {
  setMoney(annual, i.annualSalary);
  setMoney(nontax, i.monthlyNonTaxable);
  setStepper(deps, i.dependents);
  syncFamily();
  setStepper(kids, i.children);
}

/* ---------- 계산·표시 ---------- */
function showError(message: string | null): void {
  const fieldError = document.getElementById('annual-error')!;
  fieldError.hidden = !message;
  fieldError.textContent = message ?? '';
  annual.setAttribute('aria-invalid', message ? 'true' : 'false');
  heroError.hidden = !message;
  heroError.textContent = message ?? '';
  hero.dataset.state = message ? 'error' : '';
}

function applyView(view: ReturnType<typeof viewOf> | null): void {
  document.querySelectorAll<HTMLElement>('[data-out]').forEach((el) => {
    const key = el.dataset.out!;
    setText(el, view ? (view.out[key] ?? el.textContent ?? '') : '-');
  });
  for (const { key } of [...DEDUCTION_ROWS, ...TOTAL_ROWS]) {
    const tr = document.querySelector(`[data-row="${key}"]`);
    if (!tr) continue;
    setText(tr.querySelector('[data-amount]')!, view ? view.rows[key].amount : '-');
    setText(tr.querySelector('[data-ratio]')!, view ? view.rows[key].ratio : '-');
  }
}

/** set 칩(예: 식대 20만)은 현재 값과 같을 때 선택 상태로 보여 준다. */
function syncChips(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-chip-set]').forEach((chip) => {
    const target = $(chip.dataset.chipTarget!);
    chip.setAttribute('aria-pressed', String(parseDigits(target.value) === Number(chip.dataset.chipSet)));
  });
}

function update(): void {
  const input = readInput();
  syncChips();
  const error = validateSalary(input);
  showError(error);
  if (error) {
    applyView(null);
    note.hidden = true;
    last = null;
  } else {
    const result = calculateSalary(input);
    applyView(viewOf(result));
    note.hidden = !(input.monthlyNonTaxable > result.monthlyNonTaxable);
    last = { input, net: result.monthlyNet };
  }
  try {
    history.replaceState(null, '', `${location.pathname}${toSalaryQuery(input)}${location.hash}`);
  } catch { /* file:// 등에서는 무시 */ }
}

let timer = 0;
const updateSoon = (): void => {
  clearTimeout(timer);
  timer = window.setTimeout(update, 150);
};

/* ---------- 토스트·복사·공유 ---------- */
let toastTimer = 0;
function toast(message: string): void {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove('show'), 2000);
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* 복사 실패 */ }
    ta.remove();
    return ok;
  }
}

const shareUrl = (): string => `${location.origin}${location.pathname}${toSalaryQuery(readInput())}`;

/* ---------- 이벤트 ---------- */
form.addEventListener('input', (e) => {
  const t = e.target as HTMLInputElement;
  if (t.hasAttribute('data-money')) formatMoney(t);
  updateSoon();
});
form.addEventListener('submit', (e) => {
  e.preventDefault();
  update();
});

document.querySelectorAll<HTMLButtonElement>('[data-chip-target]').forEach((chip) => {
  chip.addEventListener('click', () => {
    const target = $(chip.dataset.chipTarget!);
    const add = chip.dataset.chipAdd;
    setMoney(target, add !== undefined ? parseDigits(target.value) + Number(add) : Number(chip.dataset.chipSet));
    update();
  });
});

document.querySelectorAll<HTMLElement>('[data-stepper]').forEach((box) => {
  const input = box.querySelector<HTMLInputElement>('input')!;
  const move = (d: number): void => {
    setStepper(input, Number(input.value) + d);
    if (input === deps) syncFamily();
    update();
  };
  box.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((b) => b.addEventListener('click', () => move(Number(b.dataset.step))));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); move(1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); move(-1); }
  });
});

document.querySelector('[data-reset]')?.addEventListener('click', () => {
  writeInput(SALARY_DEFAULTS);
  update();
  toast('기본값으로 되돌렸어요');
});

document.querySelector('[data-copy-result]')?.addEventListener('click', async () => {
  if (!last) return toast('연봉을 먼저 올바르게 입력해 주세요');
  const text = `월 실수령액 ${won(last.net)} (연봉 ${koreanAmount(last.input.annualSalary, true)} 기준, ${SITE_NAME})`;
  toast((await copyText(text)) ? '결과를 복사했어요' : '복사하지 못했어요. 직접 선택해 복사해 주세요');
});

document.querySelector('[data-share-link]')?.addEventListener('click', async () => {
  if (!last) return toast('연봉을 먼저 올바르게 입력해 주세요');
  const url = shareUrl();
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: document.title, text: `월 실수령액 ${won(last.net)} (연봉 ${koreanAmount(last.input.annualSalary, true)} 기준)`, url });
      return;
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return;
    }
  }
  toast((await copyText(url)) ? '링크를 복사했어요' : '복사하지 못했어요');
});

/* 모바일 하단 미니 결과바: 핵심 결과가 화면 밖일 때만 */
if (stickyBar && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => stickyBar.classList.toggle('show', !entry.isIntersecting)).observe(hero);
}

/* 시작: 공유 링크(쿼리)가 있으면 복원하고, 없으면 HTML에 미리 렌더링된 기본값을 그대로 둔다 */
if (location.search) writeInput(parseSalaryQuery(location.search));
syncFamily();
update();
