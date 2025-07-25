// 株主対話デモアプリケーション - メインJavaScript
// Author: GitHub Copilot & Coding Agent
// 技術要件: Azure OpenAI GPT-4.1-mini, PDF.js, HTML5, ES6

class ShareholderDialogueApp {
    constructor() {
        console.log('📊 株主対話デモアプリケーション初期化開始');
        
        // アプリケーション状態
        this.state = {
            isConnected: false,
            uploadedFiles: [],
            currentPdfData: null,
            currentPage: 1,
            totalPages: 0,
            dialogueHistory: [],
            conversationTurn: 0,
            pdfContent: '',
            isDialogueInProgress: false,
            selectedLanguage: 'ja',
            settingsCollapsed: false
        };

        // Azure OpenAI設定
        this.azureConfig = {
            endpoint: '',
            apiKey: '',
            deploymentName: '',
            apiVersion: '2024-02-15-preview'
        };

        // 言語設定
        this.languageConfig = {
            ja: {
                name: '日本語',
                shareholderPrompt: 'あなたは経験豊富な個人株主です。提供された決算資料や株主総会資料を基に、株主総会で取締役に対して行う質問を日本語で生成してください。',
                directorPrompt: 'あなたは会社の取締役です。株主総会で株主からの質問に対して日本語で回答してください。',
                summaryPrompt: '以下の株主総会での株主と取締役の対話を日本語で要約してください。',
                startMessage: '対話を開始します。株主からの質問を生成中...',
                endMessage: '対話が完了しました。「対話開始」ボタンで新しい対話を始めることができます。'
            },
            en: {
                name: 'English',
                shareholderPrompt: 'You are an experienced individual shareholder. Based on the provided financial statements and shareholder meeting materials, generate questions in English to ask the directors at the shareholder meeting.',
                directorPrompt: 'You are a company director. Please respond in English to questions from shareholders at the shareholder meeting.',
                summaryPrompt: 'Please summarize the following dialogue between shareholders and directors at the shareholder meeting in English.',
                startMessage: 'Starting dialogue. Generating shareholder questions...',
                endMessage: 'Dialogue completed. You can start a new dialogue with the "Start Dialogue" button.'
            },
            zh: {
                name: '中文',
                shareholderPrompt: '您是一位经验丰富的个人股东。基于提供的财务报表和股东大会资料，用中文生成在股东大会上向董事提出的问题。',
                directorPrompt: '您是公司董事。请用中文回答股东大会上股东的问题。',
                summaryPrompt: '请用中文总结以下股东大会上股东与董事的对话。',
                startMessage: '开始对话。正在生成股东问题...',
                endMessage: '对话已完成。您可以通过"开始对话"按钮开始新的对话。'
            },
            de: {
                name: 'Deutsch',
                shareholderPrompt: 'Sie sind ein erfahrener Privataktionär. Basierend auf den bereitgestellten Finanzberichten und Hauptversammlungsunterlagen, generieren Sie Fragen auf Deutsch, die Sie den Direktoren auf der Hauptversammlung stellen würden.',
                directorPrompt: 'Sie sind ein Unternehmensdirektor. Bitte antworten Sie auf Deutsch auf Fragen von Aktionären auf der Hauptversammlung.',
                summaryPrompt: 'Bitte fassen Sie den folgenden Dialog zwischen Aktionären und Direktoren auf der Hauptversammlung auf Deutsch zusammen.',
                startMessage: 'Dialog wird gestartet. Generiere Aktionärsfragen...',
                endMessage: 'Dialog abgeschlossen. Sie können mit der Schaltfläche "Dialog starten" einen neuen Dialog beginnen.'
            },
            fr: {
                name: 'Français',
                shareholderPrompt: 'Vous êtes un actionnaire individuel expérimenté. Basé sur les états financiers et les documents d\'assemblée d\'actionnaires fournis, générez des questions en français à poser aux directeurs lors de l\'assemblée d\'actionnaires.',
                directorPrompt: 'Vous êtes un directeur d\'entreprise. Veuillez répondre en français aux questions des actionnaires lors de l\'assemblée d\'actionnaires.',
                summaryPrompt: 'Veuillez résumer en français le dialogue suivant entre les actionnaires et les directeurs lors de l\'assemblée d\'actionnaires.',
                startMessage: 'Début du dialogue. Génération des questions d\'actionnaires...',
                endMessage: 'Dialogue terminé. Vous pouvez commencer un nouveau dialogue avec le bouton "Commencer le dialogue".'
            },
            es: {
                name: 'Español',
                shareholderPrompt: 'Eres un accionista individual experimentado. Basándote en los estados financieros y materiales de la junta de accionistas proporcionados, genera preguntas en español para hacer a los directores en la junta de accionistas.',
                directorPrompt: 'Eres un director de la empresa. Por favor responde en español a las preguntas de los accionistas en la junta de accionistas.',
                summaryPrompt: 'Por favor resume en español el siguiente diálogo entre accionistas y directores en la junta de accionistas.',
                startMessage: 'Iniciando diálogo. Generando preguntas de accionistas...',
                endMessage: 'Diálogo completado. Puedes iniciar un nuevo diálogo con el botón "Iniciar Diálogo".'
            },
            ko: {
                name: '한국어',
                shareholderPrompt: '당신은 경험이 풍부한 개인 주주입니다. 제공된 재무제표와 주주총회 자료를 바탕으로 주주총회에서 이사진에게 할 질문을 한국어로 생성해주세요.',
                directorPrompt: '당신은 회사의 이사입니다. 주주총회에서 주주들의 질문에 한국어로 답변해주세요.',
                summaryPrompt: '다음 주주총회에서 주주와 이사 간의 대화를 한국어로 요약해주세요.',
                startMessage: '대화를 시작합니다. 주주 질문 생성 중...',
                endMessage: '대화가 완료되었습니다. "대화 시작" 버튼으로 새로운 대화를 시작할 수 있습니다.'
            }
        };

        // DOM要素の参照
        this.initializeDOMReferences();
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // 設定の読み込み
        this.loadSettings();
        
        console.log('✅ アプリケーション初期化完了');
    }

