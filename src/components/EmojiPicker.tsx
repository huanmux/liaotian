// src/components/EmojiPicker.tsx
import { X } from 'lucide-react';

const COMMON_EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "🥹",
  "☺️", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘",
  "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐",
  "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟",
  "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "☑️",
  "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "❓",
  "😰", "😥", "😓", "🫣", "🤗", "🫡", "🤔", "🫢", "🤭", "🤫", "📵",
  "🤥", "😶", "😐", "😑", "😬", "🫨", "🫠", "🙄", "😯", "😦", "🔕",
  "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "😵‍💫", "🤐", "🪷",
  "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿",
  "👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🫶", "🤟", "♾️",
  "🤘", "👌", "🤌", "🤏", "👈", "👉", "👆", "👇", "☝️", "✋", "🌜",
  "🤚", "🖐️", "🖖", "👋", "🤙", "🫲", "🫱", "💪", "🦾", "🖕", "🤦‍♂️", "🤦‍♀️",
  "🙏", "🫵", "🤝", "💅", "🔥", "✨", "❤️", "🧡", "💛", "💚", "🤷‍♂️", "🤷‍♀️",
  "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "🍫",
  "💞", "💓", "💗", "💖", "💘", "💝", "💯", "💢", "💥", "💫", "🦋",
  "🗣️", "🔇", "🔕", "🍁", "🚽", "❌", "🚫", "☢️", "⚠️", "⏳", "⚛️",
  "💦", "⚡", "🧠", "💣", "💬", "🗿", "💀", "🤡", "🐉", "😺", "💤",
  "🆗", "✔️", "✅", "🤲", "🌙", "☪️", "🛐", "📿", "🦪", "💎"
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiPicker = ({ onSelect, onClose }: EmojiPickerProps) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[rgb(var(--color-surface))] w-full max-w-xs sm:max-w-md rounded-2xl shadow-2xl border border-[rgb(var(--color-border))] flex flex-col max-h-[60vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b border-[rgb(var(--color-border))]">
            <span className="font-bold text-sm text-[rgb(var(--color-text))]">Choose Reaction</span>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-[rgb(var(--color-surface-hover))]">
                <X size={18} className="text-[rgb(var(--color-text-secondary))]" />
            </button>
        </div>
        <div className="overflow-y-auto p-2 grid grid-cols-6 sm:grid-cols-8 gap-2 custom-scrollbar">
            {COMMON_EMOJIS.map(emoji => (
                <button
                    key={emoji}
                    onClick={() => onSelect(emoji)}
                    className="aspect-square flex items-center justify-center text-xl hover:bg-[rgb(var(--color-surface-hover))] rounded-lg transition"
                >
                    {emoji}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};
