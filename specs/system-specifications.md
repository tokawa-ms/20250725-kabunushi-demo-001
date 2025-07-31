# システム仕様書

## 🎯 システム概要

**株主対話デモアプリケーション**の包括的なシステム仕様を定義します。アーキテクチャ、コンポーネント設計、データフロー、インターフェース仕様などを詳細に記述します。

## 🏗️ システムアーキテクチャ

### 全体アーキテクチャ
```mermaid
graph TB
    subgraph "クライアント環境"
        A[Webブラウザ] --> B[HTML5 + CSS3 + JavaScript]
        B --> C[アプリケーション本体]
        C --> D[ShareholderDialogueApp Class]
    end
    
    subgraph "外部ライブラリ"
        E[Tailwind CSS CDN]
        F[PDF.js CDN]
    end
    
    subgraph "外部サービス"
        G[Azure OpenAI Service]
        G --> H[GPT-4.1-mini Model]
    end
    
    subgraph "ローカルストレージ"
        I[設定データ]
        J[UI状態]
    end
    
    A --> E
    A --> F
    C --> G
    C --> I
    C --> J
    
    style A fill:#e1f5fe
    style G fill:#f3e5f5
    style I fill:#e8f5e8
```

### レイヤー構成
```mermaid
graph LR
    A[プレゼンテーション層] --> B[ビジネスロジック層]
    B --> C[データアクセス層]
    C --> D[外部サービス層]
    
    A --> A1[UI Components]
    A --> A2[Event Handlers]
    
    B --> B1[Dialogue Engine]
    B --> B2[PDF Processor]
    B --> B3[Language Manager]
    
    C --> C1[Local Storage]
    C --> C2[Session Storage]
    
    D --> D1[Azure OpenAI API]
    D --> D2[CDN Services]
```

## 📊 コンポーネント設計

### 1. メインクラス設計

#### ShareholderDialogueApp クラス
```mermaid
classDiagram
    class ShareholderDialogueApp {
        -state: Object
        -azureConfig: Object
        -languageConfig: Object
        -elements: Object
        
        +constructor()
        +initializeDOMReferences()
        +setupEventListeners()
        +loadSettings()
        +saveSettings()
        +connectToAzureOpenAI()
        +uploadPDFFiles()
        +generateQuestionCandidates()
        +startDialogue()
        +processDialogueTurn()
        +generateSummary()
        +updateUI()
    }
    
    class PDFProcessor {
        +extractTextFromPDF()
        +renderPDFPreview()
        +navigatePages()
        +handlePowerPointPDF()
    }
    
    class DialogueEngine {
        +generateShareholderQuestion()
        +generateDirectorResponse()
        +generateSummary()
        +validateResponse()
    }
    
    class LanguageManager {
        +setLanguage()
        +getPromptTemplate()
        +synchronizeSelectors()
        +getLocalizedText()
    }
    
    class UIManager {
        +updateConnectionStatus()
        +displayDialogue()
        +showModal()
        +toggleCollapse()
        +handleResponsive()
    }
    
    ShareholderDialogueApp --> PDFProcessor
    ShareholderDialogueApp --> DialogueEngine
    ShareholderDialogueApp --> LanguageManager
    ShareholderDialogueApp --> UIManager
```

### 2. 機能別コンポーネント

#### PDF処理コンポーネント
```mermaid
graph TD
    A[PDF Input] --> B[File Validation]
    B --> C[PDF.js Loading]
    C --> D[Text Extraction]
    D --> E{PowerPoint判定}
    E -->|Yes| F[座標ベースソート]
    E -->|No| G[シンプル結合]
    F --> H[重複除去]
    G --> H
    H --> I[構造化テキスト]
    
    C --> J[Preview Rendering]
    J --> K[Canvas表示]
    
    style E fill:#fff2cc
    style F fill:#d4edda
    style G fill:#f8d7da
```

