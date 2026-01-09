import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Calendar, Tag, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function Blog() {
  const [lang, setLang] = useState('fr');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await base44.entities.BlogPost.filter({ is_published: true }, '-published_at', 50);
      setPosts(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const content = {
    fr: {
      title: "Blog GRANDTAROT",
      subtitle: "Guides, astuces et sagesse du Tarot",
      search: "Rechercher un article...",
      back: "Retour",
      readMore: "Lire la suite",
      categories: {
        all: "Tous",
        tarot_basics: "Bases du Tarot",
        card_meanings: "Significations",
        spreads: "Tirages",
        astrology: "Astrologie",
        relationships: "Relations",
        career: "Carrière"
      }
    },
    en: {
      title: "GRANDTAROT Blog",
      subtitle: "Guides, tips and Tarot wisdom",
      search: "Search articles...",
      back: "Back",
      readMore: "Read more",
      categories: {
        all: "All",
        tarot_basics: "Tarot Basics",
        card_meanings: "Card Meanings",
        spreads: "Spreads",
        astrology: "Astrology",
        relationships: "Relationships",
        career: "Career"
      }
    }
  };

  const t = content[lang];

  const filteredPosts = posts.filter(post => {
    const title = lang === 'fr' ? post.title_fr : post.title_en;
    const matchSearch = title?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'all' || post.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <Link to={createPageUrl('Landing')} className="flex items-center gap-2 text-purple-300 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
          <span>{t.back}</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setLang('fr')} className={`px-3 py-1 rounded-full text-sm ${lang === 'fr' ? 'bg-purple-500' : 'bg-white/10'}`}>FR</button>
          <button onClick={() => setLang('en')} className={`px-3 py-1 rounded-full text-sm ${lang === 'en' ? 'bg-purple-500' : 'bg-white/10'}`}>EN</button>
        </div>
      </div>

      {/* Title */}
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">{t.title}</h1>
        <p className="text-purple-200/60">{t.subtitle}</p>
      </div>

      {/* Search & Categories */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
              className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-purple-300/40 h-12 rounded-xl"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(t.categories).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  category === key ? 'bg-purple-500' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-24">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl bg-white/10" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-purple-200/60">{lang === 'fr' ? 'Aucun article trouvé' : 'No articles found'}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Link 
                key={post.id} 
                to={createPageUrl('BlogPost') + `?slug=${post.slug}`}
                className="group"
              >
                <article className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all h-full flex flex-col">
                  {post.image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={post.image_url} 
                        alt={lang === 'fr' ? post.title_fr : post.title_en} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-purple-300/60 mb-3">
                      <Calendar className="w-3 h-3" />
                      <span>{post.published_at ? new Date(post.published_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US') : ''}</span>
                      {post.category && (
                        <>
                          <span>•</span>
                          <Tag className="w-3 h-3" />
                          <span>{t.categories[post.category]}</span>
                        </>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold mb-2 group-hover:text-purple-400 transition-colors">
                      {lang === 'fr' ? post.title_fr : post.title_en}
                    </h2>
                    <p className="text-purple-200/60 text-sm flex-1">
                      {lang === 'fr' ? post.excerpt_fr : post.excerpt_en}
                    </p>
                    <span className="text-purple-400 text-sm mt-4 inline-block">
                      {t.readMore} →
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}