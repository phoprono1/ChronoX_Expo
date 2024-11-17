import {
  View,
  Text,
  StyleSheet,
  Keyboard,
} from "react-native";
import React, { useState } from "react";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";

const RichTextEditor = ({
  editorRef,
  onChange,
}: {
  editorRef: any;
  onChange: (body: string) => void;
}) => {
  const [isFirstFocus, setIsFirstFocus] = useState(true);

  const handleFocus = () => {
    if (isFirstFocus) {
      editorRef.current.focusContentEditor();
      setIsFirstFocus(false);
    } else {
      if (Keyboard.isVisible()) {
        editorRef.current.blurContentEditor();
      } else {
        editorRef.current.focusContentEditor();
      }
    }
  };

  return (
    <View className="min-h-[285px]">
      <RichToolbar
        actions={[
          actions.setBold,
          actions.setItalic,
          actions.setStrikethrough,
          actions.insertOrderedList,
          actions.blockquote,
          actions.alignLeft,
          actions.alignCenter,
          actions.alignRight,
          actions.line,
          actions.heading1,
          actions.heading4,
          actions.removeFormat,
        ]}
        iconMap={{
          [actions.heading1]: ({ tintColor }: { tintColor: string }) => (
            <Text style={[styles.headingButton, { color: tintColor }]}>H1</Text>
          ),
          [actions.heading4]: ({ tintColor }: { tintColor: string }) => (
            <Text style={[styles.headingButton, { color: tintColor }]}>H4</Text>
          ),
        }}
        style={styles.richBar}
        flatContainerStyle={styles.flatStyle}
        selectedIconTintColor="#8B4513"
        iconTint="#2F1810"
        editor={editorRef}
        disable={false}
      />
      <RichEditor
        ref={editorRef}
        containerStyle={styles.rich}
        editorStyle={styles.contentStyle}
        placeholder="Chia sẻ cảm xúc của bạn!"
        onFocus={handleFocus}
        onChange={onChange}
        initialHeight={240}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  richBar: {
    borderWidth: 1,
    borderColor: '#D2B48C',
    borderTopRightRadius: 12,
    borderTopLeftRadius: 12,
    backgroundColor: '#F5F5F0',
    overflow: 'hidden',
  },
  flatStyle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    backgroundColor: '#F5F5F0',
  },
  rich: {
    minHeight: 240,
    flex: 1,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderColor: '#D2B48C',
    backgroundColor: '#FFFFFF',
    padding: 12,
    overflow: 'hidden',
  },
  contentStyle: {
    color: '#2F1810',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  headingButton: {
    fontWeight: '600',
    fontSize: 16,
  },
});

export default RichTextEditor;