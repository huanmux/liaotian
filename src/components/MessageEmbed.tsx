// src/components/MessageEmbed.tsx
import { useState, useEffect } from 'react';
import { Loader2, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface EmbedData {
  title?: string;
  description?: string;
  image?: { url: string };
  logo?: { url: string };
  publisher?: string;
  url?: string;
}

export const MessageEmbed = ({ url }: { url: string }) => {
  const [data, setData] = useState<EmbedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);

    // We use microlink.io free API to bypass CORS and parse Open Graph tags
    fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((json) => {
        if (isMounted) {
          if (json.status === 'success') {
            setData(json.data);
          } else {
            setError(true);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (loading) return null; // Or a small skeleton loader if preferred
  if (error || !data) return null; // Hide if we can't generate a preview

  return (
    <div className="mt-2 max-w-sm rounded-lg border border-[rgb(var(--color-border))] bg-[rgba(var(--color-surface-hover),0.5)] overflow-hidden transition hover:bg-[rgb(var(--color-surface-hover))]">
      <div className="flex flex-col">
        {/* Site Name / Publisher */}
        <div className="px-3 pt-3 flex items-center gap-2 text-[10px] uppercase font-bold text-[rgb(var(--color-text-secondary))]">
          {data.logo?.url && (
            <img src={data.logo.url} alt="" className="w-3 h-3 rounded-sm" />
          )}
          <span>{data.publisher || new URL(url).hostname}</span>
        </div>

        <div className="flex gap-4 p-3">
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            {/* Title */}
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm font-semibold text-[rgb(var(--color-primary))] hover:underline line-clamp-2 leading-tight mb-1"
            >
              {data.title || url}
            </a>
            
            {/* Description */}
            {data.description && (
              <p className="text-xs text-[rgb(var(--color-text-secondary))] line-clamp-3">
                {data.description}
              </p>
            )}
          </div>
          
          {/* Thumbnail Image */}
          {data.image?.url && (
            <div className="flex-shrink-0">
               <img 
                 src={data.image.url} 
                 alt="Preview" 
                 className="w-16 h-16 object-cover rounded-md border border-[rgb(var(--color-border))]" 
               />
            </div>
          )}
        </div>

        {/* Full Width Image (if it's a large video/image card, optional logic could go here) */}
      </div>
    </div>
  );
};