#### 対話生成コンポーネント
```mermaid
graph LR
    A[PDF Content] --> B[Question Generation]
    B --> C[6 Candidates]
    C --> D[User Selection]
    D --> E[Dialogue Start]
    
    E --> F[Turn Loop]
    F --> G[Shareholder Q]
    G --> H[Director A]
    H --> I{Turn < 5?}
    I -->|Yes| F
    I -->|No| J[Summary Generation]
    
    style F fill:#e3f2fd
    style J fill:#f3e5f5
```

## 📋 データ構造設計

### 1. アプリケーション状態
```javascript
// メインアプリケーション状態
state = {
    // 接続状態
    isConnected: Boolean,
    
    // ファイル管理
    uploadedFiles: Array<File>,
    currentPdfData: PDFDocumentProxy,
    currentPage: Number,
    totalPages: Number,
    pdfContent: String,
    
    // 対話管理
    dialogueHistory: Array<DialogueMessage>,
    conversationTurn: Number,
    isDialogueInProgress: Boolean,
    
    // UI状態
    selectedLanguage: String,
    settingsCollapsed: Boolean,
    candidatesCollapsed: Boolean,
    questionCandidates: Array<String>,
    candidatesGenerated: Boolean
}
```

### 2. 設定データ構造
```javascript
// Azure OpenAI設定
azureConfig = {
    endpoint: String,        // "https://xxx.openai.azure.com/"
    apiKey: String,         // APIキー
    deploymentName: String, // "gpt-4o-mini"
    apiVersion: String      // "2024-02-15-preview"
}

// 言語設定
languageConfig = {
    [languageCode]: {
        name: String,
        shareholderPrompt: String,
        directorPrompt: String,
        summaryPrompt: String,
        startMessage: String,
        endMessage: String
    }
}
```

### 3. メッセージデータ構造
```javascript
// 対話メッセージ
DialogueMessage = {
    id: String,           // ユニークID
    role: String,         // "shareholder" | "director" | "system"
    content: String,      // メッセージ内容
    timestamp: Date,      // 生成時刻
    turn: Number,         // ターン番号
    language: String      // 生成言語
}

// 質問候補
QuestionCandidate = {
    id: Number,           // 1-6
    question: String,     // 質問内容
    category: String,     // 質問カテゴリ
    language: String      // 生成言語
}
```

## 🔄 データフロー設計

### 1. メインフロー
```mermaid
sequenceDiagram
    participant U as User
    participant UI as UI Layer
    participant BL as Business Logic
    participant API as Azure OpenAI
    participant LS as Local Storage
    
    U->>UI: アプリ起動
    UI->>LS: 設定読み込み
    LS-->>UI: 保存済み設定
    UI->>BL: 初期化
    
    U->>UI: PDF アップロード
    UI->>BL: ファイル処理
    BL->>BL: テキスト抽出
    BL-->>UI: プレビュー表示
    
    U->>UI: 接続設定
    UI->>BL: Azure OpenAI接続
    BL->>API: 接続テスト
    API-->>BL: レスポンス
    BL-->>UI: 接続状態更新
    
    BL->>API: 質問候補生成
    API-->>BL: 6つの質問候補
    BL-->>UI: 候補表示
    
    U->>UI: 質問選択/対話開始
    UI->>BL: 対話開始
    
    loop 5ターン
        BL->>API: 株主質問生成
        API-->>BL: 質問レスポンス
        BL-->>UI: 質問表示
        
        BL->>API: 取締役回答生成
        API-->>BL: 回答レスポンス
        BL-->>UI: 回答表示
    end
    
    BL->>API: 要約生成
    API-->>BL: 要約レスポンス
    BL-->>UI: 要約表示
```

### 2. PDF処理フロー
```mermaid
graph TD
    A[File Input] --> B[File Validation]
    B --> C{Valid PDF?}
    C -->|No| D[Error Display]
    C -->|Yes| E[PDF.js Load]
    
    E --> F[Document Parse]
    F --> G[Page Count]
    G --> H[First Page Render]
    
    F --> I[Text Extraction]
    I --> J[Item Analysis]
    J --> K{PowerPoint?}
    K -->|Yes| L[Coordinate Sort]
    K -->|No| M[Simple Join]
    
    L --> N[Duplicate Removal]
    M --> N
    N --> O[Structured Text]
    
    H --> P[Preview Display]
    O --> Q[Content Ready]
    
    style C fill:#fff2cc
    style K fill:#fff2cc
```

