'use client';

import { useEffect, useState, useRef } from 'react';
import { getProgress, saveProgress, exportProgress, importProgress, DEFAULT_AI_SETTINGS } from '@/lib/storage';
import { useTheme } from '@/components/ThemeProvider';
import { DailyGoal, AISettings, ThemeName, THEME_LABELS, ALL_THEMES } from '@/types/question';

const THEME_PREVIEW_COLORS: Record<ThemeName, { primary: string; bg: string; surface: string; accent: string }> = {
  ocean:    { primary: '#3B82F6', bg: '#F8FAFC', surface: '#FFFFFF', accent: '#F59E0B' },
  sakura:   { primary: '#EC4899', bg: '#FFFBFD', surface: '#FFFFFF', accent: '#A855F7' },
  forest:   { primary: '#10B981', bg: '#F7FEFA', surface: '#FFFFFF', accent: '#F59E0B' },
  sunset:   { primary: '#F97316', bg: '#FFFCF8', surface: '#FFFFFF', accent: '#EF4444' },
  midnight: { primary: '#8B5CF6', bg: '#FAFAFF', surface: '#FFFFFF', accent: '#06B6D4' },
};

const THEME_EMOJI: Record<ThemeName, string> = {
  ocean: '🌊',
  sakura: '🌸',
  forest: '🌿',
  sunset: '🌅',
  midnight: '🌌',
};

