// ==========================================
// アプリケーションの状態管理
// ==========================================

class SenkuApp {
    constructor() {
        this.STORAGE_KEY = 'senku_items';
        this.items = [];
        this.editingId = null;

        // DOM要素の取得
        this.elements = {
            itemTitle: document.getElementById('itemTitle'),
            itemContent: document.getElementById('itemContent'),
            addButton: document.getElementById('addButton'),
            cancelButton: document.getElementById('cancelButton'),
            itemsList: document.getElementById('itemsList'),
            emptyState: document.getElementById('emptyState'),
            itemCount: document.getElementById('itemCount')
        };

        this.init();
    }

    // ==========================================
    // 初期化
    // ==========================================

    init() {
        this.loadItems();
        this.renderItems();
        this.attachEventListeners();
    }

    // ==========================================
    // イベントリスナー
    // ==========================================

    attachEventListeners() {
        // 追加/更新ボタン
        this.elements.addButton.addEventListener('click', () => {
            if (this.editingId) {
                this.updateItem();
            } else {
                this.addItem();
            }
        });

        // キャンセルボタン
        this.elements.cancelButton.addEventListener('click', () => {
            this.cancelEdit();
        });

        // Enterキーで送信（タイトルフィールド）
        this.elements.itemTitle.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.editingId) {
                    this.updateItem();
                } else {
                    this.addItem();
                }
            }
        });

        // Ctrl+Enterで送信（内容フィールド）
        this.elements.itemContent.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (this.editingId) {
                    this.updateItem();
                } else {
                    this.addItem();
                }
            }
        });
    }

    // ==========================================
    // ローカルストレージ操作
    // ==========================================

    loadItems() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            this.items = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('アイテムの読み込みエラー:', error);
            this.items = [];
        }
    }

    saveItems() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items));
        } catch (error) {
            console.error('アイテムの保存エラー:', error);
            alert('データの保存に失敗しました。ストレージの容量を確認してください。');
        }
    }

    // ==========================================
    // CRUD操作
    // ==========================================

    addItem() {
        const title = this.elements.itemTitle.value.trim();
        const content = this.elements.itemContent.value.trim();

        if (!title && !content) {
            alert('タイトルまたは内容を入力してください');
            return;
        }

        const newItem = {
            id: Date.now().toString(),
            title: title || '無題',
            content: content,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toLocaleString('ja-JP')
        };

        this.items.unshift(newItem);
        this.saveItems();
        this.renderItems();
        this.clearForm();

        // 追加アニメーション
        this.showNotification('✅ アイテムを追加しました');
    }

    updateItem() {
        const title = this.elements.itemTitle.value.trim();
        const content = this.elements.itemContent.value.trim();

        if (!title && !content) {
            alert('タイトルまたは内容を入力してください');
            return;
        }

        const itemIndex = this.items.findIndex(item => item.id === this.editingId);
        if (itemIndex !== -1) {
            this.items[itemIndex] = {
                ...this.items[itemIndex],
                title: title || '無題',
                content: content,
                updatedAt: new Date().toLocaleString('ja-JP')
            };

            this.saveItems();
            this.renderItems();
            this.cancelEdit();
            this.showNotification('✅ アイテムを更新しました');
        }
    }

    deleteItem(id) {
        if (!confirm('このアイテムを削除してもよろしいですか？')) {
            return;
        }

        this.items = this.items.filter(item => item.id !== id);
        this.saveItems();
        this.renderItems();
        this.showNotification('🗑️ アイテムを削除しました');
    }

    editItem(id) {
        const item = this.items.find(item => item.id === id);
        if (!item) return;

        this.editingId = id;
        this.elements.itemTitle.value = item.title === '無題' ? '' : item.title;
        this.elements.itemContent.value = item.content;

        // UIを更新
        this.elements.addButton.innerHTML = '<span class="btn-icon">💾</span> 更新';
        this.elements.cancelButton.style.display = 'block';

        // フォームにフォーカス
        this.elements.itemTitle.focus();

        // フォームまでスクロール
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    cancelEdit() {
        this.editingId = null;
        this.clearForm();
        this.elements.addButton.innerHTML = '<span class="btn-icon">➕</span> 追加';
        this.elements.cancelButton.style.display = 'none';
    }

    clearForm() {
        this.elements.itemTitle.value = '';
        this.elements.itemContent.value = '';
    }

    // ==========================================
    // レンダリング
    // ==========================================

    renderItems() {
        // アイテム数を更新
        this.elements.itemCount.textContent = this.items.length;

        // アイテムがない場合
        if (this.items.length === 0) {
            this.elements.itemsList.style.display = 'none';
            this.elements.emptyState.style.display = 'block';
            return;
        }

        // アイテムを表示
        this.elements.itemsList.style.display = 'grid';
        this.elements.emptyState.style.display = 'none';

        this.elements.itemsList.innerHTML = this.items.map(item => `
            <div class="item-card" data-id="${item.id}">
                <div class="item-header">
                    <h3 class="item-title">${this.escapeHtml(item.title)}</h3>
                    <div class="item-actions">
                        <button class="btn btn-small btn-edit" onclick="app.editItem('${item.id}')">
                            <span class="btn-icon">✏️</span> 編集
                        </button>
                        <button class="btn btn-small btn-delete" onclick="app.deleteItem('${item.id}')">
                            <span class="btn-icon">🗑️</span> 削除
                        </button>
                    </div>
                </div>
                ${item.content ? `<div class="item-content">${this.escapeHtml(item.content)}</div>` : ''}
                <div class="item-timestamp">
                    <span>📅</span>
                    <span>${item.createdAt}</span>
                    ${item.updatedAt ? `<span>• 更新: ${item.updatedAt}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    // ==========================================
    // ユーティリティ
    // ==========================================

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message) {
        // シンプルな通知実装
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }
}

// ==========================================
// アプリケーション起動
// ==========================================

let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new SenkuApp();
    console.log('🎋 千空句会所アプリケーションを起動しました');
});

// ==========================================
// アニメーション用CSS（動的追加）
// ==========================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
