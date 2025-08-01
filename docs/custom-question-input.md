# カスタム質問入力機能 - 技術仕様書

## 概要
質問候補に加えて、ユーザーが独自の質問を手動で入力して対話を開始できる機能です。既存の自動生成質問候補機能を補完し、より柔軟な質問入力方法を提供します。

## 機能詳細

### 基本機能
- **手動質問入力**: テキストエリアでの自由な質問入力
- **リアルタイム検証**: 入力内容に応じたボタンの有効/無効制御
- **多言語対応**: 7言語での完全なUI翻訳対応
- **既存機能統合**: 自動生成質問候補機能との完全な統合

### 表示タイミング
- Azure OpenAI接続 + PDFアップロード完了時に表示
- 質問候補セクションと同時に表示される
- 質問候補セクションの下部に配置

## UI/UX設計

### レイアウト構造
```
❓ 株主質問候補                    [折り畳みボタン]
├─ 説明テキスト
├─ 質問候補一覧
│  ├─ [1] 質問候補1              💬
│  ├─ [2] 質問候補2              💬
│  └─ ... 
└─ ━━━━━━━━━━━━━━━━━━━━━━━━━━
   💬 独自の質問を入力
   ├─ 説明テキスト
   ├─ [質問内容テキストエリア]
   └─ [🚀 この質問で対話開始] ボタン
```

### 視覚デザイン
- **背景色**: 紫系グラデーション (`#faf5ff` → `#f3e8ff`)
- **ボーダー**: 薄紫色 (`#e9d5ff`)
- **ボタン色**: 紫色 (`#7c3aed`) ベース
- **境界線**: 上部に薄いボーダーで質問候補と分離

### インタラクション
1. **入力検証**: リアルタイムで空文字チェック
2. **ボタン制御**: 有効な入力がある場合のみボタン有効化
3. **フィードバック**: ホバー効果とトランジション
4. **クリア処理**: 送信後の自動フィールドクリア

## 技術実装

### HTML構造
```html
<div id="customQuestionSection" class="mt-6 pt-6 border-t border-gray-200">
    <h3 class="text-lg font-medium text-gray-800 mb-3">💬 独自の質問を入力</h3>
    <p class="text-gray-600 text-sm mb-4">...</p>
    <div class="space-y-3">
        <div>
            <label for="customQuestionInput">質問内容</label>
            <textarea id="customQuestionInput" rows="3" ...></textarea>
        </div>
        <div class="flex justify-end">
            <button id="submitCustomQuestionBtn" ...>
                🚀 この質問で対話開始
            </button>
        </div>
    </div>
</div>
```

### CSS設計
```css
#customQuestionSection {
    background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
    border-radius: 0.75rem;
    padding: 1.5rem;
    border: 1px solid #e9d5ff;
}

#customQuestionInput:focus {
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
    border-color: #8b5cf6;
}

#submitCustomQuestionBtn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}
```

### JavaScript実装

#### 主要メソッド

**handleCustomQuestionInput()**
```javascript
handleCustomQuestionInput() {
    const question = this.elements.customQuestionInput.value.trim();
    const isValid = question.length > 0;
    this.elements.submitCustomQuestionBtn.disabled = !isValid;
}
```

**submitCustomQuestion()**
```javascript
async submitCustomQuestion() {
    const question = this.elements.customQuestionInput.value.trim();
    
    // バリデーション処理
    if (!question || !this.state.isConnected || this.state.uploadedFiles.length === 0) {
        // エラー処理
        return;
    }
    
    // フィールドクリア
    this.elements.customQuestionInput.value = '';
    this.elements.submitCustomQuestionBtn.disabled = true;
    
    // 対話開始
    await this.startDialogueWithQuestion(question);
}
```

**updateCustomQuestionLanguage()**
```javascript
updateCustomQuestionLanguage() {
    const langConfig = this.languageConfig[this.state.selectedLanguage];
    
    // UI要素の更新
    const titleElement = this.elements.customQuestionSection.querySelector('h3');
    const descriptionElement = this.elements.customQuestionSection.querySelector('p');
    // ... 各要素の言語更新
}
```

### 多言語対応

#### 言語設定構造
```javascript
// 各言語の設定例
customQuestionTitle: '💬 独自の質問を入力',
customQuestionDescription: '上記の質問候補に加えて、ご自身で考えた質問を入力して対話を開始することもできます。',
customQuestionLabel: '質問内容',
customQuestionPlaceholder: 'ここに質問を入力してください（例：今期の売上が前年同期比で減少している理由を教えてください）',
customQuestionSubmit: 'この質問で対話開始'
```

#### 対応言語一覧
- 🇯🇵 **日本語** (ja)
- 🇺🇸 **English** (en)
- 🇨🇳 **中文** (zh)
- 🇩🇪 **Deutsch** (de)
- 🇫🇷 **Français** (fr)
- 🇪🇸 **Español** (es)
- 🇰🇷 **한국어** (ko)

## 既存機能との統合

### 質問候補機能との連携
- 同一のセクション内に配置
- 質問候補と同じ `startDialogueWithQuestion()` メソッドを使用
- 対話開始時の処理フローは完全に共通

### 言語切り替え機能との統合
- 言語変更時に自動的にUI更新
- 両方の言語セレクタと完全同期
- プレースホルダーテキストも動的更新

### 対話システムとの統合
- 既存の対話生成エンジンをそのまま利用
- Azure OpenAI APIとの連携は既存ロジック活用
- 対話履歴・要約機能も完全対応

## バリデーションとエラーハンドリング

### 入力検証
- **空文字チェック**: リアルタイムでトリム後の文字数検証
- **接続状態確認**: Azure OpenAI未接続時の警告
- **PDF確認**: ファイル未アップロード時の警告

### エラーメッセージ
```javascript
// 各種エラーパターンの対応
if (!question) {
    this.showMessage('質問を入力してください', 'warning');
}
if (!this.state.isConnected) {
    this.showMessage('Azure OpenAIに接続してください', 'warning');
}
if (this.state.uploadedFiles.length === 0) {
    this.showMessage('PDFファイルをアップロードしてください', 'warning');
}
```

## パフォーマンス最適化

### UI応答性
- デバウンスなしのリアルタイム検証（軽量な処理のため）
- CSS トランジションによるスムーズなインタラクション
- 最小限のDOM操作で高速更新

### メモリ効率
- イベントリスナーの適切な管理
- 不要なデータの即座クリア
- 既存の状態管理システム活用

## レスポンシブデザイン

### モバイル対応
```css
@media (max-width: 768px) {
    #customQuestionSection {
        padding: 1rem;
        margin-top: 1rem;
    }
    
    #customQuestionInput {
        font-size: 1rem;
        min-height: 100px;
    }
    
    #submitCustomQuestionBtn {
        width: 100%;
    }
}
```

### 画面サイズ対応
- **スマートフォン**: フルワイドボタン、拡大テキストエリア
- **タブレット**: 標準レイアウト
- **デスクトップ**: 最適化されたスペーシング

## 今後の拡張予定

### 機能拡張
- [ ] 質問履歴の保存機能
- [ ] よく使う質問のテンプレート機能
- [ ] 質問の文字数制限表示
- [ ] 音声入力対応

### UI改善
- [ ] リッチテキストエディタ対応
- [ ] 質問の下書き保存機能
- [ ] キーボードショートカット対応
- [ ] アクセシビリティ強化

## 関連ドキュメント
- [質問候補機能仕様](./question-candidates.md)
- [多言語対応仕様](./features.md#1-多言語対応機能-)
- [UI設計書](./ui-design.md)
- [API連携ガイド](./api-integration.md)