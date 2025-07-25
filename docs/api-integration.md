# Azure OpenAI API 連携ガイド

## 概要

株主対話デモアプリケーションにおける Azure OpenAI との連携方法について詳細に説明します。本ガイドでは、API の設定から実装、トラブルシューティングまでを包括的にカバーします。

## Azure OpenAI セットアップ

### 🚀 前提条件

1. **Azure アカウント**: アクティブな Azure サブスクリプション
2. **Azure OpenAI Service**: 承認済みのアクセス権
3. **GPT-4 モデル**: gpt-4o-mini またはそれ以上のモデル

### 📋 Azure Portal での設定手順

#### 1. Azure OpenAI リソースの作成

```bash
# Azure CLI での作成例
az cognitiveservices account create \
  --name "your-openai-resource" \
  --resource-group "your-rg" \
  --location "East US" \
  --kind "OpenAI" \
  --sku "S0"
```

#### 2. GPT-4 モデルのデプロイ

1. Azure Portal で作成したリソースに移動
2. 「モデル管理」→「デプロイ」を選択
3. 新しいデプロイを作成：
   - **モデル**: gpt-4o-mini
   - **デプロイ名**: `gpt-4o-mini` （推奨）
   - **バージョン**: 最新版
   - **デプロイタイプ**: Standard

#### 3. API キーとエンドポイントの取得

```yaml
必要な情報:
  エンドポイント: https://your-resource.openai.azure.com/
  APIキー: リソースの「キーとエンドポイント」から取得
  デプロイ名: 上記で設定したデプロイ名
  APIバージョン: 2024-02-15-preview
```

## API仕様詳細

### 🔗 Chat Completions API

#### エンドポイント

```
POST https://{resource-name}.openai.azure.com/openai/deployments/{deployment-name}/chat/completions?api-version={api-version}
```

#### リクエストヘッダー

```javascript
const headers = {
    'Content-Type': 'application/json',
    'api-key': 'YOUR_API_KEY'
};
```

#### リクエストボディ

```javascript
const requestBody = {
    messages: [
        {
            role: 'system',
            content: 'あなたは経験豊富な個人株主です。提供された決算資料を基に質問を生成してください。'
        },
        {
            role: 'user', 
            content: 'PDFから抽出されたテキスト内容'
        }
    ],
    max_tokens: 500,
    temperature: 0.7,
    top_p: 0.9,
    frequency_penalty: 0,
    presence_penalty: 0
};
```

#### レスポンス形式

```javascript
{
    "id": "chatcmpl-ABCDEF",
    "object": "chat.completion",
    "created": 1677652288,
    "model": "gpt-4o-mini",
    "choices": [
        {
            "index": 0,
            "message": {
                "role": "assistant",
                "content": "生成された質問や回答テキスト"
            },
            "finish_reason": "stop"
        }
    ],
    "usage": {
        "prompt_tokens": 150,
        "completion_tokens": 100,
        "total_tokens": 250
    }
}
```

## 実装詳細

### 💻 JavaScript実装

#### 基本的なAPI呼び出しクラス

