import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, FileText, Sparkles, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminContent() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cardList, postList] = await Promise.all([
        base44.entities.TarotCard.list('number'),
        base44.entities.BlogPost.list('-created_date')
      ]);

      setCards(cardList);
      setPosts(postList);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl('AdminDashboard')} className="text-purple-300 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold">Gestion du contenu</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="cards">
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="cards" className="data-[state=active]:bg-purple-500">
              <Sparkles className="w-4 h-4 mr-2" />
              Cartes Tarot ({cards.length})
            </TabsTrigger>
            <TabsTrigger value="blog" className="data-[state=active]:bg-purple-500">
              <FileText className="w-4 h-4 mr-2" />
              Articles Blog ({posts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cards">
            <div className="flex justify-between items-center mb-6">
              <p className="text-purple-200/60">{cards.length}/78 cartes configurées</p>
              <Link to={createPageUrl('AdminCardEditor')}>
                <Button className="bg-purple-600 hover:bg-purple-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une carte
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {cards.map((card) => (
                <Link 
                  key={card.id} 
                  to={createPageUrl('AdminCardEditor') + `?id=${card.id}`}
                  className="group"
                >
                  <Card className="bg-white/5 border-white/10 hover:border-purple-500/50 transition-all">
                    <CardContent className="p-3">
                      <div className="aspect-[2/3] bg-purple-900/30 rounded-lg mb-2 flex items-center justify-center">
                        {card.image_url ? (
                          <img src={card.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Sparkles className="w-6 h-6 text-purple-400 opacity-50" />
                        )}
                      </div>
                      <p className="text-xs font-medium truncate">{card.name_fr}</p>
                      <p className="text-xs text-purple-300/60 capitalize">{card.arcana}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="blog">
            <div className="flex justify-between items-center mb-6">
              <p className="text-purple-200/60">{posts.filter(p => p.is_published).length} articles publiés</p>
              <Link to={createPageUrl('AdminBlogEditor')}>
                <Button className="bg-purple-600 hover:bg-purple-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvel article
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {posts.map((post) => (
                <Link 
                  key={post.id}
                  to={createPageUrl('AdminBlogEditor') + `?id=${post.id}`}
                >
                  <Card className="bg-white/5 border-white/10 hover:border-purple-500/50 transition-all">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {post.image_url && (
                          <img src={post.image_url} alt="" className="w-16 h-12 object-cover rounded" />
                        )}
                        <div>
                          <h3 className="font-medium">{post.title_fr}</h3>
                          <p className="text-sm text-purple-200/60">{post.category}</p>
                        </div>
                      </div>
                      <Badge className={post.is_published ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                        {post.is_published ? 'Publié' : 'Brouillon'}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </AdminGuard>
  );
}