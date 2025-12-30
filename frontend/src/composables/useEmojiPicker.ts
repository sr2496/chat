import { ref, onMounted, onUnmounted } from 'vue';

interface EmojiPickerOptions {
  onSelectEmoji?: (emoji: any) => void;
}

export function useEmojiPicker(options: EmojiPickerOptions = {}) {
  const showEmojiPicker = ref(false);
  const emojiContainerRef = ref<HTMLElement | null>(null);
  const emojiPickerEl = ref<HTMLElement | null>(null);
  const emojiPickerStyle = ref<Record<string, string>>({ top: '0', left: '0' });

  // Toggle emoji picker and calculate position
  const toggleEmojiPicker = () => {
    showEmojiPicker.value = !showEmojiPicker.value;

    if (showEmojiPicker.value && emojiContainerRef.value) {
      // Calculate position after next tick
      setTimeout(() => {
        if (!emojiContainerRef.value) return;
        
        const rect = emojiContainerRef.value.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const pickerWidth = 350;

        // Horizontal positioning
        let left = rect.left;
        if (left + pickerWidth > viewportWidth) {
          left = viewportWidth - pickerWidth - 16;
        }
        left = Math.max(16, left);

        // Vertical positioning
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        const style: Record<string, string> = {
          position: 'fixed',
          left: `${left}px`,
          zIndex: '9999',
        };

        // Prefer below if there's space (450px), otherwise check if above has more space
        if (spaceBelow < 450 && spaceAbove > spaceBelow) {
          // Position above: anchor to bottom
          style.bottom = `${viewportHeight - rect.top + 8}px`;
          style.maxHeight = `${spaceAbove - 24}px`;
        } else {
          // Position below: anchor to top
          style.top = `${rect.bottom + 8}px`;
          style.maxHeight = `${spaceBelow - 24}px`;
        }

        emojiPickerStyle.value = style;
      }, 10);
    }
  };

  // Handle emoji selection
  const onSelectEmoji = (emoji: any) => {
    if (options.onSelectEmoji) {
      options.onSelectEmoji(emoji);
    }
    showEmojiPicker.value = false;
  };

  // Handle click outside to close
  const handleClickOutside = (event: MouseEvent) => {
    if (!showEmojiPicker.value) return;

    const target = event.target as Node;
    const isInsideContainer = emojiContainerRef.value?.contains(target);
    const isInsidePicker = emojiPickerEl.value?.contains(target);

    if (!isInsideContainer && !isInsidePicker) {
      showEmojiPicker.value = false;
    }
  };

  // Auto-setup event listeners
  onMounted(() => {
    document.addEventListener('click', handleClickOutside, true);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside, true);
  });

  return {
    // State
    showEmojiPicker,
    emojiContainerRef,
    emojiPickerEl,
    emojiPickerStyle,
    
    // Methods
    toggleEmojiPicker,
    onSelectEmoji,
  };
}