```javascript
class AzureOpenAIClient {
    constructor(config) {
        this.endpoint = config.endpoint;
        this.apiKey = config.apiKey;
        this.deploymentName = config.deploymentName;
        this.apiVersion = config.apiVersion;
    }

    async callChatCompletion(messages, options = {}) {
        const url = `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=${this.apiVersion}`;
        
        const requestBody = {
            messages: messages,
            max_tokens: options.maxTokens || 500,
            temperature: options.temperature || 0.7,
            top_p: options.topP || 0.9,
            frequency_penalty: options.frequencyPenalty || 0,
            presence_penalty: options.presencePenalty || 0
        };

        console.log('🚀 Azure OpenAI API呼び出し開始:', url);
        console.log('📝 リクエストボディ:', JSON.stringify(requestBody, null, 2));

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.apiKey
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API Error ${response.status}: ${errorData}`);
            }

            const data = await response.json();
            console.log('✅ API呼び出し成功:', data);
            
            return data;
        } catch (error) {
            console.error('❌ API呼び出しエラー:', error);
            throw error;
        }
    }

    async testConnection() {
        try {
            const testMessages = [
                {
                    role: 'system',
                    content: 'テスト用のメッセージです。'
                },
                {
                    role: 'user',
                    content: '接続テストを実行してください。'
                }
            ];

            const response = await this.callChatCompletion(testMessages, {
                maxTokens: 50
            });

            return {
                success: true,
                message: '接続テスト成功',
                usage: response.usage
            };
        } catch (error) {
            return {
                success: false,
                message: `接続テスト失敗: ${error.message}`,
                error: error
            };
        }
    }
}
```

#### 対話生成専用のラッパークラス

```javascript
class DialogueGenerator {
    constructor(azureClient, languageConfig) {
        this.client = azureClient;
        this.languageConfig = languageConfig;
    }

    async generateShareholderQuestion(pdfContent, language = 'ja', turnNumber = 1) {
        const systemPrompt = this.languageConfig[language].shareholderPrompt;
        const contextPrompt = this.buildContextPrompt(pdfContent, turnNumber, 'shareholder');
        
        const messages = [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: contextPrompt
            }
        ];

        console.log(`👤 株主質問生成開始 (ターン${turnNumber}, 言語: ${language})`);

        try {
            const response = await this.client.callChatCompletion(messages, {
                maxTokens: 300,
                temperature: 0.7
            });

            const question = response.choices[0].message.content;
            console.log('✅ 株主質問生成完了:', question);

            return {
                content: question,
                tokens: response.usage.total_tokens,
                turnNumber: turnNumber
            };
        } catch (error) {
            console.error('❌ 株主質問生成エラー:', error);
            throw new Error(`株主質問の生成に失敗しました: ${error.message}`);
        }
    }

    async generateDirectorResponse(question, pdfContent, language = 'ja', turnNumber = 1) {
        const systemPrompt = this.languageConfig[language].directorPrompt;
        const contextPrompt = this.buildResponseContextPrompt(question, pdfContent, turnNumber);
        
        const messages = [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: contextPrompt
            }
        ];

        console.log(`👔 取締役回答生成開始 (ターン${turnNumber}, 言語: ${language})`);

        try {
            const response = await this.client.callChatCompletion(messages, {
                maxTokens: 400,
                temperature: 0.6
            });

            const answer = response.choices[0].message.content;
            console.log('✅ 取締役回答生成完了:', answer);

            return {
                content: answer,
                tokens: response.usage.total_tokens,
                turnNumber: turnNumber
            };
        } catch (error) {
            console.error('❌ 取締役回答生成エラー:', error);
            throw new Error(`取締役回答の生成に失敗しました: ${error.message}`);
        }
    }

    async generateSummary(dialogueHistory, language = 'ja') {
        const systemPrompt = this.languageConfig[language].summaryPrompt;
        const dialogueText = this.formatDialogueForSummary(dialogueHistory);
        
        const messages = [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: dialogueText
            }
        ];

        console.log(`📋 対話要約生成開始 (言語: ${language})`);

        try {
            const response = await this.client.callChatCompletion(messages, {
                maxTokens: 600,
                temperature: 0.5
            });

            const summary = response.choices[0].message.content;
            console.log('✅ 対話要約生成完了:', summary);

            return {
                content: summary,
                tokens: response.usage.total_tokens
            };
        } catch (error) {
            console.error('❌ 対話要約生成エラー:', error);
            throw new Error(`対話要約の生成に失敗しました: ${error.message}`);
        }
    }

    buildContextPrompt(pdfContent, turnNumber, role) {
        const truncatedContent = this.truncateContent(pdfContent, 3000);
        return `
決算資料・株主総会資料:
${truncatedContent}

対話ターン: ${turnNumber}/5
役割: ${role}

上記の資料を参考に、${role === 'shareholder' ? '株主として適切な質問' : '取締役として適切な回答'}を生成してください。
        `.trim();
    }

    buildResponseContextPrompt(question, pdfContent, turnNumber) {
        const truncatedContent = this.truncateContent(pdfContent, 2500);
        return `
株主からの質問:
${question}

決算資料・株主総会資料:
${truncatedContent}

対話ターン: ${turnNumber}/5

上記の質問に対して、提供された資料を基に取締役として適切な回答をしてください。
        `.trim();
    }

    formatDialogueForSummary(dialogueHistory) {
        return dialogueHistory.map((entry, index) => {
            const turnNumber = Math.floor(index / 2) + 1;
            const role = entry.role === 'shareholder' ? '株主' : '取締役';
            return `ターン${turnNumber} - ${role}: ${entry.content}`;
        }).join('\n\n');
    }

    truncateContent(content, maxLength) {
        if (content.length <= maxLength) {
            return content;
        }
        return content.substring(0, maxLength) + '...（以下省略）';
    }
}
```

### 🔧 設定管理

#### 設定の保存と読み込み

```javascript
class ConfigManager {
    static saveConfig(config) {
        try {
            // 設定をBase64エンコードして保存（簡易暗号化）
            const encodedConfig = btoa(JSON.stringify(config));
            localStorage.setItem('azureOpenAIConfig', encodedConfig);
            
            console.log('💾 Azure OpenAI設定を保存しました');
            return true;
        } catch (error) {
            console.error('❌ 設定保存エラー:', error);
            return false;
        }
    }