    initializeDOMReferences() {
        console.log('🔍 DOM要素の参照を初期化中...');
        
        // 接続設定要素
        this.elements = {
            languageSelect: document.getElementById('languageSelect'),
            endpoint: document.getElementById('endpoint'),
            apiKey: document.getElementById('apiKey'),
            deploymentName: document.getElementById('deploymentName'),
            apiVersion: document.getElementById('apiVersion'),
            connectBtn: document.getElementById('connectBtn'),
            saveSettingsBtn: document.getElementById('saveSettingsBtn'),
            connectionStatus: document.getElementById('connectionStatus'),
            
            // 折り畳み機能要素
            connectionSettingsContainer: document.getElementById('connectionSettingsContainer'),
            connectionSettingsContent: document.getElementById('connectionSettingsContent'),
            collapseToggleBtn: document.getElementById('collapseToggleBtn'),
            collapseIcon: document.getElementById('collapseIcon'),
            
            // PDF関連要素
            pdfInput: document.getElementById('pdfInput'),
            filesList: document.getElementById('filesList'),
            pdfPreview: document.getElementById('pdfPreview'),
            pdfControls: document.getElementById('pdfControls'),
            prevPage: document.getElementById('prevPage'),
            nextPage: document.getElementById('nextPage'),
            pageInfo: document.getElementById('pageInfo'),
            
            // 対話関連要素
            startDialogueBtn: document.getElementById('startDialogueBtn'),
            clearDialogueBtn: document.getElementById('clearDialogueBtn'),
            dialogueStatus: document.getElementById('dialogueStatus'),
            dialogueContainer: document.getElementById('dialogueContainer'),
            loadingIndicator: document.getElementById('loadingIndicator'),
            
            // モーダル関連要素
            chatBubbleModal: document.getElementById('chatBubbleModal'),
            modalTitle: document.getElementById('modalTitle'),
            modalContent: document.getElementById('modalContent'),
            closeModalBtn: document.getElementById('closeModalBtn'),
            closeModalFooterBtn: document.getElementById('closeModalFooterBtn')
        };

        console.log('✅ DOM要素の参照初期化完了');
    }