export default function SettingsPage() {
  const { mode, toggleMode, colorTheme, setColorTheme } = useTheme();
  const [goal, setGoal] = useState<DailyGoal>({ cardsPerDay: 20, questionsPerDay: 10 });
  const [aiSettings, setAISettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showQR, setShowQR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const progress = getProgress();
    if (progress.dailyGoal) {
      setGoal(progress.dailyGoal);
    }
    setAISettings(progress.aiSettings || DEFAULT_AI_SETTINGS);
  }, []);

  const saveGoal = (newGoal: DailyGoal) => {
    setGoal(newGoal);
    const progress = getProgress();
    progress.dailyGoal = newGoal;
    saveProgress(progress);
  };

  const saveAISettings = () => {
    const progress = getProgress();
    progress.aiSettings = aiSettings;
    saveProgress(progress);
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2500);
  };

  const handleExport = () => {
    const data = exportProgress();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chizai-drill-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (importProgress(text)) {
        setImportStatus('success');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
  };

  const handleImportText = (text: string) => {
    if (importProgress(text)) {
      setImportStatus('success');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      setImportStatus('error');
    }
  };

  const handleCopySync = () => {
    const data = exportProgress();
    navigator.clipboard.writeText(data).then(() => {
      setShowQR(true);
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">設定</h1>

      {/* AI Content Generation */}
      <div className="theme-card p-5 space-y-4">
        <div>
          <h2 className="font-bold text-t-primary">AIコンテンツ生成</h2>
          <p className="text-sm text-t-secondary mt-1 leading-relaxed">
            APIキーとモデルを保存すると、ドゥームスクロールなどの画面で最新情報を含む学習コンテンツを生成できます。キーはこの端末のローカルストレージに保存されます。
          </p>
        </div>

        <div>
          <label className="text-sm text-t-secondary block mb-1">OpenAI APIキー</label>
          <input
            type="password"
            value={aiSettings.apiKey}
            onChange={(e) => setAISettings((prev) => ({ ...prev, apiKey: e.target.value }))}
            placeholder="sk-..."
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-t-primary focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none"
          />
        </div>

        <div>
          <label className="text-sm text-t-secondary block mb-1">モデル名</label>
          <input
            type="text"
            value={aiSettings.model}
            onChange={(e) => setAISettings((prev) => ({ ...prev, model: e.target.value }))}
            placeholder="gpt-5-mini"
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-t-primary focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none"
          />
          <p className="text-xs text-t-muted mt-2">
            例: gpt-5-mini。Responses API と web search tool を使えるモデルを指定してください。
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={saveAISettings}
            className="px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
          >
            AI設定を保存
          </button>
          {apiKeySaved && <p className="text-sm text-success font-medium">AI設定を保存しました。</p>}
        </div>
      </div>

      {/* Color Theme Picker */}
      <div className="theme-card p-5 space-y-4">
        <h2 className="font-bold text-t-primary">カラーテーマ</h2>
        <div className="grid grid-cols-5 gap-2">
          {ALL_THEMES.map((themeName) => {
            const colors = THEME_PREVIEW_COLORS[themeName];
            const isActive = colorTheme === themeName;
            return (
              <button
                key={themeName}
                onClick={() => setColorTheme(themeName)}
                className={`relative rounded-xl p-3 border-2 transition-all ${
                  isActive
                    ? 'border-primary shadow-md scale-[1.02]'
                    : 'border-border hover:border-primary/40 hover:shadow-sm'
                }`}
                style={{ backgroundColor: colors.bg }}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">{THEME_EMOJI[themeName]}</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.primary }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.accent }} />
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: colors.primary }}>
                    {THEME_LABELS[themeName]}
                  </span>
                </div>
                {isActive && (
                  <div
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px]"
                    style={{ backgroundColor: colors.primary }}
                  >
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Light/Dark Mode */}
      <div className="theme-card p-5 space-y-3">
        <h2 className="font-bold text-t-primary">表示モード</h2>
        <div className="flex gap-3">
          <button
            onClick={() => mode === 'dark' && toggleMode()}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              mode === 'light' ? 'bg-primary text-white shadow-sm' : 'bg-surface-alt text-t-secondary hover:bg-surface-hover'
            }`}
          >
            ☀️ ライト
          </button>
          <button
            onClick={() => mode === 'light' && toggleMode()}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              mode === 'dark' ? 'bg-primary text-white shadow-sm' : 'bg-surface-alt text-t-secondary hover:bg-surface-hover'
            }`}
          >
            🌙 ダーク
          </button>
        </div>
      </div>

      {/* Daily goals */}
      <div className="theme-card p-5 space-y-4">
        <h2 className="font-bold text-t-primary">日々の目標</h2>
        <div>
          <label className="text-sm text-t-secondary block mb-2">暗記カード（枚/日）</label>
          <div className="flex gap-2">
            {[5, 10, 20, 30].map((v) => (
              <button
                key={v}
                onClick={() => saveGoal({ ...goal, cardsPerDay: v })}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  goal.cardsPerDay === v
                    ? 'bg-accent text-white shadow-sm'
                    : 'bg-surface-alt text-t-secondary hover:bg-surface-hover'
                }`}
              >
                {v}枚
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm text-t-secondary block mb-2">問題数（問/日）</label>
          <div className="flex gap-2">
            {[5, 10, 20, 30].map((v) => (
              <button
                key={v}
                onClick={() => saveGoal({ ...goal, questionsPerDay: v })}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  goal.questionsPerDay === v
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-alt text-t-secondary hover:bg-surface-hover'
                }`}
              >
                {v}問
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Data management */}
      <div className="theme-card p-5 space-y-4">
        <h2 className="font-bold text-t-primary">データ管理</h2>
        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
          >
            データをエクスポート（JSON）
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 bg-surface-alt text-t-secondary rounded-xl font-medium hover:bg-surface-hover transition-colors"
          >
            JSONファイルをインポート
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
            aria-label="JSONファイルを選択"
          />
          {importStatus === 'success' && (
            <p className="text-sm text-success font-medium">インポート成功！ページを再読み込みします...</p>
          )}
          {importStatus === 'error' && (
            <p className="text-sm text-error font-medium">インポートに失敗しました。有効なJSONファイルを使用してください。</p>
          )}
        </div>
      </div>

      {/* Device sync */}
      <div className="theme-card p-5 space-y-4">
        <h2 className="font-bold text-t-primary">デバイス間同期</h2>
        <p className="text-sm text-t-secondary">
          別のデバイスにデータを転送するには、エクスポートしたデータをコピーして貼り付けます。
        </p>
        <div className="space-y-2">
          <button
            onClick={handleCopySync}
            className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-hover transition-colors"
          >
            データをクリップボードにコピー
          </button>
          {showQR && (
            <p className="text-sm text-success font-medium text-center">
              クリップボードにコピーしました！別のデバイスで下のテキストエリアに貼り付けてインポートしてください。
            </p>
          )}
          <div>
            <label className="text-sm text-t-secondary block mb-1">
              データを貼り付けてインポート
            </label>
            <textarea
              className="w-full h-24 p-2 border border-border rounded-xl text-sm bg-surface text-t-primary focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none"
              placeholder="JSONデータをここに貼り付けてください..."
              onPaste={(e) => {
                const text = e.clipboardData.getData('text');
                if (text) handleImportText(text);
              }}
            />
          </div>
        </div>
      </div>

      {/* Data reset */}
      <div className="theme-card border-error/30 p-5 space-y-3">
        <h2 className="font-bold text-error">データリセット</h2>
        <p className="text-sm text-t-secondary">
          全ての学習データを削除します。この操作は取り消せません。
        </p>
        <button
          onClick={() => {
            if (confirm('本当にすべてのデータを削除しますか？')) {
              localStorage.removeItem('chizai-drill-progress');
              window.location.reload();
            }
          }}
          className="w-full py-3 bg-error text-white rounded-xl font-medium hover:opacity-90 transition-colors"
        >
          全データを削除する
        </button>
      </div>
    </div>
  );
}
