# 株主対話デモアプリケーション - 機能仕様書

## 概要
Azure OpenAI GPT-4.1-miniを使用した株主と取締役の対話シミュレーションアプリケーション

## 実装済み機能

### 1. 多言語対応機能 🌐

#### 対応言語
- 日本語 (ja) - 既定言語
- English (en)
- 中文 (zh)
- Deutsch (de)
- Français (fr)
- Español (es)
- 한국어 (ko)

#### 機能詳細
- **二箇所の言語選択**: 接続設定セクションと対話シミュレーションセクションの両方に配置
- **言語セレクタ同期**: どちらを変更しても両方に反映される
- 選択した言語に応じて以下が該当言語で生成される：
  - 株主からの質問候補（6つ）
  - 株主からの質問
  - 取締役からの回答
  - 対話の要約
  - システムメッセージ
- 言語設定はローカルストレージに保存され、次回起動時に復元
- **質問候補の言語連動**: 言語変更時に質問候補の自動再生成

#### 技術実装
- `languageConfig` オブジェクトで各言語のプロンプトテンプレートを管理
- `handleLanguageChange()` と `handleDialogueLanguageChange()` で言語変更を処理
- 対話生成時に選択された言語のプロンプトを使用
- 双方向の言語セレクタ同期機能

### 2. レイアウト最適化 📐

#### 変更内容
- **分割比率**: 左右パネルの比率を1:1から1:2に変更
  - 左パネル（PDF関連）: 1/3の幅
  - 右パネル（対話関連）: 2/3の幅
- **マージン調整**: 横方向マージンをpx-4からpx-2に削減
- **間隔調整**: パネル間のgapを6pxから4pxに縮小

#### 効果
- 対話表示領域の拡大
- より見やすい対話インターフェース
- 画面の有効活用

### 3. 株主質問候補生成機能 ❓

#### 機能概要
- Azure OpenAI接続とPDFアップロード完了後に自動的に質問候補を生成
- PDF内容を解析して6つの具体的な株主質問を提示
- 質問候補をクリックすることで対話を開始可能

#### 質問生成の観点
1. **業績や財務状況に関する懸念**
2. **経営戦略や将来計画への疑問**
3. **株主還元政策について**
4. **リスク要因や課題について**
5. **市場環境への対応について**
6. **その他の重要な経営課題**

#### UI/UX機能
- **折り畳み可能**: セクションヘッダーのボタンで折り畳み/展開
- **カード形式表示**: 質問ごとに美しいカードデザイン
- **ホバーエフェクト**: マウスオーバー時のアニメーション
- **自動折り畳み**: 質問選択時にセクションが自動的に折り畳み
- **レスポンシブ対応**: モバイル端末での適切な表示

#### 技術実装
- `generateQuestionCandidates()`: 質問候補生成メソッド
- `displayQuestionCandidates()`: UI表示処理
- `startDialogueWithQuestion()`: 選択した質問で対話開始
- `toggleCandidatesCollapse()`: 折り畳み状態管理
- 言語設定に連動した多言語対応

#### 動作フロー
1. Azure OpenAI接続 + PDFアップロード完了
2. `updateDialogueStatus()` で条件判定
3. `generateQuestionCandidates()` で質問生成
4. UIに6つの質問候補を表示
5. ユーザーが質問を選択
6. 質問候補セクション折り畳み + 対話開始

### 4. PDFプレビュー制約 🎯

#### 問題解決
- PDFプレビューが右パネルにはみ出す問題を解決

#### 実装内容
```css
.pdf-preview {
    max-width: 100%;
    overflow: hidden;
}

.pdf-preview canvas {
    max-width: 100%;
    height: auto;
}
```

#### 効果
- PDF表示が左パネル内に適切に収まる
- レスポンシブ対応の向上

## 設定とデータ管理

### ローカルストレージ
- `azureOpenAIConfig`: Azure OpenAI接続設定
- `selectedLanguage`: 選択された対話言語
- `settingsCollapsed`: 設定セクションの折り畳み状態

### 設定の永続化
- 言語選択は自動的に保存される（両方のドロップダウンに反映）
- アプリケーション起動時に前回の設定を復元
- 質問候補の生成状態も管理

## 使用方法

### 1. 言語設定
#### 方法A: 接続設定での変更
1. 「🔧 Azure OpenAI 接続設定」セクションの「🌐 対話言語」ドロップダウンから言語を選択
2. 対話シミュレーションの「🌐 生成言語」ドロップダウンも自動的に同期

#### 方法B: 対話セクションでの変更
1. 「💬 対話シミュレーション」セクションの「🌐 生成言語」ドロップダウンから言語を選択
2. 接続設定の「🌐 対話言語」ドロップダウンも自動的に同期

### 2. 質問候補を使用した対話
1. Azure OpenAI接続設定を入力・接続テスト実行
2. PDFファイルをアップロード
3. 自動的に「❓ 株主質問候補」セクションが表示される
4. 6つの質問候補から任意の質問をクリック
5. 質問候補セクションが折り畳まれ、選択した質問で対話が開始
6. 通常の5ターン対話が進行

### 3. 従来の対話方法
1. Azure OpenAI接続設定を入力
2. PDFファイルをアップロード
3. 「🚀 対話開始」ボタンをクリック
4. ランダムに生成された質問で対話が開始

## 技術仕様

### フロントエンド
- HTML5
- CSS3 (Tailwind CSS)
- JavaScript (ES6)

### 外部サービス
- Azure OpenAI GPT-4.1-mini
- PDF.js (PDFプレビュー)

### ブラウザ対応
- モダンブラウザ全般
- レスポンシブデザイン対応

## 今後の拡張可能性

### 言語追加
- `languageConfig`オブジェクトに新しい言語を追加することで容易に拡張可能
- UIの選択肢にoptionタグを追加

### UIカスタマイズ
- Tailwind CSSを使用しているため、レスポンシブ対応やスタイル変更が容易

### 機能拡張
- 対話履歴の保存・復元機能
- カスタムプロンプトテンプレート機能
- 音声読み上げ機能