import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Calendar, Tag, Share2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';

export default function BlogPost() {
  const [lang, setLang] = useState('fr');
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, []);

  const loadPost = async () => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    
    if (!slug) {
      setLoading(false);
      return;
    }

    try {
      const posts = await base44.entities.BlogPost.filter({ slug, is_published: true });
      if (posts.length > 0) {
        setPost(posts[0]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const content = {
    fr: { back: "Blog" },
    en: { back: "Blog" }
  };

  const t = content[lang];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white p-8">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-64 w-full rounded-2xl bg-white/10 mb-8" />
          <Skeleton className="h-8 w-3/4 bg-white/10 mb-4" />
          <Skeleton className="h-4 w-1/2 bg-white/10" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-purple-200/60">{lang === 'fr' ? 'Article non trouvé' : 'Article not found'}</p>
          <Link to={createPageUrl('Blog')} className="text-purple-400 hover:text-white mt-4 inline-block">
            ← {t.back}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
        <Link to={createPageUrl('Blog')} className="flex items-center gap-2 text-purple-300 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
          <span>{t.back}</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setLang('fr')} className={`px-3 py-1 rounded-full text-sm ${lang === 'fr' ? 'bg-purple-500' : 'bg-white/10'}`}>FR</button>
          <button onClick={() => setLang('en')} className={`px-3 py-1 rounded-full text-sm ${lang === 'en' ? 'bg-purple-500' : 'bg-white/10'}`}>EN</button>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 py-12">
        {/* Featured Image */}
        {post.image_url && (
          <div className="aspect-video rounded-2xl overflow-hidden mb-8">
            <img src={post.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-purple-300/60 mb-6">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {post.published_at ? new Date(post.published_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
          </span>
          {post.author && <span>par {post.author}</span>}
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">
          {lang === 'fr' ? post.title_fr : post.title_en}
        </h1>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag, i) => (
              <span key={i} className="px-3 py-1 bg-purple-500/20 rounded-full text-sm text-purple-300">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="prose prose-invert prose-purple max-w-none">
          <ReactMarkdown>
            {lang === 'fr' ? post.content_fr : post.content_en}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}