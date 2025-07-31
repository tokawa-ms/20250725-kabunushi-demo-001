# 株主質問候補機能 - 技術仕様書

## 概要
PDF資料の内容を解析して、株主総会で適切な質問を自動生成し、選択可能な形で提示する機能です。

## 機能詳細

### 自動質問生成
- **トリガー**: Azure OpenAI接続 + PDFアップロード完了
- **生成数**: 6つの質問候補
- **生成方法**: Azure OpenAI GPT-4.1-miniによる解析

### 質問生成の観点
1. **業績・財務状況**: 決算数値、収益性、財務健全性に関する質問
2. **経営戦略**: 中長期計画、事業展開、競合対応に関する質問
3. **株主還元**: 配当政策、自社株買い、株主優待に関する質問
4. **リスク管理**: 事業リスク、財務リスク、コンプライアンスに関する質問
5. **市場対応**: 市場環境変化、顧客ニーズ対応に関する質問
6. **経営課題**: その他の重要な経営課題に関する質問

### 多言語対応
- 選択された言語に応じて質問を生成
- 言語変更時の自動再生成機能
- 7言語完全対応（日本語、英語、中国語、ドイツ語、フランス語、スペイン語、韓国語）

## UI/UX設計

### レイアウト
```
❓ 株主質問候補                    [折り畳みボタン]
├─ 説明テキスト
└─ 質問候補一覧
   ├─ [1] 質問候補1              💬
   ├─ [2] 質問候補2              💬
   ├─ [3] 質問候補3              💬
   ├─ [4] 質問候補4              💬
   ├─ [5] 質問候補5              💬
   └─ [6] 質問候補6              💬
```

### インタラクション
1. **ホバーエフェクト**: 質問候補にマウスオーバーで視覚フィードバック
2. **クリック選択**: 質問をクリックで対話開始
3. **折り畳み機能**: セクション全体の表示/非表示切り替え
4. **自動折り畳み**: 質問選択時の自動折り畳み

### スタイリング
- **カードデザイン**: 各質問を独立したカードとして表示
- **グラデーション**: ホバー時の美しいグラデーション効果
- **番号表示**: 質問ごとに番号アイコンを表示
- **レスポンシブ**: モバイル端末での適切な表示

## 技術実装

### 主要メソッド

#### `generateQuestionCandidates()`
```javascript
async generateQuestionCandidates() {
    // 1. 接続・PDFファイル状態確認
    // 2. 質問候補セクション表示
    // 3. PDF内容を解析用コンテキストとして準備
    // 4. Azure OpenAI APIで質問生成
    // 5. 質問を分割して配列化
    // 6. UI表示処理実行
}
```

#### `displayQuestionCandidates()`
```javascript
displayQuestionCandidates() {
    // 1. 質問候補リストをクリア
    // 2. 各質問をカード形式で表示
    // 3. クリックイベントリスナー追加
    // 4. フェードインアニメーション適用
}
```

#### `startDialogueWithQuestion(selectedQuestion)`
```javascript
async startDialogueWithQuestion(selectedQuestion) {
    // 1. 質問候補セクションを折り畳み
    // 2. 対話状態を初期化
    // 3. 選択された質問を株主発言として追加
    // 4. 取締役回答生成を開始
}
```

### 状態管理
```javascript
this.state = {
    questionCandidates: [],        // 生成された質問候補
    candidatesCollapsed: false,    // 折り畳み状態
    candidatesGenerated: false     // 生成完了フラグ
};
```

### プロンプト設計
```javascript
const systemPrompt = `${langConfig.shareholderPrompt}

以下の観点から6つの具体的で重要な質問を生成してください：
1. 業績や財務状況に関する懸念
2. 経営戦略や将来計画への疑問
3. 株主還元政策について
4. リスク要因や課題について
5. 市場環境への対応について
6. その他の重要な経営課題

資料内容：
${this.state.pdfContent}`;
```

## CSS設計

### 質問候補カード
```css
.question-candidate {
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    border: 2px solid #d1d5db;
    border-radius: 0.75rem;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.question-candidate:hover {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}
```

### 折り畳み機能
```css
#questionCandidatesContent {
    transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
    max-height: 1000px;
    opacity: 1;
    overflow: hidden;
}

#questionCandidatesSection.candidates-collapsed #questionCandidatesContent {
    max-height: 0;
    opacity: 0;
}
```

## エラーハンドリング

### 生成失敗時の処理
- エラーメッセージ表示
- 質問候補セクションの非表示
- ローディング状態の解除
- ログ出力

### 接続エラー時の処理
- 質問候補生成をスキップ
- 警告ログ出力
- UI状態は変更しない

## パフォーマンス最適化

### トークン数制限
- PDFコンテンツを最大20,000文字に制限
- 効率的なプロンプト設計
- 質問数を6つに限定

### UI最適化
- 非同期処理によるUIブロック回避
- スムーズなアニメーション
- 適切なローディング表示

## 今後の拡張予定

### 機能拡張
- [ ] 質問カテゴリーのフィルタリング
- [ ] 質問の重要度スコア表示
- [ ] ユーザーカスタム質問の追加
- [ ] 質問履歴の保存

### UI改善
- [ ] ドラッグ&ドロップによる質問順序変更
- [ ] 質問プレビューモーダル
- [ ] 質問の編集機能
- [ ] 複数質問の同時選択

## 関連ドキュメント
- [機能仕様書](./features.md)
- [多言語対応](./features.md#1-多言語対応機能-)
- [API連携ガイド](./api-integration.md)
- [UI設計書](./ui-design.md)