import ImageSlider from '@/components/image-slider';
import SidebarDrawer from '@/components/sidebar-drawer';
import TextSizeSlider from '@/components/text-size-slider';
import { homeContent } from '@/constants/translations';
import { useLanguage } from '@/contexts/language-context';
import { useAppTheme } from '@/contexts/theme-context';
import { fetchHomeContent, type HomeContentResponse } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const HP = 6;
const TEXT_DARK = '#333333';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const { language, t } = useLanguage();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [fontSize, setFontSize] = useState(15);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [remoteContent, setRemoteContent] = useState<HomeContentResponse | null>(null);
  const [loadingContent, setLoadingContent] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoadingContent(true);
    try {
      const data = await fetchHomeContent();
      if (data) {
        setRemoteContent(data);
      }
    } catch {
      // fallback to local
    } finally {
      setLoadingContent(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContent();
    setRefreshing(false);
  };

  // Use remote content if available and non-empty, else fallback to local
  const fallback = homeContent[language];
  const remoteTitle = remoteContent ? (language === 'hi' ? remoteContent.title_hi : remoteContent.title_en) : '';
  const remoteSubtitle = remoteContent ? (language === 'hi' ? remoteContent.subtitle_hi : remoteContent.subtitle_en) : '';
  const remoteParagraphs = remoteContent ? (language === 'hi' ? remoteContent.paragraphs_hi : remoteContent.paragraphs_en) : [];

  const displayTitle = remoteTitle?.trim() ? remoteTitle : fallback.title;
  const displaySubtitle = remoteSubtitle?.trim() ? remoteSubtitle : fallback.subtitle;
  const displayParagraphs = remoteParagraphs?.length && remoteParagraphs.some(p => p.trim()) ? remoteParagraphs.filter(p => p.trim()) : fallback.paragraphs;

  return (
    <View style={[styles.container, { backgroundColor: theme.bgCream }]}>
      <StatusBar style="dark" backgroundColor={theme.headerBg} translucent={false} />

      <View style={[styles.statusBarBg, { backgroundColor: theme.headerBg, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setDrawerVisible(true)}
          >
            <Ionicons name="menu" size={26} color={TEXT_DARK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('app_name')}</Text>
          <View style={{ width: 26 }} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        scrollEnabled={scrollEnabled}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.accent]}
            tintColor={theme.accent}
          />
        }
      >
        <ImageSlider remoteImages={remoteContent?.bannerImages} />

        <View style={styles.contentContainer}>
          <View style={styles.controlsWrapper}>
            <View style={styles.textSizeRow}>
              <TextSizeSlider
                value={fontSize}
                onValueChange={setFontSize}
                onSlidingStart={() => setScrollEnabled(false)}
                onSlidingEnd={() => setScrollEnabled(true)}
              />
            </View>
          </View>

          {loadingContent ? (
            <ActivityIndicator size="small" color={theme.accent} style={{ marginTop: 20 }} />
          ) : (
            <>
              <Text style={[styles.contentTitle, { color: theme.accent }]}>{displayTitle}</Text>
              <Text style={styles.contentSubtitle}>{displaySubtitle}</Text>

              {displayParagraphs.map((para, index) => (
                <Text
                  key={index}
                  style={[
                    styles.paragraph,
                    { fontSize: fontSize, lineHeight: fontSize * 1.75 },
                  ]}
                >
                  {para}
                </Text>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      <SidebarDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarBg: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HP,
    paddingVertical: 10,
  },
  menuButton: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  contentContainer: {
    paddingHorizontal: HP,
    paddingTop: 6,
  },
  controlsWrapper: {
    marginBottom: 6,
  },
  textSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  contentSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#E65100',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  paragraph: {
    textAlign: 'justify',
    color: '#333333',
    marginBottom: 6,
  },
});
