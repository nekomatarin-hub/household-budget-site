/* おうち家計簿 — main.js: 起動とページ切り替え。ハッシュで4ページを切り替える。 */
(function () {
  'use strict';

  var D = window.KakeiboData;
  var V = window.KakeiboViews;

  var state = D.loadState();
  var month = V.defaultMonth(state);
  var editingEntry = null;

  var app = document.getElementById('app');

  function setActiveNav(route) {
    document.querySelectorAll('.main-nav a').forEach(function (a) {
      var on = a.getAttribute('data-nav') === route;
      if (on) a.classList.add('active'); else a.classList.remove('active');
    });
  }

  function ctx() {
    return {
      state: state,
      month: month,
      setMonth: function (next) { month = next; render(); },
      refresh: function () { render(); },
      editEntry: function (entry) {
        editingEntry = entry;
        render();
        var title = document.getElementById('form-title');
        if (title) title.textContent = '明細を編集';
        var formCard = document.querySelector('#entry-form');
        if (formCard) formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
  }

  function render() {
    var hash = window.location.hash || '#/';
    var route = hash.replace(/^#\/?/, '').split('/')[0] || 'dashboard';
    var c = ctx();
    app.innerHTML = '';
    if (route === 'entries') {
      setActiveNav('entries');
      if (editingEntry) {
        /* 編集フォーム付きで明細ページを描く */
        V.renderEntries(app, state, c);
        var card = document.querySelector('#entry-form');
        if (card) {
          var formCard = card.closest('.card');
          var title = document.getElementById('form-title');
          if (title) title.textContent = '明細を編集';
          formCard.replaceChild(V.entryForm(state, c, editingEntry), card);
          editingEntry = null;
        }
      } else {
        V.renderEntries(app, state, c);
      }
    } else if (route === 'analysis') {
      setActiveNav('analysis');
      V.renderAnalysis(app, state, c);
    } else if (route === 'budget') {
      setActiveNav('budget');
      V.renderBudget(app, state, c);
    } else {
      setActiveNav('dashboard');
      V.renderDashboard(app, state, c);
    }
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', function () {
    editingEntry = null;
    render();
  });

  render();
})();