    static loadConfig() {
        try {
            const encodedConfig = localStorage.getItem('azureOpenAIConfig');
            if (!encodedConfig) {
                return null;
            }

            const config = JSON.parse(atob(encodedConfig));
            console.log('📂 Azure OpenAI設定を読み込みました');
            
            // APIキーをマスクしてログ出力
            const maskedConfig = {
                ...config,
                apiKey: config.apiKey ? '***masked***' : null
            };
            console.log('🔍 読み込んだ設定:', maskedConfig);

            return config;
        } catch (error) {
            console.error('❌ 設定読み込みエラー:', error);
            return null;
        }
    }

    static validateConfig(config) {
        const required = ['endpoint', 'apiKey', 'deploymentName', 'apiVersion'];
        const missing = required.filter(field => !config[field]);

        if (missing.length > 0) {
            throw new Error(`必須項目が不足しています: ${missing.join(', ')}`);
        }

        // エンドポイントのフォーマット検証
        const endpointPattern = /^https:\/\/[\w-]+\.openai\.azure\.com\/?$/;
        if (!endpointPattern.test(config.endpoint)) {
            throw new Error('エンドポイントの形式が正しくありません');
        }

        // APIバージョンの検証
        const supportedVersions = ['2023-12-01-preview', '2024-02-15-preview', '2024-04-01-preview'];
        if (!supportedVersions.includes(config.apiVersion)) {
            console.warn('⚠️ サポートされていないAPIバージョンの可能性があります:', config.apiVersion);
        }

        return true;
    }

    static clearConfig() {
        localStorage.removeItem('azureOpenAIConfig');
        console.log('🗑️ Azure OpenAI設定をクリアしました');
    }
}
```

## エラーハンドリング

### 🚨 一般的なエラーとその対処法

#### 1. 認証エラー (401 Unauthorized)

```javascript
// エラー例
{
    "error": {
        "code": "Unauthorized",
        "message": "Access denied due to invalid subscription key."
    }
}

// 対処法
function handleAuthError(error) {
    console.error('🔐 認証エラー:', error);
    
    // ユーザーに分かりやすいメッセージを表示
    showError('APIキーが無効です。Azure ポータルで正しいキーを確認してください。');
    
    // 設定画面への誘導
    expandConnectionSettings();
}
```

#### 2. レート制限エラー (429 Too Many Requests)

```javascript
// エラー例
{
    "error": {
        "code": "TooManyRequests",
        "message": "Rate limit exceeded. Please wait before making more requests."
    }
}

