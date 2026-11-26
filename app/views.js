/* おうち家計簿 — views.js: 4ページの描画。ダッシュボード・明細・分析・予算。 */
(function (global) {
  'use strict';

  var D = global.KakeiboData;
  var C = global.KakeiboCharts;

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function monthBar(ym, onChange) {
    var bar = el(
      '<div class="month-bar">' +
        '<button class="btn" type="button" data-shift="-1" aria-label="前の月">‹ 前月</button>' +
        '<span class="month-label">' + D.monthLabel(ym) + '</span>' +
        '<button class="btn" type="button" data-shift="1" aria-label="次の月">次月 ›</button>' +
        '<button class="btn" type="button" data-shift="0">今月に戻る</button>' +
      '</div>'
    );
    bar.querySelectorAll('button[data-shift]').forEach(function (b) {
      b.addEventListener('click', function () {
        var shift = Number(b.getAttribute('data-shift'));
        onChange(shift === 0 ? currentMonth() : D.shiftMonth(ym, shift));
      });
    });
    return bar;
  }

  function currentMonth() {
    var now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  }

  /* 今月はサンプルが2026年11月までなので、実日付がそれより先なら11月を既定にする */
  function defaultMonth(state) {
    var latest = state.entries.reduce(function (m, e) {
      return D.monthOf(e.date) > m ? D.monthOf(e.date) : m;
    }, '0000-00');
    var now = currentMonth();
    return now <= latest ? now : latest;
  }

  function summaryCards(income, expense) {
    var balance = income - expense;
    var rate = income > 0 ? Math.round(balance / income * 100) : 0;
    var pillClass = rate >= 15 ? '' : ' low';
    var pillText = rate >= 15
      ? '貯蓄率 ' + rate + '% — 順調です'
      : '貯蓄率 ' + rate + '% — 支出を見直すと余裕が生まれます';
    return el(
      '<div class="grid grid-3">' +
        '<section class="card stat-income"><div class="stat-label">今月の収入</div>' +
          '<div class="stat-value"><span class="yen">¥</span>' + income.toLocaleString('ja-JP') + '</div>' +
          '<div class="stat-sub">給与・副収入の合計</div></section>' +
        '<section class="card stat-expense"><div class="stat-label">今月の支出</div>' +
          '<div class="stat-value"><span class="yen">¥</span>' + expense.toLocaleString('ja-JP') + '</div>' +
          '<div class="stat-sub">家計の出費の合計</div></section>' +
        '<section class="card stat-balance"><div class="stat-label">今月の残高</div>' +
          '<div class="stat-value"><span class="yen">¥</span>' + balance.toLocaleString('ja-JP') + '</div>' +
          '<span class="saving-pill' + pillClass + '">' + pillText + '</span></section>' +
      '</div>'
    );
  }

  function entryRows(entries) {
    if (!entries.length) return '<p class="empty">この条件の明細はまだありません。「明細を追加」から記録してみましょう。</p>';
    var rows = entries.map(function (e) {
      var cat = D.CATEGORY_BY_ID[e.category] || { name: e.category };
      var cls = e.type === 'income' ? 'amount-in' : 'amount-out';
      var sign = e.type === 'income' ? '+' : '−';
      return '<tr>' +
        '<td>' + D.escapeHtml(e.date) + '</td>' +
        '<td><span class="tag' + (e.type === 'expense' ? ' expense' : '') + '">' + D.escapeHtml(cat.name) + '</span></td>' +
        '<td class="num ' + cls + '">' + sign + D.formatYen(e.amount) + '</td>' +
        '<td class="memo">' + D.escapeHtml(e.memo || '') + '</td>' +
        '<td><button class="btn btn-small" type="button" data-edit="' + e.id + '">編集</button> ' +
        '<button class="btn btn-small btn-danger" type="button" data-delete="' + e.id + '">削除</button></td>' +
      '</tr>';
    }).join('');
    return '<table><thead><tr><th>日付</th><th>カテゴリ</th><th class="num">金額</th><th>メモ</th><th>操作</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  /* ---- ダッシュボード ---- */
  function renderDashboard(app, state, ctx) {
    var ym = ctx.month;
    var monthEntries = D.entriesInMonth(state.entries, ym);
    var income = D.sumByType(monthEntries, 'income');
    var expense = D.sumByType(monthEntries, 'expense');
    var byCat = D.sumByCategory(monthEntries, 'expense');
    var catItems = D.EXPENSE_CATEGORIES
      .map(function (c) { return { label: c.name, value: byCat[c.id] || 0, color: c.color }; })
      .filter(function (it) { return it.value > 0; })
      .sort(function (a, b) { return b.value - a.value; });

    var page = el('<div></div>');
    page.appendChild(el('<h1 class="page-title">ダッシュボード</h1>'));
    page.appendChild(el('<p class="page-lead">今月の家計の全体像。収入・支出・残高と、使い道の内訳がひと目でわかります。</p>'));
    page.appendChild(monthBar(ym, function (next) { ctx.setMonth(next); }));
    page.appendChild(summaryCards(income, expense));

    var main = el('<div class="grid grid-main" style="margin-top:16px"></div>');

    var trendCard = el('<section class="card"><h2>収支の推移（6か月）</h2></section>');
    var months = D.lastMonths(ym, 6);
    var points = months.map(function (m) {
      var es = D.entriesInMonth(state.entries, m);
      var inc = D.sumByType(es, 'income');
      var exp = D.sumByType(es, 'expense');
      return { label: Number(m.slice(5, 7)) + '月', income: inc, expense: exp, balance: inc - exp };
    });
    var trendWrap = el('<div class="chart-wrap"></div>');
    trendWrap.appendChild(C.trendChart(points));
    trendCard.appendChild(trendWrap);
    trendCard.appendChild(el(
      '<p class="hint"><span style="color:#2f6b4f;font-weight:700">— 収入</span>　<span style="color:#b4442f;font-weight:700">— 支出</span>　<span style="color:#d98e2b;font-weight:700">— 残高</span>　8月は帰省で支出が増え、残高が細りました。</p>'
    ));
    main.appendChild(trendCard);

    var donutCard = el('<section class="card"><h2>今月の支出の内訳</h2></section>');
    var donutWrap = el('<div class="chart-wrap"></div>');
    donutWrap.appendChild(C.donutChart(catItems, '今月の支出', D.formatYen(expense)));
    donutCard.appendChild(donutWrap);
    var legend = document.createElement('ul');
    legend.className = 'legend';
    catItems.slice(0, 8).forEach(function (it) {
      var li = document.createElement('li');
      var sw = document.createElement('span');
      sw.className = 'swatch';
      sw.style.background = it.color;
      li.appendChild(sw);
      li.appendChild(document.createTextNode(it.label + ' '));
      var amt = document.createElement('span');
      amt.className = 'amt';
      amt.textContent = D.formatYen(it.value);
      li.appendChild(amt);
      legend.appendChild(li);
    });
    donutCard.appendChild(legend);
    donutCard.appendChild(el('<p class="hint">住居費が最大の固定費。食費は週ごとの買い物が積み上がっています。</p>'));
    main.appendChild(donutCard);
    page.appendChild(main);

    var recent = monthEntries.slice().sort(function (a, b) { return b.date.localeCompare(a.date) || b.id.localeCompare(a.id); }).slice(0, 8);
    var recentCard = el('<section class="card" style="margin-top:16px"><h2>今月の明細（新しい順・上位8件）</h2></section>');
    recentCard.insertAdjacentHTML('beforeend', entryRows(recent));
    recentCard.appendChild(el('<p class="hint" style="margin-top:10px"><a href="#/entries">明細ページで全件を見る・追加する →</a></p>'));
    page.appendChild(recentCard);

    app.appendChild(page);
    wireEntryButtons(page, ctx);
  }

  /* ---- 明細 ---- */
  function renderEntries(app, state, ctx) {
    var ym = ctx.month;
    var page = el('<div></div>');
    page.appendChild(el('<h1 class="page-title">明細</h1>'));
    page.appendChild(el('<p class="page-lead">収入と支出を1件ずつ記録します。追加・編集・削除はすぐに保存されます。</p>'));
    page.appendChild(monthBar(ym, function (next) { ctx.setMonth(next); }));

    var formCard = el('<section class="card" style="margin-bottom:16px"><h2 id="form-title">明細を追加</h2></section>');
    formCard.appendChild(entryForm(state, ctx, null));
    page.appendChild(formCard);

    var listCard = el('<section class="card"><h2>' + D.monthLabel(ym) + 'の明細</h2></section>');
    var filter = el(
      '<div class="filter-row">' +
        '<div class="field"><label for="f-cat">カテゴリで絞る</label>' +
        '<select id="f-cat"><option value="">すべて</option></select></div>' +
        '<div class="field"><label for="f-type">種類で絞る</label>' +
        '<select id="f-type"><option value="">すべて</option><option value="expense">支出のみ</option><option value="income">収入のみ</option></select></div>' +
      '</div>'
    );
    var catSel = filter.querySelector('#f-cat');
    D.EXPENSE_CATEGORIES.concat(D.INCOME_CATEGORIES).forEach(function (c) {
      var o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.name;
      catSel.appendChild(o);
    });
    listCard.appendChild(filter);
    var listWrap = el('<div></div>');
    listCard.appendChild(listWrap);
    page.appendChild(listCard);

    function refreshList() {
      var cat = catSel.value;
      var type = filter.querySelector('#f-type').value;
      var rows = D.entriesInMonth(state.entries, ym)
        .filter(function (e) { return (!cat || e.category === cat) && (!type || e.type === type); })
        .sort(function (a, b) { return b.date.localeCompare(a.date) || b.id.localeCompare(a.id); });
      listWrap.innerHTML = '';
      listWrap.insertAdjacentHTML('beforeend', entryRows(rows));
      var total = rows.reduce(function (s, e) { return s + (e.type === 'income' ? e.amount : -e.amount); }, 0);
      listWrap.insertAdjacentHTML('beforeend',
        '<p class="hint" style="margin-top:10px">' + rows.length + '件 · この条件の収支合計 ' + D.formatYen(total) + '</p>');
      wireEntryButtons(listWrap, ctx, function () {
        ctx.refresh();
      });
    }
    catSel.addEventListener('change', refreshList);
    filter.querySelector('#f-type').addEventListener('change', refreshList);
    refreshList();

    app.appendChild(page);
    wireEntryButtons(page, ctx);
  }

  function entryForm(state, ctx, editing) {
    var form = el(
      '<form id="entry-form">' +
        '<div class="form-grid">' +
          '<div><label>種類</label><div class="type-switch" role="group" aria-label="種類">' +
            '<button type="button" class="t-expense" data-type="expense" aria-pressed="true">支出</button>' +
            '<button type="button" class="t-income" data-type="income" aria-pressed="false">収入</button>' +
          '</div></div>' +
          '<div><label for="e-date">日付</label><input id="e-date" type="date" required></div>' +
          '<div><label for="e-category">カテゴリ</label><select id="e-category"></select></div>' +
          '<div><label for="e-amount">金額（円）</label><input id="e-amount" type="number" min="1" step="1" inputmode="numeric" required placeholder="例：12000"></div>' +
          '<div class="full"><label for="e-memo">メモ</label><input id="e-memo" type="text" maxlength="80" placeholder="例：スーパー（週末まとめ買い）"></div>' +
        '</div>' +
        '<div class="form-actions"><button class="btn btn-primary" type="submit">保存する</button>' +
        '<button class="btn" type="button" id="e-cancel" hidden>キャンセル</button></div>' +
        '<p class="hint" id="e-msg" role="status"></p>' +
      '</form>'
    );
    var type = editing ? editing.type : 'expense';
    var catSel = form.querySelector('#e-category');
    function fillCategories(t) {
      catSel.innerHTML = '';
      (t === 'income' ? D.INCOME_CATEGORIES : D.EXPENSE_CATEGORIES).forEach(function (c) {
        var o = document.createElement('option');
        o.value = c.id;
        o.textContent = c.name;
        catSel.appendChild(o);
      });
    }
    fillCategories(type);
    form.querySelectorAll('.type-switch button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-type') === type));
      b.addEventListener('click', function () {
        type = b.getAttribute('data-type');
        form.querySelectorAll('.type-switch button').forEach(function (x) {
          x.setAttribute('aria-pressed', String(x === b));
        });
        fillCategories(type);
      });
    });

    if (editing) {
      form.querySelector('#e-date').value = editing.date;
      catSel.value = editing.category;
      form.querySelector('#e-amount').value = editing.amount;
      form.querySelector('#e-memo').value = editing.memo || '';
      form.querySelector('#e-cancel').hidden = false;
      form.querySelector('#e-cancel').addEventListener('click', function () { ctx.refresh(); });
    } else {
      form.querySelector('#e-date').value = new Date().toISOString().slice(0, 10);
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var amount = Number(form.querySelector('#e-amount').value);
      var date = form.querySelector('#e-date').value;
      if (!date || !amount || amount <= 0) {
        form.querySelector('#e-msg').textContent = '日付と1円以上の金額を入れてください。';
        return;
      }
      var entry = {
        id: editing ? editing.id : 'u' + Date.now().toString(36),
        date: date,
        type: type,
        category: catSel.value,
        amount: Math.round(amount),
        memo: form.querySelector('#e-memo').value.trim()
      };
      if (editing) {
        var idx = state.entries.findIndex(function (e) { return e.id === editing.id; });
        if (idx >= 0) state.entries[idx] = entry;
      } else {
        state.entries.push(entry);
      }
      D.saveState(state);
      ctx.setMonth(D.monthOf(date));
      ctx.refresh();
    });
    return form;
  }

  function wireEntryButtons(root, ctx, afterDelete) {
    root.querySelectorAll('[data-delete]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-delete');
        var target = ctx.state.entries.find(function (e) { return e.id === id; });
        if (!target) return;
        if (window.confirm(D.formatYen(target.amount) + '（' + (D.CATEGORY_BY_ID[target.category] || {}).name + '）を削除しますか？')) {
          ctx.state.entries = ctx.state.entries.filter(function (e) { return e.id !== id; });
          D.saveState(ctx.state);
          if (afterDelete) afterDelete(); else ctx.refresh();
        }
      });
    });
    root.querySelectorAll('[data-edit]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-edit');
        var target = ctx.state.entries.find(function (e) { return e.id === id; });
        if (!target) return;
        ctx.editEntry(target);
      });
    });
  }

  /* ---- 分析 ---- */
  function renderAnalysis(app, state, ctx) {
    var ym = ctx.month;
    var page = el('<div></div>');
    page.appendChild(el('<h1 class="page-title">分析</h1>'));
    page.appendChild(el('<p class="page-lead">使い道の内訳と前月とのちがいから、家計のクセが見えてきます。</p>'));
    page.appendChild(monthBar(ym, function (next) { ctx.setMonth(next); }));

    var monthEntries = D.entriesInMonth(state.entries, ym);
    var prevEntries = D.entriesInMonth(state.entries, D.shiftMonth(ym, -1));
    var expense = D.sumByType(monthEntries, 'expense');
    var prevExpense = D.sumByType(prevEntries, 'expense');
    var income = D.sumByType(monthEntries, 'income');
    var byCat = D.sumByCategory(monthEntries, 'expense');
    var prevByCat = D.sumByCategory(prevEntries, 'expense');
    var catItems = D.EXPENSE_CATEGORIES
      .map(function (c) { return { label: c.name, value: byCat[c.id] || 0, prev: prevByCat[c.id] || 0, color: c.color }; })
      .sort(function (a, b) { return b.value - a.value; });

    var grid = el('<div class="grid grid-2"></div>');
    var barCard = el('<section class="card"><h2>カテゴリ別支出（今月）</h2></section>');
    barCard.appendChild(C.barList(catItems.filter(function (it) { return it.value > 0; })));
    grid.appendChild(barCard);

    var cmpCard = el('<section class="card"><h2>前月とくらべる</h2></section>');
    var diff = expense - prevExpense;
    var diffText = diff === 0 ? '前月と同じです'
      : diff > 0 ? '前月より ' + D.formatYen(diff) + ' 多いです' : '前月より ' + D.formatYen(-diff) + ' 少ないです';
    cmpCard.insertAdjacentHTML('beforeend',
      '<div class="kv"><span>今月の支出</span><b>' + D.formatYen(expense) + '</b></div>' +
      '<div class="kv"><span>前月の支出</span><b>' + D.formatYen(prevExpense) + '</b></div>' +
      '<div class="kv"><span>ちがい</span><b>' + diffText + '</b></div>' +
      '<div class="kv"><span>今月の収入</span><b>' + D.formatYen(income) + '</b></div>' +
      '<div class="kv"><span>今月の残高</span><b>' + D.formatYen(income - expense) + '</b></div>'
    );
    var biggest = catItems.filter(function (it) { return it.value > 0; })[0];
    if (biggest) {
      var bdiff = biggest.value - biggest.prev;
      cmpCard.appendChild(el('<p class="hint">いちばん大きいのは' + biggest.label + '（' + D.formatYen(biggest.value) + '）。前月とくらべて' +
        (bdiff >= 0 ? '+' : '−') + D.formatYen(Math.abs(bdiff)) + 'です。</p>'));
    }
    grid.appendChild(cmpCard);
    page.appendChild(grid);

    var months = D.lastMonths(ym, 6);
    var tableCard = el('<section class="card" style="margin-top:16px"><h2>月ごとの収支（6か月）</h2></section>');
    var rows = months.map(function (m) {
      var es = D.entriesInMonth(state.entries, m);
      var inc = D.sumByType(es, 'income');
      var exp = D.sumByType(es, 'expense');
      return '<tr><td>' + D.monthLabel(m) + '</td><td class="num amount-in">' + D.formatYen(inc) +
        '</td><td class="num amount-out">' + D.formatYen(exp) +
        '</td><td class="num">' + D.formatYen(inc - exp) + '</td></tr>';
    }).join('');
    tableCard.insertAdjacentHTML('beforeend',
      '<table><thead><tr><th>月</th><th class="num">収入</th><th class="num">支出</th><th class="num">残高</th></tr></thead><tbody>' + rows + '</tbody></table>');
    tableCard.appendChild(el('<p class="hint">8月は帰省で支出がふくらみました。9月以降は支出が落ち着き、残高が回復しています。</p>'));
    page.appendChild(tableCard);

    app.appendChild(page);
  }

  /* ---- 予算 ---- */
  function renderBudget(app, state, ctx) {
    var ym = ctx.month;
    var page = el('<div></div>');
    page.appendChild(el('<h1 class="page-title">予算</h1>'));
    page.appendChild(el('<p class="page-lead">カテゴリごとに月の予算を決め、使いすぎを早めに見つけます。予算はこのブラウザに保存されます。</p>'));
    page.appendChild(monthBar(ym, function (next) { ctx.setMonth(next); }));

    var monthEntries = D.entriesInMonth(state.entries, ym);
    var byCat = D.sumByCategory(monthEntries, 'expense');
    var totalBudget = D.EXPENSE_CATEGORIES.reduce(function (s, c) { return s + (state.budgets[c.id] || 0); }, 0);
    var totalSpent = D.sumByType(monthEntries, 'expense');

    var summary = el(
      '<div class="grid grid-3" style="margin-bottom:16px">' +
        '<section class="card"><div class="stat-label">予算の合計</div><div class="stat-value"><span class="yen">¥</span>' + totalBudget.toLocaleString('ja-JP') + '</div></section>' +
        '<section class="card"><div class="stat-label">今月の支出</div><div class="stat-value"><span class="yen">¥</span>' + totalSpent.toLocaleString('ja-JP') + '</div></section>' +
        '<section class="card"><div class="stat-label">予算の残り</div><div class="stat-value"><span class="yen">¥</span>' + (totalBudget - totalSpent).toLocaleString('ja-JP') + '</div>' +
        '<div class="stat-sub">' + (totalBudget > 0 ? Math.round(totalSpent / totalBudget * 100) + '% 使用中' : '') + '</div></section>' +
      '</div>'
    );
    page.appendChild(summary);

    var card = el('<section class="card"><h2>' + D.monthLabel(ym) + 'の予算と実績</h2></section>');
    D.EXPENSE_CATEGORIES.forEach(function (c) {
      var budget = state.budgets[c.id] || 0;
      var spent = byCat[c.id] || 0;
      var pct = budget > 0 ? Math.min(100, Math.round(spent / budget * 100)) : 0;
      var cls = spent > budget ? ' over' : (pct >= 80 ? ' warn' : '');
      var note = spent > budget
        ? '予算を ' + D.formatYen(spent - budget) + ' オーバーしています。'
        : '残り ' + D.formatYen(budget - spent) + ' です。';
      var row = el(
        '<div class="budget-row">' +
          '<div class="budget-head"><span><span class="tag">' + D.escapeHtml(c.name) + '</span></span>' +
          '<span><b>' + D.formatYen(spent) + '</b> / ' + D.formatYen(budget) + '（' + pct + '%）</span></div>' +
          '<div class="progress-track"><div class="progress-fill' + cls + '" style="width:' + pct + '%"></div></div>' +
          '<div class="budget-note">' + note + '</div>' +
        '</div>'
      );
      card.appendChild(row);
    });
    card.appendChild(el('<p class="hint">予算を変えるには、下のフォームでカテゴリと金額を入れて保存してください。</p>'));
    page.appendChild(card);

    var editCard = el('<section class="card" style="margin-top:16px"><h2>予算を決める</h2></section>');
    var form = el(
      '<form id="budget-form"><div class="form-grid">' +
        '<div><label for="b-cat">カテゴリ</label><select id="b-cat"></select></div>' +
        '<div><label for="b-amount">月の予算（円）</label><input id="b-amount" type="number" min="0" step="500" inputmode="numeric" required></div>' +
      '</div><div class="form-actions"><button class="btn btn-primary" type="submit">予算を保存する</button></div>' +
      '<p class="hint" role="status" id="b-msg"></p></form>'
    );
    var bSel = form.querySelector('#b-cat');
    D.EXPENSE_CATEGORIES.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.name;
      bSel.appendChild(o);
    });
    bSel.addEventListener('change', function () {
      form.querySelector('#b-amount').value = state.budgets[bSel.value] || 0;
    });
    form.querySelector('#b-amount').value = state.budgets[bSel.value] || 0;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var amt = Number(form.querySelector('#b-amount').value);
      if (isNaN(amt) || amt < 0) {
        form.querySelector('#b-msg').textContent = '0円以上の金額を入れてください。';
        return;
      }
      state.budgets[bSel.value] = Math.round(amt);
      D.saveState(state);
      form.querySelector('#b-msg').textContent = (D.CATEGORY_BY_ID[bSel.value] || {}).name + 'の予算を ' + D.formatYen(amt) + ' にしました。';
      ctx.refresh();
    });
    editCard.appendChild(form);
    page.appendChild(editCard);

    app.appendChild(page);
  }

  global.KakeiboViews = {
    renderDashboard: renderDashboard,
    renderEntries: renderEntries,
    renderAnalysis: renderAnalysis,
    renderBudget: renderBudget,
    entryForm: entryForm,
    defaultMonth: defaultMonth,
    currentMonth: currentMonth
  };
})(window);
