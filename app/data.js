/* おうち家計簿 — data.js: 家計データの持ち方。localStorage に保存し、初回は現実的なサンプルを入れる。 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'ouchi-kakeibo-v1';

  /* 支出カテゴリと色。円グラフ・棒グラフ・予算で同じ色を使う。 */
  var EXPENSE_CATEGORIES = [
    { id: 'food',      name: '食費',     color: '#2f6b4f' },
    { id: 'housing',   name: '住居費',   color: '#3a6ea5' },
    { id: 'utility',   name: '光熱費',   color: '#d98e2b' },
    { id: 'transport', name: '交通費',   color: '#7a5ea8' },
    { id: 'comms',     name: '通信費',   color: '#4f9a94' },
    { id: 'fun',       name: '娯楽',     color: '#c65d7b' },
    { id: 'medical',   name: '医療',     color: '#8a6d3b' },
    { id: 'education', name: '教育',     color: '#5b7a3a' },
    { id: 'daily',     name: '日用品',   color: '#6f675c' },
    { id: 'other',     name: 'その他',   color: '#b0a58e' }
  ];

  var INCOME_CATEGORIES = [
    { id: 'salary', name: '給与' },
    { id: 'bonus',  name: '賞与' },
    { id: 'side',   name: '副収入' },
    { id: 'other-in', name: 'その他収入' }
  ];

  var CATEGORY_BY_ID = {};
  EXPENSE_CATEGORIES.concat(INCOME_CATEGORIES).forEach(function (c) { CATEGORY_BY_ID[c.id] = c; });

  /* カテゴリごとの月予算（円）。予算ページの初期値。 */
  var DEFAULT_BUDGETS = {
    food: 65000, housing: 95000, utility: 18000, transport: 15000,
    comms: 12000, fun: 20000, medical: 10000, education: 15000,
    daily: 12000, other: 10000
  };

  /* サンプル明細：2026年6月〜11月。11月は今月分として細かく、過去月は月ごとの合計が推移グラフに現れる量。 */
  function sampleEntries() {
    var rows = [];
    var id = 1;
    function add(date, type, category, amount, memo) {
      rows.push({ id: 's' + (id++), date: date, type: type, category: category, amount: amount, memo: memo });
    }
    /* 6〜10月：月ごとの収支の流れを作る */
    add('2026-06-25', 'income', 'salary', 385000, '6月分 給与');
    add('2026-06-05', 'expense', 'housing', 95000, '家賃');
    add('2026-06-08', 'expense', 'food', 58200, '食費まとめ');
    add('2026-06-10', 'expense', 'utility', 16400, '電気・ガス・水道');
    add('2026-06-12', 'expense', 'transport', 12800, '定期代・ガソリン');
    add('2026-06-20', 'expense', 'fun', 18400, '映画と外食');
    add('2026-06-22', 'expense', 'daily', 9600, '日用品');
    add('2026-07-25', 'income', 'salary', 385000, '7月分 給与');
    add('2026-07-05', 'expense', 'housing', 95000, '家賃');
    add('2026-07-09', 'expense', 'food', 61400, '食費まとめ');
    add('2026-07-11', 'expense', 'utility', 19800, '電気・ガス・水道（夏）');
    add('2026-07-14', 'expense', 'transport', 14200, '定期代・ガソリン');
    add('2026-07-18', 'expense', 'education', 12000, '子どもの習い事');
    add('2026-07-24', 'expense', 'fun', 22100, '夏休みのレジャー');
    add('2026-08-25', 'income', 'salary', 385000, '8月分 給与');
    add('2026-08-05', 'expense', 'housing', 95000, '家賃');
    add('2026-08-08', 'expense', 'food', 66800, '食費まとめ（お盆）');
    add('2026-08-11', 'expense', 'utility', 21300, '電気・ガス・水道（夏）');
    add('2026-08-15', 'expense', 'transport', 18600, '帰省の交通費');
    add('2026-08-19', 'expense', 'fun', 24800, 'お盆のレジャー');
    add('2026-08-23', 'expense', 'medical', 8400, '歯科検診');
    add('2026-09-25', 'income', 'salary', 385000, '9月分 給与');
    add('2026-09-05', 'expense', 'housing', 95000, '家賃');
    add('2026-09-09', 'expense', 'food', 59600, '食費まとめ');
    add('2026-09-12', 'expense', 'utility', 17200, '電気・ガス・水道');
    add('2026-09-16', 'expense', 'transport', 13400, '定期代・ガソリン');
    add('2026-09-20', 'expense', 'comms', 11800, 'スマホ・ネット');
    add('2026-09-26', 'expense', 'education', 12000, '子どもの習い事');
    add('2026-10-25', 'income', 'salary', 385000, '10月分 給与');
    add('2026-10-05', 'expense', 'housing', 95000, '家賃');
    add('2026-10-08', 'expense', 'food', 63100, '食費まとめ');
    add('2026-10-11', 'expense', 'utility', 15800, '電気・ガス・水道');
    add('2026-10-14', 'expense', 'transport', 14700, '定期代・ガソリン');
    add('2026-10-21', 'expense', 'daily', 11300, '日用品');
    add('2026-10-24', 'expense', 'fun', 16900, '家族で外食');
    /* 11月：今月分。明細ページで1件ずつ見られる細かさで入れる */
    add('2026-11-25', 'income', 'salary', 385000, '11月分 給与');
    add('2026-11-10', 'income', 'side', 18000, 'フリマ売上');
    add('2026-11-05', 'expense', 'housing', 95000, '家賃');
    add('2026-11-01', 'expense', 'food', 12480, 'スーパー（週末まとめ買い）');
    add('2026-11-03', 'expense', 'food', 8320, 'スーパー');
    add('2026-11-07', 'expense', 'food', 9860, 'スーパーとお米');
    add('2026-11-10', 'expense', 'food', 7420, 'スーパー');
    add('2026-11-14', 'expense', 'food', 11240, 'スーパー（週末まとめ買い）');
    add('2026-11-18', 'expense', 'food', 6890, 'スーパー');
    add('2026-11-21', 'expense', 'food', 9540, 'スーパーとお惣菜');
    add('2026-11-12', 'expense', 'utility', 17200, '電気・ガス・水道');
    add('2026-11-06', 'expense', 'transport', 6800, 'ガソリン');
    add('2026-11-16', 'expense', 'transport', 6400, '定期代');
    add('2026-11-09', 'expense', 'comms', 11800, 'スマホ・ネット');
    add('2026-11-15', 'expense', 'education', 12000, '子どもの習い事');
    add('2026-11-08', 'expense', 'fun', 8600, '家族で映画');
    add('2026-11-22', 'expense', 'fun', 7400, '外食（ランチ）');
    add('2026-11-13', 'expense', 'daily', 5800, '日用品');
    add('2026-11-19', 'expense', 'medical', 3200, '風邪薬とマスク');
    add('2026-11-24', 'expense', 'other', 4500, '子どもの文房具');
    return rows;
  }

  function loadState() {
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.entries)) return parsed;
      }
    } catch (e) { /* 保存が読めなければサンプルから始める */ }
    return { entries: sampleEntries(), budgets: Object.assign({}, DEFAULT_BUDGETS) };
  }

  function saveState(state) {
    try { global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* 保存できない環境では画面だけ動く */ }
  }

  /* ---- 集計ヘルパー ---- */
  function monthOf(date) { return String(date).slice(0, 7); } /* '2026-11' */

  function monthLabel(ym) {
    var parts = ym.split('-');
    return Number(parts[0]) + '年' + Number(parts[1]) + '月';
  }

  function entriesInMonth(entries, ym) {
    return entries.filter(function (e) { return monthOf(e.date) === ym; });
  }

  function sumByType(entries, type) {
    return entries.reduce(function (sum, e) { return e.type === type ? sum + e.amount : sum; }, 0);
  }

  function sumByCategory(entries, type) {
    var out = {};
    entries.forEach(function (e) {
      if (e.type !== type) return;
      out[e.category] = (out[e.category] || 0) + e.amount;
    });
    return out;
  }

  /* 過去 n か月の 'YYYY-MM' を古い順に返す */
  function lastMonths(ym, n) {
    var y = Number(ym.slice(0, 4));
    var m = Number(ym.slice(5, 7));
    var out = [];
    for (var i = n - 1; i >= 0; i--) {
      var d = new Date(y, m - 1 - i, 1);
      out.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
    }
    return out;
  }

  function shiftMonth(ym, delta) {
    var d = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1 + delta, 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function formatYen(n) {
    return '¥' + Number(n).toLocaleString('ja-JP');
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  global.KakeiboData = {
    STORAGE_KEY: STORAGE_KEY,
    EXPENSE_CATEGORIES: EXPENSE_CATEGORIES,
    INCOME_CATEGORIES: INCOME_CATEGORIES,
    CATEGORY_BY_ID: CATEGORY_BY_ID,
    DEFAULT_BUDGETS: DEFAULT_BUDGETS,
    loadState: loadState,
    saveState: saveState,
    monthOf: monthOf,
    monthLabel: monthLabel,
    entriesInMonth: entriesInMonth,
    sumByType: sumByType,
    sumByCategory: sumByCategory,
    lastMonths: lastMonths,
    shiftMonth: shiftMonth,
    formatYen: formatYen,
    escapeHtml: escapeHtml
  };
})(window);
