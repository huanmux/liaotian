// src/components/CustomPage.tsx
import { useState, useEffect } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { BadgeCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CustomPageProps {
  slug: string;
}

export const CustomPage = ({ slug }: CustomPageProps) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      // Try to load from Storage > pages bucket
      const { data, error } = await supabase.storage
        .from('pages')
        .download(`${slug}.md`);

      if (data) {
        const text = await data.text();
        setContent(text);
      } else {
        // Fallback: try public/pages in project
        const res = await fetch(`/pages/${slug}`, { cache: 'no-store' });
        if (res.ok) {
          const text = await res.text();
          setContent(text);
        } else {
          setContent('# Page Not Found\n\nThis page does not exist.');
        }
      }
      setLoading(false);
    };

    const fetchLiaotianProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', 'liaotian')
        .single();
      if (data) setProfile(data);
    };

    fetchPage();
    fetchLiaotianProfile();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--color-background))] flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))] pt-20 pb-10">
      <div className="max-w-4xl mx-auto px-6">
        {/* Author Panel */}
        <div className="bg-[rgb(var(--color-surface))] rounded-2xl p-6 mb-8 border border-[rgb(var(--color-border))] shadow-sm">
          <div className="flex items-center gap-4">
            <img
              src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=liaotian`}
              alt="liaotian"
              className="w-16 h-16 rounded-full border-2 border-[rgb(var(--color-primary))]"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{profile?.display_name || 'LiaoTian'}</h2>
                {profile?.verified && <BadgeCheck size={20} className="text-[rgb(var(--color-accent))]" />}
              </div>
              <p className="text-[rgb(var(--color-text-secondary))]">@{profile?.username || 'liaotian'}</p>
              <p className="text-sm text-[rgb(var(--color-text-secondary))] mt-1">
                Official LiaoTian Instance • Self-hosted social platform
              </p>
            </div>
          </div>
        </div>

        {/* Markdown Content */}
        <article className="prose prose-invert max-w-none bg-[rgb(var(--color-surface))] p-8 rounded-2xl border border-[rgb(var(--color-border))]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </article>

        <div className="mt-10 text-center text-sm text-[rgb(var(--color-text-secondary))]">
          © Mux {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};
