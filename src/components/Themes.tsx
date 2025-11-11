// src/components/Themes.tsx
import { CheckCircle } from 'lucide-react';
import { Profile } from '../lib/supabase';

interface ThemePreset {
  value: string;
  name: string;
  desc: string;
}

const presets: ThemePreset[] = [
  { value: 'lt-classic', name: 'LT Classic', desc: 'Default theme. Fiery orange and reds.' },
  { value: 'lt-dark', name: 'LT Dark', desc: 'Dark mode. Fiery orange and reds.' },
  { value: 'muxday', name: 'MuxDay', desc: 'Alternate theme in honor of the previous MuxDay platform. Analogous shades of blue.' },
  { value: 'amrella', name: 'Amrella', desc: 'Alternate theme in honor of the previous Amrella platform. Analogous shades of green.' },
  { value: 'cooper-black', name: 'Cooper Black', desc: 'Special theme for Cooper Black fans and enthusiasts. Futuristic cyberpunk vibes.' },
  { value: 'knightspeak', name: 'Knightspeak', desc: 'Special theme for Knightspeak fans and enthusiasts. Medieval vibes.' },
  { value: 'wildest-dimensions', name: 'Wildest Dimensions', desc: 'Special theme for Radiyana, in the Wildest Dimensions. Feel the high life.'}
];

interface ThemesProps {
  currentTheme: string;
  onChange: (theme: string) => void;
  loading?: boolean;
}

export const Themes = ({ currentTheme, onChange, loading }: ThemesProps) => {
  return (
    <div className="space-y-2">
      {presets.map((preset) => (
        <div
          key={preset.value}
          className={`p-3 rounded-lg cursor-pointer transition-all border ${
            currentTheme === preset.value
              ? 'bg-[rgba(var(--color-primary),0.1)] border-[rgb(var(--color-primary))]' 
              : 'bg-[rgb(var(--color-surface-hover))] border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-border))]'
          }`}
          onClick={() => !loading && onChange(preset.value)}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-[rgb(var(--color-text))]">{preset.name}</h4>
              <p className="text-sm text-[rgb(var(--color-text-secondary))]">{preset.desc}</p>
            </div>
            {currentTheme === preset.value && <CheckCircle size={16} className="text-[rgb(var(--color-primary))]" />}
          </div>
        </div>
      ))}
    </div>
  );
};
