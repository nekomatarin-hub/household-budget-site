# おうち家計簿

[![make.fun bounty](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/nekomatarin-hub/household-budget-site/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/nekomatarin-hub/household-budget-site/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)

家族の家計をひと目で確かめられる、ブラウザだけで動く家計簿サイト。収入と支出を記録し、月ごとの収支・カテゴリ別の使い道・予算の進み具合を表示します。データはこのブラウザの localStorage にだけ保存され、外部には送られません。

## できること

- **ダッシュボード** — 今月の収入・支出・残高と貯蓄率、6か月の収支推移（折れ線）、カテゴリ別支出の円グラフ、最近の明細
- **明細** — 収入・支出の追加（日付・カテゴリ・金額・メモ）、編集・削除、月とカテゴリでの絞り込み
- **分析** — カテゴリ別支出の棒グラフ、前月との比較、6か月分の収支表
- **予算** — カテゴリごとの月予算と実績の進捗バー、予算の編集（オーバーは赤で警告）

## 使い方

`app/index.html` をブラウザで開くだけで動きます。ネットワークは不要です。初回は 2026年6月〜11月の現実的なサンプルデータが入ります。

開発用サーバで開く場合：

```sh
node serve.ts
# http://localhost:8080
```

## 構成

- `app/index.html` — 画面の骨組み（4ページをハッシュで切り替え）
- `app/style.css` — 見た目（暖かい紙色と深緑のデザイン、スマホ対応）
- `app/data.js` — カテゴリ・サンプルデータ・localStorage 保存・集計ヘルパー
- `app/charts.js` — 手書き SVG グラフ（ドーナツ・棒・折れ線、外部ライブラリなし）
- `app/views.js` — 4ページの描画（ダッシュボード・明細・分析・予算）
- `app/main.js` — 起動とページ切り替え
- `main.ts` — make.fun への提出プログラム（`app/` と `screenshots/` を `/output` に写し `dossier.json` を書く）
- `screenshots/` — サイトのスクリーンショット4枚

## ライセンス

MIT License（`LICENSE` を参照）。
