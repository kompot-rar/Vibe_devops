import React, { useState } from 'react';
import { BlogPost } from '../types';
import { generateArticle } from '../services/geminiService';
import { Trash2, Edit2, Sparkles, Save, X, Loader2, Lock, LogOut, KeyRound } from 'lucide-react';

interface AdminPanelProps {
  posts: BlogPost[];
  onAdd: (post: BlogPost) => void;
  onUpdate: (post: BlogPost) => void;
  onDelete: (id: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ posts, onAdd, onUpdate, onDelete }) => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Admin Panel State
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('manage');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTopic, setGenerationTopic] = useState('');
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [readTime, setReadTime] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const adminPassword = import.meta.env.REACT_APP_ADMIN_PASSWORD;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic: checking against the hidden hardcoded password
    if (passwordInput === adminPassword) {
      setIsAuthenticated(true);
      setAuthError('');
      setPasswordInput('');
    } else {
      setAuthError('Odmowa dostępu: Nieprawidłowe poświadczenia');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab('manage');
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setExcerpt('');
    setContent('');
    setTags('');
    setReadTime('');
    setImageUrl('');
  };

  const handleEditClick = (post: BlogPost) => {
    setEditingId(post.id);
    setTitle(post.title);
    setExcerpt(post.excerpt);
    setContent(post.content);
    setTags(post.tags.join(', '));
    setReadTime(post.readTime);
    setImageUrl(post.imageUrl || '');
    setActiveTab('create');
  };

  const handleGenerate = async () => {
    if (!generationTopic.trim()) return;
    setIsGenerating(true);
    try {
      const generated = await generateArticle(generationTopic);
      setTitle(generated.title);
      setExcerpt(generated.excerpt);
      setContent(generated.content);
      setTags(generated.tags.join(', '));
      setReadTime(generated.readTime);
      setImageUrl(`https://picsum.photos/800/400?random=${Date.now()}`);
    } catch (error) {
      alert('Błąd generowania artykułu.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const postData: BlogPost = {
      id: editingId || Date.now().toString(),
      title,
      excerpt,
      content,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      readTime,
      imageUrl: imageUrl || undefined,
      date: editingId ? (posts.find(p => p.id === editingId)?.date || new Date().toISOString()) : new Date().toISOString(),
    };

    if (editingId) {
      onUpdate(postData);
    } else {
      onAdd(postData);
    }
    
    resetForm();
    setActiveTab('manage');
  };

  // --- RENDER: LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
              <Lock className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white text-center mb-2">Autoryzacja Systemu</h2>
          <p className="text-slate-400 text-center mb-6 text-sm">Sesja administracyjna wymaga klucza dostępu.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Wprowadź hasło..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  autoFocus
                />
              </div>
              {authError && (
                <p className="text-red-400 text-xs mt-2 pl-1 flex items-center gap-1">
                  <X size={12} /> {authError}
                </p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-900/20"
            >
              Zaloguj do Terminala
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER: DASHBOARD ---
  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white">Panel Administratora</h2>
          <p className="text-slate-500 text-sm mt-1">Zalogowano jako: root@devops-hub</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => { setActiveTab('manage'); resetForm(); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'manage' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Zarządzaj
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'create' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              {editingId ? 'Edytuj Post' : 'Dodaj Post'}
            </button>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors border border-transparent hover:border-slate-800"
            title="Wyloguj"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {activeTab === 'create' && (
        <div className="space-y-6">
          {!editingId && (
            <div className="bg-slate-900 border border-emerald-500/30 p-6 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="h-32 w-32 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-400" />
                Szybki start z AI
              </h3>
              <div className="flex gap-2 relative z-10">
                <input
                  type="text"
                  value={generationTopic}
                  onChange={(e) => setGenerationTopic(e.target.value)}
                  placeholder="O czym chcesz napisać? (np. Kubernetes Pods)"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !generationTopic.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? <Loader2 className="animate-spin h-5 w-5" /> : 'Generuj'}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Tytuł</label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Czas czytania</label>
                <input
                  required
                  type="text"
                  value={readTime}
                  onChange={(e) => setReadTime(e.target.value)}
                  placeholder="np. 5 min"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Tagi (po przecinku)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="DevOps, Docker, Tutorial"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-slate-400 mb-1">URL Obrazka (opcjonalne)</label>
               <input
                 type="text"
                 value={imageUrl}
                 onChange={(e) => setImageUrl(e.target.value)}
                 className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
               />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Streszczenie (Excerpt)</label>
              <textarea
                required
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Treść (Markdown)</label>
              <textarea
                required
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Save size={18} />
                {editingId ? 'Zapisz Zmiany' : 'Opublikuj'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950 text-slate-400 text-sm uppercase">
              <tr>
                <th className="p-4 font-medium border-b border-slate-800">Tytuł</th>
                <th className="p-4 font-medium border-b border-slate-800">Data</th>
                <th className="p-4 font-medium border-b border-slate-800">Tagi</th>
                <th className="p-4 font-medium border-b border-slate-800 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-white font-medium">{post.title}</td>
                  <td className="p-4 text-slate-400 text-sm">{new Date(post.date).toLocaleDateString()}</td>
                  <td className="p-4 text-slate-400 text-sm">
                    <div className="flex gap-1 flex-wrap">
                      {post.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-800 rounded text-xs">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditClick(post)}
                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Edytuj"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Czy na pewno chcesz usunąć ten post?')) {
                            onDelete(post.id);
                          }
                        }}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Usuń"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Brak postów. Dodaj pierwszy!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