## 🌐 API インターフェース設計

### 1. Azure OpenAI API仕様

#### 接続エンドポイント
```
POST {endpoint}/openai/deployments/{deployment-name}/chat/completions?api-version={api-version}

Headers:
- api-key: {api-key}
- Content-Type: application/json
```

#### リクエスト形式
```javascript
{
    "messages": [
        {
            "role": "system",
            "content": "システムプロンプト"
        },
        {
            "role": "user", 
            "content": "ユーザー入力"
        }
    ],
    "max_tokens": 2000,
    "temperature": 0.7,
    "top_p": 0.9
}
```

#### レスポンス形式
```javascript
{
    "choices": [
        {
            "message": {
                "role": "assistant",
                "content": "AI生成テキスト"
            },
            "finish_reason": "stop"
        }
    ],
    "usage": {
        "prompt_tokens": 100,
        "completion_tokens": 50,
        "total_tokens": 150
    }
}
```

### 2. 内部API設計

#### 主要メソッド仕様
```javascript
class ShareholderDialogueApp {
    // Azure OpenAI接続テスト
    async testConnection(): Promise<boolean>
    
    // PDF テキスト抽出
    async extractPDFText(file: File): Promise<string>
    
    // 質問候補生成
    async generateQuestionCandidates(pdfContent: string, language: string): Promise<string[]>
    
    // 対話ターン実行
    async executeDialogueTurn(history: DialogueMessage[], language: string): Promise<DialogueMessage[]>
    
    // 要約生成
    async generateSummary(history: DialogueMessage[], language: string): Promise<string>
}
```

## 💾 ストレージ設計

### 1. ローカルストレージ仕様
```mermaid
graph LR
    A[Local Storage] --> B[azure_openai_config]
    A --> C[language_setting]
    A --> D[ui_settings]
    
    B --> E[endpoint, apiKey, deploymentName, apiVersion]
    C --> F[selectedLanguage]
    D --> G[settingsCollapsed, candidatesCollapsed]
```

#### ストレージキー設計
| キー | データ型 | 用途 |
|------|----------|------|
| `azure_openai_config` | JSON Object | Azure OpenAI接続設定 |
| `language_setting` | String | 選択中の言語コード |
| `ui_settings` | JSON Object | UI状態（折り畳み等） |

### 2. セッションストレージ
| データ | スコープ | 永続化 |
|--------|----------|--------|
| **対話履歴** | セッション内 | なし |
| **PDFファイル** | セッション内 | なし |
| **質問候補** | セッション内 | なし |

## 🎨 UI/UX設計仕様

### 1. レスポンシブブレークポイント
```mermaid
graph LR
    A[320px] --> B[スマートフォン]
    C[768px] --> D[タブレット]
    E[1024px] --> F[デスクトップ]
    
    B --> G[単列レイアウト]
    D --> H[2列縦並び]
    F --> I[2列横並び 1:2]
```

| デバイス | 画面幅 | レイアウト | PDF表示 | 対話表示 |
|----------|--------|-----------|---------|----------|
| **スマートフォン** | 320px-767px | 単列 | 100% | 100% |
| **タブレット** | 768px-1023px | 2列縦 | 100% | 100% |
| **デスクトップ** | 1024px以上 | 2列横 | 33% | 67% |

### 2. コンポーネント設計
```mermaid
graph TD
    A[App Container] --> B[Header]
    A --> C[Connection Settings]
    A --> D[Main Content]
    A --> E[Footer]
    
    C --> F[Collapse Toggle]
    C --> G[Settings Form]
    
    D --> H[PDF Panel]
    D --> I[Dialogue Panel]
    
    H --> J[Upload Area]
    H --> K[Preview Area]
    
    I --> L[Question Candidates]
    I --> M[Dialogue Controls]
    I --> N[Dialogue History]
    
    style F fill:#fff2cc
    style L fill:#f8d7da
```