// 対処法
function handleRateLimitError(error, retryAfter = 60) {
    console.warn(`⏳ レート制限エラー: ${retryAfter}秒後にリトライします`);
    
    showWarning(`リクエスト頻度が高すぎます。${retryAfter}秒後に自動的にリトライします。`);
    
    // 指数バックオフでリトライ
    setTimeout(() => {
        retryLastRequest();
    }, retryAfter * 1000);
}
```

#### 3. コンテンツフィルターエラー

```javascript
// エラー例
{
    "error": {
        "code": "content_filter",
        "message": "The response was filtered due to the prompt triggering Azure OpenAI's content management policy."
    }
}

// 対処法
function handleContentFilterError(error) {
    console.warn('🛡️ コンテンツフィルターエラー:', error);
    
    showWarning('生成されたコンテンツがポリシーに適合しませんでした。プロンプトを調整して再試行します。');
    
    // より保守的なプロンプトで再試行
    retryWithConservativePrompt();
}
```

#### 4. トークン制限エラー

```javascript
// エラー例
{
    "error": {
        "code": "context_length_exceeded",
        "message": "The request exceeds the maximum number of tokens."
    }
}

// 対処法
function handleTokenLimitError(error) {
    console.warn('📝 トークン制限エラー:', error);
    
    showWarning('入力テキストが長すぎます。コンテンツを要約して再試行します。');
    
    // コンテンツを短縮して再試行
    retryWithTruncatedContent();
}
```

### 🔄 リトライ機能の実装

```javascript
class RetryHandler {
    static async withRetry(apiCall, maxRetries = 3, baseDelay = 1000) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 API呼び出し試行 ${attempt}/${maxRetries}`);
                return await apiCall();
            } catch (error) {
                lastError = error;
                
                if (attempt === maxRetries) {
                    break;
                }
                
                // 指数バックオフ
                const delay = baseDelay * Math.pow(2, attempt - 1);
                console.log(`⏳ ${delay}ms後にリトライします`);
                
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        throw lastError;
    }
}

// 使用例
const result = await RetryHandler.withRetry(async () => {
    return await azureClient.callChatCompletion(messages);
}, 3, 1000);
```

## パフォーマンス最適化

### ⚡ トークン使用量の最適化

#### 1. プロンプトエンジニアリング

```javascript
class PromptOptimizer {
    static optimizePrompt(basePrompt, content, maxTokens = 4000) {
        // コンテンツの長さを推定（おおよそ1トークン = 4文字）
        const estimatedTokens = (basePrompt.length + content.length) / 4;
        
        if (estimatedTokens <= maxTokens) {
            return basePrompt + '\n\n' + content;
        }
        
        // コンテンツを適切な長さに切り詰める
        const availableTokensForContent = maxTokens - (basePrompt.length / 4);
        const maxContentLength = availableTokensForContent * 4 * 0.9; // 安全マージン
        
        const truncatedContent = content.length > maxContentLength 
            ? content.substring(0, maxContentLength) + '\n\n[以下省略...]'
            : content;
        
        console.log(`📝 プロンプト最適化: ${content.length}文字 → ${truncatedContent.length}文字`);
        
        return basePrompt + '\n\n' + truncatedContent;
    }
    
    static generateEfficientPrompt(role, context, language) {
        const prompts = {
            shareholder: {
                ja: '株主として決算資料を基に質問を1つ生成してください。',
                en: 'Generate one question as a shareholder based on financial documents.'
            },
            director: {
                ja: '取締役として以下の質問に回答してください。',
                en: 'Respond to the following question as a director.'
            }
        };
        
        return prompts[role][language] || prompts[role]['ja'];
    }
}
```

#### 2. レスポンスキャッシュ

```javascript
class ResponseCache {
    static cache = new Map();
    static maxCacheSize = 50;
    
    static generateKey(prompt, options) {
        return btoa(JSON.stringify({ prompt, options }));
    }
    
    static get(prompt, options) {
        const key = this.generateKey(prompt, options);
        const cached = this.cache.get(key);
        
        if (cached && Date.now() - cached.timestamp < 3600000) { // 1時間有効
            console.log('💾 キャッシュからレスポンスを取得');
            return cached.response;
        }
        
        return null;
    }
    
    static set(prompt, options, response) {
        const key = this.generateKey(prompt, options);
        
        // キャッシュサイズ制限
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            response,
            timestamp: Date.now()
        });
        
        console.log('💾 レスポンスをキャッシュに保存');
    }
    
    static clear() {
        this.cache.clear();
        console.log('🗑️ レスポンスキャッシュをクリア');
    }
}
```

### 📊 使用量監視

```javascript
class UsageMonitor {
    static usage = {
        totalTokens: 0,
        totalCost: 0,
        apiCalls: 0,
        startTime: Date.now()
    };
    
    static recordUsage(tokens, modelType = 'gpt-4o-mini') {
        this.usage.totalTokens += tokens;
        this.usage.apiCalls++;
        
        // 料金計算（概算）
        const rates = {
            'gpt-4o-mini': 0.0001 // $0.0001 per 1K tokens
        };
        
        const cost = (tokens / 1000) * (rates[modelType] || 0.0001);
        this.usage.totalCost += cost;
        
        console.log(`📊 使用量更新: ${tokens}トークン, 累計コスト: $${this.usage.totalCost.toFixed(4)}`);
    }
    
    static getUsageReport() {
        const duration = Date.now() - this.usage.startTime;
        const hours = duration / (1000 * 60 * 60);
        
        return {
            ...this.usage,
            sessionDuration: `${hours.toFixed(2)}時間`,
            averageTokensPerCall: Math.round(this.usage.totalTokens / this.usage.apiCalls) || 0
        };
    }
    
    static checkUsageLimits() {
        const report = this.getUsageReport();
        
        if (report.totalCost > 10) { // $10制限
            console.warn('⚠️ 使用量制限に近づいています:', report);
            return false;
        }
        
        return true;
    }
}
```

## テストとデバッグ

### 🧪 API接続テスト

```javascript
class APITester {
    static async runFullTest(azureClient) {
        console.log('🧪 Azure OpenAI API 総合テスト開始');
        
        const tests = [
            this.testConnection.bind(this),
            this.testBasicCompletion.bind(this),
            this.testJapaneseCompletion.bind(this),
            this.testLongPrompt.bind(this),
            this.testErrorHandling.bind(this)
        ];
        
        const results = [];
        
        for (const test of tests) {
            try {
                const result = await test(azureClient);
                results.push(result);
                console.log(`✅ テスト合格: ${result.name}`);
            } catch (error) {
                results.push({
                    name: test.name,
                    success: false,
                    error: error.message
                });
                console.error(`❌ テスト失敗: ${test.name} - ${error.message}`);
            }
        }
        
        return results;
    }
    
    static async testConnection(client) {
        const result = await client.testConnection();
        if (!result.success) {
            throw new Error(result.message);
        }
        return { name: '接続テスト', success: true, usage: result.usage };
    }
    
    static async testBasicCompletion(client) {
        const messages = [
            { role: 'system', content: 'あなたは親切なアシスタントです。' },
            { role: 'user', content: '「こんにちは」と日本語で返答してください。' }
        ];
        
        const response = await client.callChatCompletion(messages, { maxTokens: 50 });
        
        if (!response.choices || response.choices.length === 0) {
            throw new Error('レスポンスが空です');
        }
        
        return { name: '基本補完テスト', success: true, response: response.choices[0].message.content };
    }
    
    static async testJapaneseCompletion(client) {
        const messages = [
            { role: 'system', content: '株主総会での質問を生成してください。' },
            { role: 'user', content: '売上高が前年比10%増加した理由について質問してください。' }
        ];
        
        const response = await client.callChatCompletion(messages, { maxTokens: 100 });
        const content = response.choices[0].message.content;
        
        // 日本語が含まれているかチェック
        if (!/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(content)) {
            throw new Error('日本語レスポンスが生成されませんでした');
        }
        
        return { name: '日本語補完テスト', success: true, response: content };
    }
}
```

## セキュリティベストプラクティス

### 🔐 API キー管理

```javascript
class SecureConfigManager {
    static encrypt(text, password) {
        // 実際の環境では crypto-js などの適切な暗号化ライブラリを使用
        return btoa(text); // 簡易実装
    }
    
    static decrypt(encryptedText, password) {
        try {
            return atob(encryptedText);
        } catch {
            throw new Error('復号化に失敗しました');
        }
    }
    
    static sanitizeApiKey(apiKey) {
        // APIキーの形式検証
        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error('APIキーが無効です');
        }
        
        if (apiKey.length < 10) {
            throw new Error('APIキーが短すぎます');
        }
        
        return apiKey.trim();
    }
    
    static maskApiKey(apiKey) {
        if (!apiKey || apiKey.length < 8) {
            return '***';
        }
        
        return apiKey.substring(0, 4) + '***' + apiKey.substring(apiKey.length - 4);
    }
}
```

### 🛡️ データ保護

```javascript
class DataProtection {
    static sanitizeInput(input) {
        // XSS攻撃の防止
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }
    
    static validatePDFContent(content) {
        // 不適切なコンテンツの検出
        const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /data:text\/html/i
        ];
        
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(content)) {
                throw new Error('安全でないコンテンツが検出されました');
            }
        }
        
        return true;
    }
    
    static limitContentSize(content, maxSize = 1000000) { // 1MB制限
        if (content.length > maxSize) {
            throw new Error(`コンテンツサイズが制限を超えています: ${content.length} > ${maxSize}`);
        }
        
        return true;
    }
}
```

## トラブルシューティング

### 🔍 よくある問題と解決策

| 問題 | 症状 | 解決策 |
|------|------|--------|
| 接続エラー | 「接続テスト」ボタンでエラー | エンドポイントとAPIキーを確認 |
| 日本語の文字化け | レスポンスが英語のみ | プロンプトに明示的に日本語指定を追加 |
| 生成速度が遅い | レスポンスに30秒以上かかる | max_tokensを減らす、プロンプトを短縮 |
| コンテンツフィルター | 回答が生成されない | より中立的なプロンプトに変更 |
| レート制限 | 429エラーが頻発 | リクエスト間隔を広げる、リトライ機能を実装 |

### 📝 デバッグ用ユーティリティ

```javascript
class DebugUtils {
    static logAPICall(url, headers, body, response) {
        console.group('🔍 API呼び出し詳細');
        console.log('URL:', url);
        console.log('Headers:', { ...headers, 'api-key': '***masked***' });
        console.log('Request Body:', JSON.stringify(body, null, 2));
        console.log('Response:', response);
        console.groupEnd();
    }
    
    static analyzeTokenUsage(prompt, response) {
        const usage = response.usage || {};
        console.group('📊 トークン使用量分析');
        console.log('Prompt Tokens:', usage.prompt_tokens);
        console.log('Completion Tokens:', usage.completion_tokens);
        console.log('Total Tokens:', usage.total_tokens);
        console.log('推定コスト:', `$${(usage.total_tokens * 0.0001 / 1000).toFixed(6)}`);
        console.groupEnd();
    }
    
    static exportDebugInfo() {
        const debugInfo = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            localStorage: Object.keys(localStorage),
            usage: UsageMonitor.getUsageReport(),
            lastErrors: this.getLastErrors()
        };
        
        const blob = new Blob([JSON.stringify(debugInfo, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-info-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
}
```