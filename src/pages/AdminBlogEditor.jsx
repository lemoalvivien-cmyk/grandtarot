import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Save, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminBlogEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState({
    title_fr: '',
    title_en: '',
    slug: '',
    excerpt_fr: '',
    excerpt_en: '',
    content_fr: '',
    content_en: '',
    image_url: '',
    category: 'tarot_basics',
    tags: [],
    is_published: false,
    author: '',
    seo_title_fr: '',
    seo_title_en: '',
    seo_description_fr: '',
    seo_description_en: ''
  });
  const [isEdit, setIsEdit] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = createPageUrl('Landing');
        return;
      }

      const user = await base44.auth.me();
      if (user.role !== 'admin') {
        window.location.href = createPageUrl('Dashboard');
        return;
      }

      setPost(prev => ({ ...prev, author: user.email }));

      const params = new URLSearchParams(window.location.search);
      const postId = params.get('id');

      if (postId) {
        const posts = await base44.entities.BlogPost.filter({ id: postId });
        if (posts.length > 0) {
          setPost(posts[0]);
          setIsEdit(true);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title) => {
    return title.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const savePost = async () => {
    if (!post.title_fr || !post.title_en) {
      alert('Titre FR et EN requis');
      return;
    }

    setSaving(true);
    try {
      const postData = {
        ...post,
        slug: post.slug || generateSlug(post.title_en),
        published_at: post.is_published && !post.published_at ? new Date().toISOString() : post.published_at
      };

      if (isEdit) {
        await base44.entities.BlogPost.update(post.id, postData);
      } else {
        await base44.entities.BlogPost.create(postData);
      }

      window.location.href = createPageUrl('AdminContent');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async () => {
    if (!window.confirm('Supprimer cet article ?')) return;

    try {
      await base44.entities.BlogPost.delete(post.id);
      window.location.href = createPageUrl('AdminContent');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    setPost(prev => ({
      ...prev,
      tags: [...(prev.tags || []), tagInput.trim()]
    }));
    setTagInput('');
  };

  const removeTag = (index) => {
    setPost(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const categories = [
    { value: 'tarot_basics', label: 'Bases du Tarot' },
    { value: 'card_meanings', label: 'Significations' },
    { value: 'spreads', label: 'Tirages' },
    { value: 'astrology', label: 'Astrologie' },
    { value: 'relationships', label: 'Relations' },
    { value: 'career', label: 'Carrière' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('AdminContent')} className="text-purple-300 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold">
              {isEdit ? 'Modifier l\'article' : 'Nouvel article'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 mr-4">
              {post.is_published ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
              <span className="text-sm">{post.is_published ? 'Publié' : 'Brouillon'}</span>
              <Switch
                checked={post.is_published}
                onCheckedChange={(checked) => setPost(prev => ({ ...prev, is_published: checked }))}
              />
            </div>
            {isEdit && (
              <Button onClick={deletePost} variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            )}
            <Button onClick={savePost} disabled={saving} className="bg-green-600 hover:bg-green-500">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <Tabs defaultValue="content">
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="content" className="data-[state=active]:bg-purple-500">Contenu</TabsTrigger>
            <TabsTrigger value="seo" className="data-[state=active]:bg-purple-500">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            <div className="space-y-6">
              {/* Titles */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-purple-300 mb-2 block">Titre (FR) *</label>
                  <Input
                    value={post.title_fr}
                    onChange={(e) => setPost(prev => ({ ...prev, title_fr: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-purple-300 mb-2 block">Title (EN) *</label>
                  <Input
                    value={post.title_en}
                    onChange={(e) => setPost(prev => ({ ...prev, title_en: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              {/* Meta */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-purple-300 mb-2 block">Catégorie</label>
                  <Select value={post.category} onValueChange={(v) => setPost(prev => ({ ...prev, category: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      {categories.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-purple-300 mb-2 block">URL Image</label>
                  <Input
                    value={post.image_url}
                    onChange={(e) => setPost(prev => ({ ...prev, image_url: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-sm text-purple-300 mb-2 block">Slug</label>
                  <Input
                    value={post.slug}
                    onChange={(e) => setPost(prev => ({ ...prev, slug: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="auto-generated"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm text-purple-300 mb-2 block">Tags</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    className="bg-white/5 border-white/10 text-white max-w-xs"
                    placeholder="Ajouter un tag..."
                  />
                  <Button onClick={addTag} variant="outline" size="icon" className="border-white/10">+</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.tags?.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-purple-500/20 rounded text-sm flex items-center gap-1">
                      #{tag}
                      <button onClick={() => removeTag(i)} className="text-purple-300 hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Excerpts */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-purple-300 mb-2 block">Extrait (FR)</label>
                  <Textarea
                    value={post.excerpt_fr}
                    onChange={(e) => setPost(prev => ({ ...prev, excerpt_fr: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white min-h-20"
                  />
                </div>
                <div>
                  <label className="text-sm text-purple-300 mb-2 block">Excerpt (EN)</label>
                  <Textarea
                    value={post.excerpt_en}
                    onChange={(e) => setPost(prev => ({ ...prev, excerpt_en: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white min-h-20"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-purple-300 mb-2 block">Contenu (FR) - Markdown</label>
                  <Textarea
                    value={post.content_fr}
                    onChange={(e) => setPost(prev => ({ ...prev, content_fr: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white min-h-64 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-purple-300 mb-2 block">Content (EN) - Markdown</label>
                  <Textarea
                    value={post.content_en}
                    onChange={(e) => setPost(prev => ({ ...prev, content_en: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white min-h-64 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="seo">
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-purple-300 mb-2 block">SEO Title (FR)</label>
                  <Input
                    value={post.seo_title_fr}
                    onChange={(e) => setPost(prev => ({ ...prev, seo_title_fr: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-purple-300 mb-2 block">SEO Title (EN)</label>
                  <Input
                    value={post.seo_title_en}
                    onChange={(e) => setPost(prev => ({ ...prev, seo_title_en: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-purple-300 mb-2 block">Meta Description (FR)</label>
                  <Textarea
                    value={post.seo_description_fr}
                    onChange={(e) => setPost(prev => ({ ...prev, seo_description_fr: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                    maxLength={160}
                  />
                  <p className="text-xs text-purple-300/60 mt-1">{post.seo_description_fr?.length || 0}/160</p>
                </div>
                <div>
                  <label className="text-sm text-purple-300 mb-2 block">Meta Description (EN)</label>
                  <Textarea
                    value={post.seo_description_en}
                    onChange={(e) => setPost(prev => ({ ...prev, seo_description_en: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                    maxLength={160}
                  />
                  <p className="text-xs text-purple-300/60 mt-1">{post.seo_description_en?.length || 0}/160</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}