### 3. 状態遷移設計
```mermaid
stateDiagram-v2
    [*] --> 初期状態
    初期状態 --> 設定入力中: 設定開始
    設定入力中 --> 接続済み: 接続成功
    設定入力中 --> 設定エラー: 接続失敗
    設定エラー --> 設定入力中: 設定修正
    
    接続済み --> PDF処理中: ファイルアップロード
    PDF処理中 --> 準備完了: 処理完了
    準備完了 --> 質問候補生成中: 自動生成開始
    質問候補生成中 --> 対話可能: 候補生成完了
    
    対話可能 --> 対話実行中: 対話開始
    対話実行中 --> 対話完了: 5ターン完了
    対話完了 --> 対話可能: 新規対話開始
```

## 🔒 セキュリティ設計

### 1. 脅威モデル
```mermaid
graph TD
    A[脅威分析] --> B[データ漏洩]
    A --> C[不正アクセス]
    A --> D[XSS攻撃]
    A --> E[CSRF攻撃]
    
    B --> F[APIキー保護]
    B --> G[PDF内容保護]
    C --> H[認証不要設計]
    D --> I[入力サニタイズ]
    E --> J[状態変更なし]
    
    style B fill:#ffebee
    style D fill:#ffebee
```

### 2. セキュリティ実装
| 領域 | 脅威 | 対策 | 実装状況 |
|------|------|------|----------|
| **認証** | 不正利用 | 認証なし設計 | ✅ パブリックアクセス |
| **API通信** | 盗聴 | HTTPS必須 | ✅ Azure OpenAI要件 |
| **データ保存** | 情報漏洩 | 最小限保存 | ✅ ローカルのみ |
| **入力処理** | XSS | サニタイズ | ✅ textContent使用 |

## ⚡ パフォーマンス設計

### 1. 最適化戦略
```mermaid
graph LR
    A[パフォーマンス最適化] --> B[読み込み最適化]
    A --> C[メモリ最適化]
    A --> D[処理最適化]
    
    B --> E[CDN活用]
    B --> F[遅延読み込み]
    C --> G[適切な破棄]
    C --> H[メモリリーク防止]
    D --> I[非同期処理]
    D --> J[キャッシュ活用]
```

### 2. パフォーマンス指標
| 指標 | 目標値 | 測定方法 |
|------|--------|----------|
| **初期読み込み** | 3秒以下 | ページロード完了まで |
| **PDF処理** | 2秒以下 | ファイルアップロード〜プレビュー |
| **API応答** | 15秒以下 | リクエスト〜レスポンス |
| **メモリ使用量** | 500MB以下 | ブラウザDevTools |

## 🔧 拡張性設計

### 1. 拡張ポイント
```mermaid
graph TD
    A[拡張可能性] --> B[機能拡張]
    A --> C[技術拡張]
    A --> D[スケール拡張]
    
    B --> E[新AI モデル対応]
    B --> F[ファイル形式追加]
    B --> G[言語追加]
    
    C --> H[フレームワーク移行]
    C --> I[バックエンド追加]
    
    D --> J[マルチユーザー]
    D --> K[クラウド対応]
```

### 2. 拡張設計
| 拡張領域 | 現在設計 | 拡張方法 | 影響範囲 |
|----------|----------|----------|----------|
| **AI モデル** | Azure OpenAI専用 | プロバイダー抽象化 | API層のみ |
| **ファイル形式** | PDF のみ | 処理エンジン追加 | PDF処理層のみ |
| **言語** | 7言語対応 | 設定ファイル追加 | 言語設定のみ |
| **UI フレームワーク** | Vanilla JS | 段階的移行 | 全体 |

---

**文書バージョン**: 1.0  
**作成日**: 2025年7月31日  
**最終更新**: 2025年7月31日  
**承認者**: システムアーキテクト・開発チーム  
**次回レビュー**: 2025年10月31日