    setupEventListeners() {
        console.log('🎧 イベントリスナーを設定中...');

        // 接続設定関連
        this.elements.languageSelect.addEventListener('change', (e) => this.handleLanguageChange(e));
        this.elements.connectBtn.addEventListener('click', () => this.testConnection());
        this.elements.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.elements.collapseToggleBtn.addEventListener('click', () => this.toggleSettingsCollapse());

        // PDF関連
        this.elements.pdfInput.addEventListener('change', (e) => this.handleFileUpload(e));
        this.elements.prevPage.addEventListener('click', () => this.previousPage());
        this.elements.nextPage.addEventListener('click', () => this.nextPage());

        // 対話関連
        this.elements.startDialogueBtn.addEventListener('click', () => this.startDialogue());
        this.elements.clearDialogueBtn.addEventListener('click', () => this.clearDialogue());

        // モーダル関連
        this.elements.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.elements.closeModalFooterBtn.addEventListener('click', () => this.closeModal());
        this.elements.chatBubbleModal.addEventListener('click', (e) => {
            // モーダル背景をクリックした時に閉じる
            if (e.target === this.elements.chatBubbleModal) {
                this.closeModal();
            }
        });

        // ESCキーでモーダルを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.elements.chatBubbleModal.classList.contains('hidden')) {
                this.closeModal();
            }
        });

        console.log('✅ イベントリスナー設定完了');
    }

    loadSettings() {
        console.log('💾 設定をローカルストレージから読み込み中...');
        
        try {
            // 環境変数から読み込み（優先）- ブラウザ環境では利用不可
            const envConfig = {
                endpoint: '',
                apiKey: '',
                deploymentName: '',
                apiVersion: '2024-02-15-preview'
            };

            // ローカルストレージから読み込み
            const savedConfig = JSON.parse(localStorage.getItem('azureOpenAIConfig') || '{}');
            const savedLanguage = localStorage.getItem('selectedLanguage') || 'ja';
            const savedSettingsCollapsed = localStorage.getItem('settingsCollapsed') === 'true';
            
            // 設定をマージ（環境変数を優先）
            this.azureConfig = {
                endpoint: envConfig.endpoint || savedConfig.endpoint || '',
                apiKey: envConfig.apiKey || savedConfig.apiKey || '',
                deploymentName: envConfig.deploymentName || savedConfig.deploymentName || '',
                apiVersion: envConfig.apiVersion || savedConfig.apiVersion || '2024-02-15-preview'
            };

            // 言語設定を復元
            this.state.selectedLanguage = savedLanguage;
            this.state.settingsCollapsed = savedSettingsCollapsed;

            // UIに反映
            this.elements.endpoint.value = this.azureConfig.endpoint;
            this.elements.apiKey.value = this.azureConfig.apiKey;
            this.elements.deploymentName.value = this.azureConfig.deploymentName;
            this.elements.apiVersion.value = this.azureConfig.apiVersion;
            this.elements.languageSelect.value = this.state.selectedLanguage;
            
            // 折り畳み状態を復元
            this.applyCollapseState();

            console.log('✅ 設定読み込み完了:', { 
                hasEndpoint: !!this.azureConfig.endpoint,
                hasApiKey: !!this.azureConfig.apiKey,
                hasDeploymentName: !!this.azureConfig.deploymentName
            });
        } catch (error) {
            console.error('❌ 設定読み込みエラー:', error);
        }
    }

    saveSettings() {
        console.log('💾 設定をローカルストレージに保存中...');
        
        try {
            this.azureConfig = {
                endpoint: this.elements.endpoint.value.trim(),
                apiKey: this.elements.apiKey.value.trim(),
                deploymentName: this.elements.deploymentName.value.trim(),
                apiVersion: this.elements.apiVersion.value.trim()
            };

            localStorage.setItem('azureOpenAIConfig', JSON.stringify(this.azureConfig));
            localStorage.setItem('selectedLanguage', this.state.selectedLanguage);
            localStorage.setItem('settingsCollapsed', this.state.settingsCollapsed.toString());
            
            this.showMessage('設定が保存されました', 'success');
            console.log('✅ 設定保存完了');
        } catch (error) {
            console.error('❌ 設定保存エラー:', error);
            this.showMessage('設定の保存に失敗しました', 'error');
        }
    }

    handleLanguageChange(event) {
        console.log('🌐 言語変更:', event.target.value);
        
        this.state.selectedLanguage = event.target.value;
        localStorage.setItem('selectedLanguage', this.state.selectedLanguage);
        
        const languageName = this.languageConfig[this.state.selectedLanguage].name;
        console.log(`✅ 対話言語を${languageName}に変更しました`);
    }

    toggleSettingsCollapse() {
        console.log('🔄 設定セクション折り畳み状態切り替え');
        
        this.state.settingsCollapsed = !this.state.settingsCollapsed;
        localStorage.setItem('settingsCollapsed', this.state.settingsCollapsed.toString());
        
        this.applyCollapseState();
        
        console.log(`✅ 設定セクション: ${this.state.settingsCollapsed ? '折り畳み' : '展開'}`);
    }

    applyCollapseState() {
        console.log('🎨 折り畳み状態を適用:', this.state.settingsCollapsed);
        
        if (this.state.settingsCollapsed) {
            this.elements.connectionSettingsContainer.classList.add('connection-settings-collapsed');
        } else {
            this.elements.connectionSettingsContainer.classList.remove('connection-settings-collapsed');
        }
    }

    autoCollapseSettings() {
        console.log('🎯 接続成功後の自動折り畳み');
        
        // 接続成功後に自動的に折り畳む
        if (this.state.isConnected && !this.state.settingsCollapsed) {
            this.state.settingsCollapsed = true;
            localStorage.setItem('settingsCollapsed', 'true');
            this.applyCollapseState();
            
            console.log('✅ 接続成功により設定セクションを自動折り畳み');
        }
    }

    async testConnection() {
        console.log('🔗 Azure OpenAI接続テスト開始...');
        
        this.updateConnectionStatus('connecting', '接続中...');
        this.elements.connectBtn.disabled = true;

        try {
            // 設定の取得
            this.azureConfig = {
                endpoint: this.elements.endpoint.value.trim(),
                apiKey: this.elements.apiKey.value.trim(),
                deploymentName: this.elements.deploymentName.value.trim(),
                apiVersion: this.elements.apiVersion.value.trim()
            };

            // 設定の検証
            if (!this.azureConfig.endpoint || !this.azureConfig.apiKey || !this.azureConfig.deploymentName) {
                throw new Error('必要な設定項目が入力されていません');
            }

            // テスト用リクエスト
            const response = await this.callAzureOpenAI([
                { role: 'user', content: 'Hello, this is a connection test.' }
            ], 10);

            if (response && response.choices && response.choices[0]) {
                this.state.isConnected = true;
                this.updateConnectionStatus('connected', '接続成功');
                this.showMessage('Azure OpenAIへの接続に成功しました', 'success');
                this.updateDialogueStatus();
                
                // 接続成功後に自動で折り畳む
                setTimeout(() => this.autoCollapseSettings(), 1000);
                
                console.log('✅ 接続テスト成功');
            } else {
                throw new Error('予期しないレスポンス形式');
            }
        } catch (error) {
            console.error('❌ 接続テストエラー:', error);
            this.state.isConnected = false;
            this.updateConnectionStatus('disconnected', '接続失敗');
            this.showMessage(`接続エラー: ${error.message}`, 'error');
        } finally {
            this.elements.connectBtn.disabled = false;
        }
    }

    async callAzureOpenAI(messages, maxTokens = 1000) {
        console.log('🤖 Azure OpenAI API呼び出し開始:', { 
            messageCount: messages.length,
            maxTokens: maxTokens
        });

        const url = `${this.azureConfig.endpoint}/openai/deployments/${this.azureConfig.deploymentName}/chat/completions?api-version=${this.azureConfig.apiVersion}`;
        
        const requestBody = {
            messages: messages,
            max_tokens: maxTokens,
            temperature: 0.7,
            top_p: 0.9,
            frequency_penalty: 0,
            presence_penalty: 0
        };

        console.log('📤 API リクエスト送信:', { url: url.replace(this.azureConfig.apiKey, '***'), body: requestBody });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': this.azureConfig.apiKey
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API レスポンスエラー:', { status: response.status, text: errorText });
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('📥 API レスポンス受信:', { 
            hasChoices: !!result.choices,
            choiceCount: result.choices?.length,
            usage: result.usage
        });

        return result;
    }

    async handleFileUpload(event) {
        console.log('📄 PDFファイルアップロード処理開始...');
        
        const files = Array.from(event.target.files);
        console.log('📁 選択されたファイル数:', files.length);

        for (const file of files) {
            if (file.type === 'application/pdf') {
                console.log('📄 PDFファイル処理開始:', file.name);
                
                try {
                    const fileData = await this.processPDFFile(file);
                    this.state.uploadedFiles.push(fileData);
                    this.addFileToList(fileData);
                    console.log('✅ PDFファイル処理完了:', file.name);
                } catch (error) {
                    console.error('❌ PDFファイル処理エラー:', error);
                    this.showMessage(`PDFファイルの処理に失敗しました: ${file.name}`, 'error');
                }
            } else {
                console.warn('⚠️ PDFファイル以外がアップロードされました:', file.name);
                this.showMessage(`PDFファイルのみアップロード可能です: ${file.name}`, 'warning');
            }
        }

        this.updateDialogueStatus();
    }

    async processPDFFile(file) {
        console.log('🔍 PDFファイル解析開始:', file.name);
        
        if (typeof pdfjsLib === 'undefined') {
            throw new Error('PDF.jsライブラリが読み込まれていません。ページを再読み込みしてください。');
        }
        
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        console.log('📖 PDFページ数:', pdf.numPages);
        
        let fullText = '';
        const pages = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            console.log(`📄 ページ ${pageNum} 処理中...`);
            
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            
            pages.push({
                pageNumber: pageNum,
                text: pageText,
                page: page
            });
            
            fullText += pageText + '\n\n';
        }

        const fileData = {
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            pdf: pdf,
            pages: pages,
            fullText: fullText,
            uploadedAt: new Date()
        };

        console.log('✅ PDFファイル解析完了:', { 
            name: file.name, 
            pages: pdf.numPages,
            textLength: fullText.length
        });

        return fileData;
    }

    addFileToList(fileData) {
        console.log('📋 ファイルリストに追加:', fileData.name);
        
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item cursor-pointer';
        fileElement.dataset.fileId = fileData.id;
        
        fileElement.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex-1">
                    <div class="font-medium text-gray-900">${fileData.name}</div>
                    <div class="text-sm text-gray-500">
                        ${this.formatFileSize(fileData.size)} • ${fileData.pages.length}ページ
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="preview-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                        👁️ プレビュー
                    </button>
                    <button class="remove-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                        🗑️ 削除
                    </button>
                </div>
            </div>
        `;

        // イベントリスナーの追加
        fileElement.querySelector('.preview-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.previewPDF(fileData);
        });

        fileElement.querySelector('.remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeFile(fileData.id);
        });

        this.elements.filesList.appendChild(fileElement);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async previewPDF(fileData) {
        console.log('👁️ PDFプレビュー表示:', fileData.name);
        
        this.state.currentPdfData = fileData;
        this.state.currentPage = 1;
        this.state.totalPages = fileData.pages.length;
        
        await this.renderPDFPage();
        this.updatePageInfo();
        this.elements.pdfControls.classList.remove('hidden');
    }

    async renderPDFPage() {
        if (!this.state.currentPdfData) return;

        console.log(`🖼️ PDFページ ${this.state.currentPage} をレンダリング中...`);
        
        try {
            const page = this.state.currentPdfData.pages[this.state.currentPage - 1].page;
            const scale = 1.5;
            const viewport = page.getViewport({ scale: scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            await page.render(renderContext).promise;
            
            this.elements.pdfPreview.innerHTML = '';
            this.elements.pdfPreview.appendChild(canvas);
            
            console.log('✅ PDFページレンダリング完了');
        } catch (error) {
            console.error('❌ PDFページレンダリングエラー:', error);
            this.elements.pdfPreview.innerHTML = '<p class="text-red-500">PDFのレンダリングに失敗しました</p>';
        }
    }

    updatePageInfo() {
        this.elements.pageInfo.textContent = `ページ ${this.state.currentPage} / ${this.state.totalPages}`;
        this.elements.prevPage.disabled = this.state.currentPage <= 1;
        this.elements.nextPage.disabled = this.state.currentPage >= this.state.totalPages;
    }

    previousPage() {
        if (this.state.currentPage > 1) {
            this.state.currentPage--;
            this.renderPDFPage();
            this.updatePageInfo();
            console.log('⬅️ 前のページに移動:', this.state.currentPage);
        }
    }

    nextPage() {
        if (this.state.currentPage < this.state.totalPages) {
            this.state.currentPage++;
            this.renderPDFPage();
            this.updatePageInfo();
            console.log('➡️ 次のページに移動:', this.state.currentPage);
        }
    }

    removeFile(fileId) {
        console.log('🗑️ ファイル削除:', fileId);
        
        this.state.uploadedFiles = this.state.uploadedFiles.filter(file => file.id !== fileId);
        const fileElement = document.querySelector(`[data-file-id="${fileId}"]`);
        if (fileElement) {
            fileElement.remove();
        }

        // プレビュー中のファイルが削除された場合
        if (this.state.currentPdfData && this.state.currentPdfData.id === fileId) {
            this.elements.pdfPreview.innerHTML = 'PDFファイルを選択するとここにプレビューが表示されます';
            this.elements.pdfControls.classList.add('hidden');
            this.state.currentPdfData = null;
        }

        this.updateDialogueStatus();
    }

    async startDialogue() {
        console.log('🚀 対話開始...');
        
        if (!this.state.isConnected) {
            this.showMessage('Azure OpenAIに接続してください', 'warning');
            return;
        }

        if (this.state.uploadedFiles.length === 0) {
            this.showMessage('PDFファイルをアップロードしてください', 'warning');
            return;
        }

        if (this.state.isDialogueInProgress) {
            this.showMessage('対話が既に進行中です', 'warning');
            return;
        }

        this.state.isDialogueInProgress = true;
        this.state.conversationTurn = 0;
        this.elements.startDialogueBtn.disabled = true;
        this.showLoading(true);

        try {
            // PDFコンテンツの準備
            this.preparePDFContext();
            
            // 対話開始メッセージ
            const langConfig = this.languageConfig[this.state.selectedLanguage];
            this.addDialogueMessage('system', langConfig.startMessage, '🤖');
            
            await this.generateShareholderQuestion();
        } catch (error) {
            console.error('❌ 対話開始エラー:', error);
            this.showMessage('対話の開始に失敗しました', 'error');
            this.state.isDialogueInProgress = false;
            this.elements.startDialogueBtn.disabled = false;
        } finally {
            this.showLoading(false);
        }
    }

    preparePDFContext() {
        console.log('📄 PDFコンテキスト準備中...');
        
        let combinedContent = '';
        this.state.uploadedFiles.forEach(file => {
            combinedContent += `\n\n=== ${file.name} ===\n${file.fullText}`;
        });

        // コンテキスト長を制限（トークン数を概算）
        const maxLength = 20000; // 約15,000トークン相当
        if (combinedContent.length > maxLength) {
            combinedContent = combinedContent.substring(0, maxLength) + '...\n[文書が長いため、以下省略]';
            console.log('⚠️ PDFコンテンツが長いため切り詰められました');
        }

        this.state.pdfContent = combinedContent;
        console.log('✅ PDFコンテキスト準備完了:', { length: combinedContent.length });
    }

    async generateShareholderQuestion() {
        console.log('💭 株主質問生成中...');
        
        const langConfig = this.languageConfig[this.state.selectedLanguage];
        const systemPrompt = `${langConfig.shareholderPrompt}

以下の観点から質問を作成してください：
- 業績や財務状況に関する懸念
- 経営戦略や将来計画への疑問
- 株主還元政策について
- リスク要因や課題について
- 市場環境への対応について

質問は具体的で建設的なものにし、株主の利益を代表する内容にしてください。

資料内容：
${this.state.pdfContent}`;

        const conversationHistory = this.buildConversationHistory();
        let userPrompt = '';

        if (this.state.conversationTurn === 0) {
            userPrompt = '最初の質問を1つ生成してください。資料の内容を踏まえた重要な質問をお願いします。';
        } else {
            userPrompt = `これまでの対話を踏まえて、次の質問を1つ生成してください。前回の取締役の回答に対するフォローアップや新しい観点からの質問をお願いします。

これまでの対話：
${conversationHistory}`;
        }

        try {
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            const response = await this.callAzureOpenAI(messages, 500);
            const question = response.choices[0].message.content.trim();

            console.log('✅ 株主質問生成完了');
            this.addDialogueMessage('shareholder', question, '👤');
            this.state.dialogueHistory.push({ role: 'shareholder', content: question });

            // 取締役の回答を生成
            setTimeout(() => this.generateDirectorResponse(question), 1000);
        } catch (error) {
            console.error('❌ 株主質問生成エラー:', error);
            throw error;
        }
    }

    async generateDirectorResponse(question) {
        console.log('💼 取締役回答生成中...');
        
        this.showLoading(true);

        const langConfig = this.languageConfig[this.state.selectedLanguage];
        const systemPrompt = `${langConfig.directorPrompt}

以下の点に注意して回答してください：
- 誠実で透明性のある回答を心がける
- 具体的なデータや事実に基づいて説明する
- 将来の見通しについては適切な注意喚起を含める
- 株主の懸念に真摯に向き合う姿勢を示す
- 法令やコンプライアンスに配慮した内容にする

会社資料：
${this.state.pdfContent}

株主からの質問：
${question}`;

        const conversationHistory = this.buildConversationHistory();
        const userPrompt = `この質問に対して取締役として回答してください。

これまでの対話：
${conversationHistory}

今回の質問：
${question}`;

        try {
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            const response = await this.callAzureOpenAI(messages, 800);
            const answer = response.choices[0].message.content.trim();

            console.log('✅ 取締役回答生成完了');
            this.addDialogueMessage('director', answer, '👔');
            this.state.dialogueHistory.push({ role: 'director', content: answer });
            this.state.conversationTurn++;

            // 5ターン完了チェック
            if (this.state.conversationTurn >= 5) {
                setTimeout(() => this.generateSummary(), 1000);
            } else {
                // 次の質問を生成
                setTimeout(() => this.generateShareholderQuestion(), 1500);
            }
        } catch (error) {
            console.error('❌ 取締役回答生成エラー:', error);
            this.showMessage('取締役の回答生成に失敗しました', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async generateSummary() {
        console.log('📝 対話要約生成中...');
        
        this.showLoading(true);

        const conversationHistory = this.buildConversationHistory();
        const langConfig = this.languageConfig[this.state.selectedLanguage];
        const systemPrompt = `${langConfig.summaryPrompt}

要約のポイント：
- 主要な質問項目と回答のポイント
- 重要な議論の内容
- 株主の関心事項
- 取締役の説明内容
- 今後の課題や注目点

対話内容：
${conversationHistory}`;

        const userPrompt = '上記の対話を簡潔に要約してください。';

        try {
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            const response = await this.callAzureOpenAI(messages, 600);
            const summary = response.choices[0].message.content.trim();

            console.log('✅ 対話要約生成完了');
            this.addDialogueMessage('system', `## 対話要約\n\n${summary}`, '📋');
            
            // 対話完了時に要約を自動的にポップアップ表示
            setTimeout(() => {
                console.log('🎉 対話完了 - 要約を自動ポップアップ表示');
                this.openModal(`## 対話要約\n\n${summary}`, 'system', '📋');
            }, 1000);
            
            // 対話終了
            this.state.isDialogueInProgress = false;
            this.elements.startDialogueBtn.disabled = false;
            const langConfig = this.languageConfig[this.state.selectedLanguage];
            this.addDialogueMessage('system', langConfig.endMessage, '✅');
        } catch (error) {
            console.error('❌ 対話要約生成エラー:', error);
            this.showMessage('対話の要約生成に失敗しました', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    buildConversationHistory() {
        return this.state.dialogueHistory
            .map(entry => `${entry.role === 'shareholder' ? '株主' : '取締役'}: ${entry.content}`)
            .join('\n\n');
    }

    addDialogueMessage(role, content, icon) {
        console.log(`💬 対話メッセージ追加: ${role}`);
        
        const messageElement = document.createElement('div');
        messageElement.className = 'fade-in';
        
        let bubbleClass = '';
        let alignClass = '';
        
        switch (role) {
            case 'shareholder':
                bubbleClass = 'shareholder-bubble';
                alignClass = 'justify-start';
                break;
            case 'director':
                bubbleClass = 'director-bubble';
                alignClass = 'justify-end';
                break;
            case 'system':
                bubbleClass = 'system-bubble';
                alignClass = 'justify-center';
                break;
        }

        messageElement.innerHTML = `
            <div class="flex ${alignClass}">
                <div class="chat-bubble ${bubbleClass} text-white" data-role="${role}" data-icon="${icon}" data-content="${this.escapeHtml(content)}" title="クリックして拡大表示">
                    <div class="flex items-start gap-3">
                        <div class="text-2xl">${icon}</div>
                        <div class="chat-content flex-1">${this.renderMarkdown(content)}</div>
                    </div>
                    <div class="text-xs opacity-75 mt-2">
                        ${new Date().toLocaleTimeString('ja-JP')}
                    </div>
                </div>
            </div>
        `;

        // 吹き出しクリックイベントの追加
        const chatBubble = messageElement.querySelector('.chat-bubble');
        chatBubble.addEventListener('click', () => {
            console.log('🔍 吹き出しクリック:', role);
            this.openModal(content, role, icon);
        });

        this.elements.dialogueContainer.appendChild(messageElement);
        
        // スムーズに最新メッセージまでスクロール
        this.scrollToLatestMessage();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    scrollToLatestMessage() {
        console.log('📜 最新メッセージまでスクロール中...');
        
        // 要素が追加された後、少し遅延してスクロール実行
        setTimeout(() => {
            const container = this.elements.dialogueContainer;
            if (container) {
                // スムーズスクロールで最下部まで移動
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
                
                console.log(`📜 スクロール完了: ${container.scrollTop}/${container.scrollHeight}`);
            }
        }, 100);
    }

    renderMarkdown(text) {
        // 簡易マークダウンレンダリング
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^(.*)/, '<p>$1')
            .replace(/(.*$)/, '$1</p>');
    }

    clearDialogue() {
        console.log('🗑️ 対話クリア');
        
        this.state.dialogueHistory = [];
        this.state.conversationTurn = 0;
        this.state.isDialogueInProgress = false;
        this.elements.dialogueContainer.innerHTML = '';
        this.elements.startDialogueBtn.disabled = false;
        
        this.showMessage('対話がクリアされました', 'success');
    }

    updateConnectionStatus(status, message) {
        const statusElement = this.elements.connectionStatus;
        statusElement.className = `status-indicator ${status}`;
        statusElement.innerHTML = `
            <span class="w-2 h-2 rounded-full ${
                status === 'connected' ? 'bg-green-500' : 
                status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }"></span>
            <span>${message}</span>
        `;
    }

    updateDialogueStatus() {
        const hasConnection = this.state.isConnected;
        const hasFiles = this.state.uploadedFiles.length > 0;
        
        if (hasConnection && hasFiles) {
            this.elements.dialogueStatus.textContent = '対話を開始する準備ができました';
            this.elements.startDialogueBtn.disabled = false;
        } else if (!hasConnection) {
            this.elements.dialogueStatus.textContent = 'Azure OpenAIに接続してください';
            this.elements.startDialogueBtn.disabled = true;
        } else if (!hasFiles) {
            this.elements.dialogueStatus.textContent = 'PDFファイルをアップロードしてください';
            this.elements.startDialogueBtn.disabled = true;
        }
    }

    showLoading(show) {
        if (show) {
            this.elements.loadingIndicator.classList.remove('hidden');
        } else {
            this.elements.loadingIndicator.classList.add('hidden');
        }
    }

    showMessage(message, type = 'info') {
        console.log(`📢 メッセージ表示 (${type}):`, message);
        
        // 簡易的なメッセージ表示（アラート）
        if (type === 'error') {
            alert(`❌ エラー: ${message}`);
        } else if (type === 'warning') {
            alert(`⚠️ 警告: ${message}`);
        } else if (type === 'success') {
            alert(`✅ 成功: ${message}`);
        } else {
            alert(`ℹ️ 情報: ${message}`);
        }
    }

    // モーダル関連メソッド
    openModal(content, role = 'system', icon = '💬') {
        console.log('🔍 モーダルを開く:', { role, contentLength: content.length });
        
        // タイトルとアイコンの設定
        let titleText = '';
        let titleClass = '';
        
        switch (role) {
            case 'shareholder':
                titleText = `${icon} 株主の発言`;
                titleClass = 'modal-title-shareholder';
                break;
            case 'director':
                titleText = `${icon} 取締役の回答`;
                titleClass = 'modal-title-director';
                break;
            case 'system':
                titleText = `${icon} システムメッセージ`;
                titleClass = 'modal-title-system';
                break;
            default:
                titleText = `${icon} 吹き出しの内容`;
                titleClass = '';
        }
        
        // タイトルの設定
        this.elements.modalTitle.textContent = titleText;
        this.elements.modalTitle.className = `text-xl font-semibold ${titleClass}`;
        
        // コンテンツの設定（マークダウンレンダリング適用）
        this.elements.modalContent.innerHTML = this.renderMarkdownForModal(content);
        
        // モーダルを表示
        this.elements.chatBubbleModal.classList.remove('hidden');
        this.elements.chatBubbleModal.classList.add('show');
        
        // ボディのスクロールを無効化
        document.body.style.overflow = 'hidden';
        
        console.log('✅ モーダル表示完了');
    }

    closeModal() {
        console.log('❌ モーダルを閉じる');
        
        // モーダルを非表示
        this.elements.chatBubbleModal.classList.remove('show');
        this.elements.chatBubbleModal.classList.add('hidden');
        
        // ボディのスクロールを復元
        document.body.style.overflow = '';
        
        console.log('✅ モーダル非表示完了');
    }

    renderMarkdownForModal(text) {
        // モーダル用の強化されたマークダウンレンダリング
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
            .replace(/^\- (.*$)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
            .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gs, '<ol>$1</ol>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^(.*)/, '<p>$1')
            .replace(/(.*$)/, '$1</p>')
            .replace(/<p><\/p>/g, '') // 空の段落を削除
            .replace(/<p>(<[huo])/g, '$1') // 見出しやリストの前の段落タグを削除
            .replace(/(<\/[huo][^>]*>)<\/p>/g, '$1'); // 見出しやリストの後の段落タグを削除
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM読み込み完了 - アプリケーション開始');
    window.shareholderApp = new ShareholderDialogueApp();
});

// エラーハンドリング
window.addEventListener('error', (event) => {
    console.error('🚨 グローバルエラー:', event.error);
});

// PDF.js設定
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    console.log('✅ PDF.js ライブラリ読み込み完了');
} else {
    console.warn('⚠️ PDF.js ライブラリが読み込まれていません。PDFアップロード機能は制限されます。');
}

console.log('📊 株主対話デモアプリケーション - スクリプト読み込み完了');