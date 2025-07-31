// PowerPoint PDF テキスト抽出機能のテストケース
// このファイルは改善された機能のデモンストレーション用です

// PowerPoint PDFのシミュレートされたテキストアイテム（実際のPDF.jsから抽出されるデータ形式）
const mockPowerPointPDFContent = {
    items: [
        // タイトル（上部中央）
        { str: "2024年度決算説明会", transform: [24, 0, 0, 24, 300, 750] },
        
        // サブタイトル（タイトル下）
        { str: "業績ハイライト", transform: [18, 0, 0, 18, 350, 720] },
        
        // 左上のボックス内容
        { str: "売上高", transform: [14, 0, 0, 14, 100, 650] },
        { str: "1,000億円", transform: [16, 0, 0, 16, 100, 630] },
        { str: "(前年比+15%)", transform: [12, 0, 0, 12, 100, 610] },
        
        // 重複したテキスト（PowerPoint特有）
        { str: "売上高", transform: [14, 0, 0, 14, 102, 652] }, // わずかにずれた重複
        
        // 右上のボックス内容
        { str: "営業利益", transform: [14, 0, 0, 14, 400, 650] },
        { str: "150億円", transform: [16, 0, 0, 16, 400, 630] },
        { str: "(前年比+25%)", transform: [12, 0, 0, 12, 400, 610] },
        
        // 中央部のテキスト
        { str: "主要な成果", transform: [16, 0, 0, 16, 250, 550] },
        { str: "1. 新製品の売上寄与が好調", transform: [12, 0, 0, 12, 50, 520] },
        { str: "2. 海外展開の加速", transform: [12, 0, 0, 12, 50, 500] },
        { str: "3. コスト削減効果", transform: [12, 0, 0, 12, 50, 480] },
        
        // フッター部分
        { str: "今後の展望", transform: [14, 0, 0, 14, 250, 420] },
        { str: "デジタル変革の推進により、", transform: [11, 0, 0, 11, 50, 390] },
        { str: "さらなる成長を目指します", transform: [11, 0, 0, 11, 50, 375] },
        
        // バラバラに配置されたテキスト（PowerPoint特有の問題）
        { str: "株主還元", transform: [14, 0, 0, 14, 450, 420] },
        { str: "配当性向30%を目標", transform: [11, 0, 0, 11, 450, 390] },
        
        // より細かく分割されたテキスト
        { str: "2025年度", transform: [12, 0, 0, 12, 50, 320] },
        { str: "売上目標", transform: [12, 0, 0, 12, 120, 320] },
        { str: "1,200億円", transform: [12, 0, 0, 12, 190, 320] }
    ]
};

// テスト用のShareholderDialogueAppクラスのインスタンス（簡略版）
class TestShareholderDialogueApp {
    constructor() {
        console.log('🧪 PowerPoint PDFテキスト抽出テスト開始');
    }
    
    // 実際の改善されたメソッドをテスト用にコピー
    extractTextFromPowerPointPDF(textContent, pageNum) {
        console.log(`🔧 ページ ${pageNum} - PowerPoint PDF最適化テキスト抽出開始`);
        
        if (!textContent.items || textContent.items.length === 0) {
            console.log(`⚠️ ページ ${pageNum} - テキストアイテムが見つかりません`);
            return '';
        }

        console.log(`🔍 ページ ${pageNum} - 最初の5個のテキストアイテム詳細:`);
        textContent.items.slice(0, 5).forEach((item, index) => {
            console.log(`  ${index}: "${item.str}" at (${item.transform[4]}, ${item.transform[5]}) size: ${item.transform[0]}`);
        });

        try {
            return this.extractTextWithCoordinateBasedSorting(textContent, pageNum);
        } catch (error) {
            console.warn(`⚠️ ページ ${pageNum} - 座標ベース抽出に失敗、シンプル抽出に切り替え:`, error);
            return this.extractTextSimple(textContent, pageNum);
        }
    }

