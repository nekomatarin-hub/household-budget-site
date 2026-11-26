/* おうち家計簿 — charts.js: 手書き SVG グラフ。外部ライブラリなしで円・棒・折れ線を描く。 */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  function svgEl(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  function polar(cx, cy, r, angleDeg) {
    var a = (angleDeg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }

  /* カテゴリ別ドーナツ。items: [{label, value, color}]。中心に合計を表示する。 */
  function donutChart(items, totalLabel, totalValue) {
    var size = 260;
    var cx = size / 2, cy = size / 2, r = 96, hole = 58;
    var svg = svgEl('svg', { viewBox: '0 0 ' + size + ' ' + size, role: 'img', 'aria-label': 'カテゴリ別支出の円グラフ' });
    var total = items.reduce(function (s, it) { return s + it.value; }, 0);
    if (total <= 0) {
      var circle = svgEl('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: '#e6ddcb', 'stroke-width': 34 });
      svg.appendChild(circle);
    } else {
      var start = 0;
      items.forEach(function (it) {
        var frac = it.value / total;
        var end = start + frac * 360;
        var large = (end - start) > 180 ? 1 : 0;
        var p1 = polar(cx, cy, r, start);
        var p2 = polar(cx, cy, r, end - 0.6); /* すき間を少し空ける */
        var path = svgEl('path', {
          d: 'M ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) +
             ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1),
          fill: 'none', stroke: it.color, 'stroke-width': 34
        });
        svg.appendChild(path);
        start = end;
      });
      /* 内側の白い円でドーナツにする */
      var inner = svgEl('circle', { cx: cx, cy: cy, r: hole, fill: '#fffdf8' });
      svg.appendChild(inner);
    }
    var label = svgEl('text', { x: cx, y: cy - 8, 'text-anchor': 'middle', 'font-size': 13, fill: '#6f675c' });
    label.textContent = totalLabel;
    var value = svgEl('text', { x: cx, y: cy + 18, 'text-anchor': 'middle', 'font-size': 19, 'font-weight': 700, fill: '#2b2620' });
    value.textContent = totalValue;
    svg.appendChild(label);
    svg.appendChild(value);
    return svg;
  }

  /* 月別収支の折れ線。points: [{label, income, expense, balance}]。収入・支出・残高の3本。 */
  function trendChart(points) {
    var W = 640, H = 260, padL = 64, padR = 16, padT = 18, padB = 34;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': '月ごとの収支の推移グラフ' });
    var maxV = 0;
    points.forEach(function (p) {
      maxV = Math.max(maxV, p.income, p.expense, Math.abs(p.balance));
    });
    maxV = Math.max(maxV, 50000);
    var maxRounded = Math.ceil(maxV / 100000) * 100000;
    function x(i) { return padL + (W - padL - padR) * (points.length === 1 ? 0.5 : i / (points.length - 1)); }
    function y(v) { return padT + (H - padT - padB) * (1 - v / maxRounded); }

    /* 横グリッド線と目盛り */
    [0, 0.5, 1].forEach(function (f) {
      var gy = y(maxRounded * f);
      svg.appendChild(svgEl('line', { x1: padL, y1: gy, x2: W - padR, y2: gy, stroke: '#e6ddcb', 'stroke-width': 1 }));
      var t = svgEl('text', { x: padL - 8, y: gy + 4, 'text-anchor': 'end', 'font-size': 11, fill: '#6f675c' });
      t.textContent = '¥' + Math.round(maxRounded * f / 1000) + 'k';
      svg.appendChild(t);
    });
    /* ゼロ線 */
    svg.appendChild(svgEl('line', { x1: padL, y1: y(0), x2: W - padR, y2: y(0), stroke: '#cfc4ae', 'stroke-width': 1 }));

    function lineFor(key, color, width) {
      var d = points.map(function (p, i) {
        return (i === 0 ? 'M ' : 'L ') + x(i).toFixed(1) + ' ' + y(p[key]).toFixed(1);
      }).join(' ');
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      points.forEach(function (p, i) {
        svg.appendChild(svgEl('circle', { cx: x(i), cy: y(p[key]), r: 3.5, fill: color, stroke: '#fffdf8', 'stroke-width': 1.5 }));
      });
    }
    lineFor('income', '#2f6b4f', 2.5);
    lineFor('expense', '#b4442f', 2.5);
    lineFor('balance', '#d98e2b', 2);

    points.forEach(function (p, i) {
      var t = svgEl('text', { x: x(i), y: H - 10, 'text-anchor': 'middle', 'font-size': 12, fill: '#6f675c' });
      t.textContent = p.label;
      svg.appendChild(t);
    });
    return svg;
  }

  /* 凡例つきの横棒グラフ。items: [{label, value, color}]。最大値を100%にする。 */
  function barList(items) {
    var wrap = document.createElement('div');
    var max = Math.max.apply(null, items.map(function (it) { return it.value; }).concat([1]));
    items.forEach(function (it) {
      var row = document.createElement('div');
      row.className = 'bar-row';
      var name = document.createElement('span');
      name.textContent = it.label;
      var track = document.createElement('div');
      track.className = 'bar-track';
      var fill = document.createElement('div');
      fill.className = 'bar-fill';
      fill.style.width = Math.max(2, Math.round(it.value / max * 100)) + '%';
      fill.style.background = it.color;
      track.appendChild(fill);
      var amt = document.createElement('span');
      amt.className = 'bar-amt';
      amt.textContent = global.KakeiboData.formatYen(it.value);
      row.appendChild(name);
      row.appendChild(track);
      row.appendChild(amt);
      wrap.appendChild(row);
    });
    return wrap;
  }

  global.KakeiboCharts = {
    donutChart: donutChart,
    trendChart: trendChart,
    barList: barList
  };
})(window);
