# Azure OpenAI 接続設定 折り畳み機能

## 概要

Azure OpenAI 接続設定セクションに折り畳み機能を追加しました。この機能により、設定完了後にセクションを折り畳んで対話表示領域を広げることができます。

## 機能詳細

### 基本機能
- **手動折り畳み/展開**: セクションヘッダーの右側にある矢印ボタンをクリックして、設定セクションの表示/非表示を切り替えできます
- **状態の永続化**: 折り畳み状態はローカルストレージに保存され、ページ再読み込み後も維持されます
- **アニメーション**: スムーズなCSS トランジションによる展開/折り畳みアニメーション

### 自動折り畳み機能
- **接続成功時の自動折り畳み**: Azure OpenAI への接続テストが成功すると、1秒後に自動的に設定セクションが折り畳まれます
- これにより、ユーザーが手動で折り畳む必要がなく、すぐに対話エリアが広くなります

## 使用方法

### 手動操作
1. Azure OpenAI 接続設定セクションのヘッダー右側にある矢印ボタンをクリック
2. セクションが折り畳まれ、対話表示領域が広がります
3. 再度ボタンをクリックすると設定セクションが展開されます

### 自動操作
1. Azure OpenAI の設定を入力
2. 「🔗 接続テスト」ボタンをクリック
3. 接続が成功すると、自動的に設定セクションが折り畳まれます

## 技術実装

### HTML構造
```html
<div id="connectionSettingsContainer" class="bg-white rounded-lg shadow-md p-6 mb-6">
    <div class="flex justify-between items-center mb-4">
        <h2>🔧 Azure OpenAI 接続設定</h2>
        <button id="collapseToggleBtn" title="設定を折り畳む/展開する">
            <svg id="collapseIcon"><!-- シェブロンアイコン --></svg>
        </button>
    </div>
    <div id="connectionSettingsContent" class="transition-all duration-300 ease-in-out overflow-hidden">
        <!-- 設定コンテンツ -->
    </div>
</div>
```

### CSS
```css
#connectionSettingsContent {
    transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
    max-height: 1000px;
    opacity: 1;
    overflow: hidden;
}

.connection-settings-collapsed #connectionSettingsContent {
    max-height: 0;
    opacity: 0;
}

#collapseIcon {
    transition: transform 0.2s ease-in-out;
}

.connection-settings-collapsed #collapseIcon {
    transform: rotate(-90deg);
}
```

### JavaScript主要メソッド
- `toggleSettingsCollapse()`: 手動での折り畳み状態切り替え
- `applyCollapseState()`: CSS クラスの適用
- `autoCollapseSettings()`: 接続成功後の自動折り畳み

## ユーザーエクスペリエンス向上

この機能により以下の改善が実現されました：

1. **対話領域の拡大**: 設定完了後に不要なスペースを削減し、対話表示領域を最大化
2. **直感的な操作**: 分かりやすい矢印アイコンによる折り畳み操作
3. **自動化**: 接続成功後の自動折り畳みにより、ユーザーの手間を削減
4. **状態保持**: ページ再読み込み後も設定状態を維持

## 今後の拡張可能性

- 他のセクション（PDFアップロード、対話コントロール等）への折り畳み機能追加
- キーボードショートカットによる操作
- セクション毎の個別設定保存