    extractTextWithCoordinateBasedSorting(textContent, pageNum) {
        const textItems = textContent.items.map(item => ({
            text: item.str,
            x: item.transform ? item.transform[4] : 0,
            y: item.transform ? item.transform[5] : 0,
            fontSize: item.transform ? item.transform[0] : 12,
            width: item.width || 0,
            height: item.height || 0,
            fontName: item.fontName || 'unknown'
        })).filter(item => item.text && item.text.trim() !== '');

        console.log(`📊 ページ ${pageNum} - 有効なテキストアイテム数: ${textItems.length}`);

        if (textItems.length === 0) {
            return '';
        }

        textItems.sort((a, b) => {
            const yDiff = Math.abs(a.y - b.y);
            if (yDiff <= 5) {
                return a.x - b.x;
            }
            return b.y - a.y;
        });

        const processedLines = [];
        let currentLine = [];
        let lastY = null;
        let lastText = '';

        for (const item of textItems) {
            if (this.isDuplicateText(item.text, lastText) || 
                this.isOverlappingPosition(item, currentLine)) {
                console.log(`🚫 ページ ${pageNum} - 重複テキストをスキップ: "${item.text}"`);
                continue;
            }

            if (lastY !== null && Math.abs(item.y - lastY) > 5) {
                if (currentLine.length > 0) {
                    processedLines.push(currentLine.map(i => i.text).join(' ').trim());
                    currentLine = [];
                }
            }

            currentLine.push(item);
            lastY = item.y;
            lastText = item.text;
        }

        if (currentLine.length > 0) {
            processedLines.push(currentLine.map(i => i.text).join(' ').trim());
        }

        const result = processedLines
            .filter(line => line.trim() !== '')
            .join('\n');

        console.log(`✅ ページ ${pageNum} - 座標ベーステキスト抽出完了: ${result.length}文字`);
        console.log(`📝 ページ ${pageNum} - 抽出された行数: ${processedLines.length}`);
        
        return result;
    }

    extractTextSimple(textContent, pageNum) {
        console.log(`🔄 ページ ${pageNum} - シンプルテキスト抽出実行`);
        
        const simpleText = textContent.items
            .map(item => item.str)
            .filter(text => text && text.trim() !== '')
            .join(' ');
        
        console.log(`✅ ページ ${pageNum} - シンプル抽出完了: ${simpleText.length}文字`);
        return simpleText;
    }

    isDuplicateText(text1, text2) {
        if (!text1 || !text2) return false;
        
        if (text1 === text2) return true;
        
        if (text1.length > 3 && text2.length > 3) {
            return text1.includes(text2) || text2.includes(text1);
        }
        
        return false;
    }

    isOverlappingPosition(newItem, existingLine) {
        for (const existingItem of existingLine) {
            const xDiff = Math.abs(newItem.x - existingItem.x);
            const yDiff = Math.abs(newItem.y - existingItem.y);
            
            if (xDiff < 10 && yDiff < 5) {
                return true;
            }
        }
        return false;
    }
}

// テスト実行
function runPowerPointPDFTest() {
    console.log('🚀 PowerPoint PDF テキスト抽出改善のデモンストレーション開始');
    console.log('');
    
    const testApp = new TestShareholderDialogueApp();
    
    // 従来の方法でのテキスト抽出（比較用）
    console.log('📄 === 従来の方法（シンプル結合） ===');
    const oldMethod = mockPowerPointPDFContent.items.map(item => item.str).join(' ');
    console.log(oldMethod);
    console.log('');
    
    // 改善された方法でのテキスト抽出
    console.log('📄 === 改善された方法（座標ベースソート + 重複除去） ===');
    const newMethod = testApp.extractTextFromPowerPointPDF(mockPowerPointPDFContent, 1);
    console.log(newMethod);
    console.log('');
    
    // 結果の比較
    console.log('📊 === 結果比較 ===');
    console.log(`従来の方法: ${oldMethod.length}文字`);
    console.log(`改善された方法: ${newMethod.length}文字`);
    console.log('');
    
    console.log('✅ PowerPoint PDF テキスト抽出改善のデモンストレーション完了');
    console.log('');
    console.log('📋 === 完全な抽出テキスト内容 (デバッグ用) ===');
    console.log(newMethod);
    console.log('📋 === テキスト内容終了 ===');
}

// テスト実行（ブラウザのコンソールで実行可能）
if (typeof window !== 'undefined') {
    // ブラウザ環境
    window.runPowerPointPDFTest = runPowerPointPDFTest;
    console.log('🔧 PowerPoint PDFテスト関数を準備しました。runPowerPointPDFTest() を実行してください。');
} else {
    // Node.js環境
    runPowerPointPDFTest();
}