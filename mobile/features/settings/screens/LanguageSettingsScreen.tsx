import React from 'react';
import { View, Button } from 'react-native';
import { useTranslation } from '@/context/LanguageContext';
import { ThemedText } from '@/components/ThemedText';

const LanguageSettingsScreen = () => {
  const { t, setLanguage } = useTranslation();

  return (
    <View>
      <ThemedText>{t('languageSettings.title')}</ThemedText>
      <Button title="English" onPress={() => setLanguage('en')} />
      <Button title="Français" onPress={() => setLanguage('fr')} />
      <Button title="Kinyarwanda" onPress={() => setLanguage('rw')} />
    </View>
  );
};

export default LanguageSettingsScreen;
