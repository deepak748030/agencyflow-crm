import { useLanguage } from '@/contexts/language-context';
import { useAppTheme } from '@/contexts/theme-context';
import { fetchLeaderboard, fetchNaamJapStats, fetchUserData } from '@/services/api';
import type { LeaderboardEntry, NaamJapStats, UserRankData } from '@/services/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

const TEXT_DARK = '#333333';
const GREEN_BG = '#4CAF50';
const GREEN_LIGHT = '#E8F5E9';

interface AnalyticsSheetProps {
    visible: boolean;
    onClose: () => void;
    deviceId: string | null;
}

export default function AnalyticsSheet({ visible, onClose, deviceId }: AnalyticsSheetProps) {
    const [activeTab, setActiveTab] = React.useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const { theme } = useAppTheme();
    const { t } = useLanguage();

    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<NaamJapStats | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userData, setUserData] = useState<UserRankData | null>(null);
    const [leaderboardPeriod, setLeaderboardPeriod] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');

    const YELLOW_LIGHT = theme.bgCream;
    const YELLOW_BG = theme.headerBg;

    useEffect(() => {
        if (visible) {
            loadData();
        }
    }, [visible]);

    useEffect(() => {
        if (visible) {
            loadLeaderboard();
        }
    }, [leaderboardPeriod, visible]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsData, userData_] = await Promise.all([
                fetchNaamJapStats(),
                deviceId ? fetchUserData(deviceId) : null,
            ]);
            if (statsData) setStats(statsData);
            if (userData_) setUserData(userData_);
            await loadLeaderboard();
        } catch {
            // Silent fail
        } finally {
            setLoading(false);
        }
    };

    const loadLeaderboard = async () => {
        const data = await fetchLeaderboard(leaderboardPeriod, 200);
        setLeaderboard(data);
    };

    const formatNum = (n: number) => n.toLocaleString('en-IN');

    const worldwideStats = stats ? [
        { labelKey: 'analytics_all_time_users', value: formatNum(stats.allTimeUsers), bg: YELLOW_LIGHT, borderColor: theme.cardBorder },
        { labelKey: 'analytics_all_time_malas', value: formatNum(stats.allTimeMalas), bg: YELLOW_LIGHT, borderColor: theme.cardBorder },
        { labelKey: 'analytics_users_week', value: formatNum(stats.weeklyUsers), bg: GREEN_LIGHT, borderColor: GREEN_BG },
        { labelKey: 'analytics_malas_week', value: formatNum(stats.weeklyMalas), bg: GREEN_LIGHT, borderColor: GREEN_BG },
        { labelKey: 'analytics_users_month', value: formatNum(stats.monthlyUsers), bg: YELLOW_LIGHT, borderColor: theme.cardBorder },
        { labelKey: 'analytics_malas_month', value: formatNum(stats.monthlyMalas), bg: YELLOW_LIGHT, borderColor: theme.cardBorder },
    ] : [];

    const tabKeys = [
        { id: 'daily' as const, key: 'analytics_daily' },
        { id: 'weekly' as const, key: 'analytics_weekly' },
        { id: 'monthly' as const, key: 'analytics_monthly' },
    ];

    const rankDisplay = userData
        ? `⭐ ${formatNum(userData.rank)} / ${formatNum(userData.totalUsers)}`
        : '⭐ -- / --';

    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={[styles.container, { backgroundColor: YELLOW_LIGHT }]}>
                <StatusBar style="dark" backgroundColor={YELLOW_BG} translucent={false} />
                <View style={[styles.header, { backgroundColor: YELLOW_BG }]}>
                    <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={TEXT_DARK} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('analytics_header')}</Text>
                    <View style={{ width: 32 }} />
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={TEXT_DARK} />
                    </View>
                ) : (
                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.rankBadge}>
                            <Text style={styles.rankBadgeLabel}>{t('analytics_my_rank')}</Text>
                            <Text style={styles.rankBadgeValue}>{rankDisplay}</Text>
                        </View>

                        <Text style={styles.sectionTitle}>{t('analytics_worldwide')}</Text>
                        <View style={styles.statsGrid}>
                            {worldwideStats.map((stat, index) => (
                                <View
                                    key={index}
                                    style={[styles.statCard, { backgroundColor: stat.bg, borderColor: stat.borderColor }]}
                                >
                                    <Text style={styles.statLabel}>{t(stat.labelKey as any)}</Text>
                                    <Text style={styles.statValue}>{stat.value}</Text>
                                </View>
                            ))}
                        </View>

                        <Text style={styles.sectionTitle}>{t('analytics_top_200')}</Text>

                        {/* Period filter for leaderboard */}
                        <View style={styles.periodRow}>
                            {(['all', 'daily', 'weekly', 'monthly'] as const).map((period) => (
                                <TouchableOpacity
                                    key={period}
                                    style={[
                                        styles.periodTab,
                                        leaderboardPeriod === period && styles.periodTabActive,
                                    ]}
                                    onPress={() => setLeaderboardPeriod(period)}
                                >
                                    <Text style={[
                                        styles.periodTabText,
                                        leaderboardPeriod === period && styles.periodTabTextActive,
                                    ]}>
                                        {period === 'all' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.tableContainer}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { width: 24 }]}>#</Text>
                                <Text style={[styles.tableHeaderText, { flex: 1 }]}>{t('analytics_user')}</Text>
                                <Text style={[styles.tableHeaderText, { width: 90, textAlign: 'center' }]}>{t('analytics_location')}</Text>
                                <Text style={[styles.tableHeaderText, { width: 50, textAlign: 'right' }]}>{t('analytics_malas')}</Text>
                            </View>
                            {leaderboard.length === 0 ? (
                                <View style={styles.emptyRow}>
                                    <Text style={styles.emptyText}>No data yet. Start counting!</Text>
                                </View>
                            ) : (
                                leaderboard.map((user, index) => (
                                    <View
                                        key={`${user.rank}-${user.name}`}
                                        style={[styles.tableRow, index < leaderboard.length - 1 && styles.tableRowBorder]}
                                    >
                                        <Text style={[styles.tableCell, { width: 24 }]}>{user.rank}.</Text>
                                        <Text style={[styles.tableCellName, { flex: 1 }]} numberOfLines={1}>{user.name}</Text>
                                        <Text style={[styles.tableCell, { width: 90, textAlign: 'center', fontSize: 11 }]} numberOfLines={1}>{user.city}</Text>
                                        <Text style={[styles.tableCellMalas, { width: 50, textAlign: 'right' }]}>{formatNum(user.malas)}</Text>
                                    </View>
                                ))
                            )}
                            <Text style={styles.lastUpdated}>{t('analytics_last_updated')}: {new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>

                        <Text style={styles.sectionTitle}>{t('analytics_passbook')}</Text>
                        <View style={styles.passbookCard}>
                            <View style={styles.passbookHighlight}>
                                <Text style={styles.fireEmoji}>🔥</Text>
                                <Text style={styles.passbookHighlightText}>{t('analytics_highest_mala')}</Text>
                            </View>
                            <Text style={styles.passbookHighlightValue}>{userData?.highestMalaDay ?? 0}</Text>

                            <View style={styles.tabRow}>
                                {tabKeys.map((tab) => (
                                    <TouchableOpacity
                                        key={tab.id}
                                        style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                                        onPress={() => setActiveTab(tab.id)}
                                    >
                                        {activeTab === tab.id && (
                                            <Ionicons name="checkmark" size={14} color={GREEN_BG} style={{ marginRight: 4 }} />
                                        )}
                                        <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                                            {t(tab.key as any)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity style={styles.chartIconBtn}>
                                    <Ionicons name="bar-chart-outline" size={20} color={TEXT_DARK} />
                                </TouchableOpacity>
                            </View>

                            {userData?.recentLogs && userData.recentLogs.length > 0 ? (
                                userData.recentLogs.slice(0, 7).map((log, i) => (
                                    <View key={log.date} style={[styles.entryRow, i === 0 && { borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.1)', marginTop: 4 }]}>
                                        <View style={styles.entryLeft}>
                                            <MaterialCommunityIcons name="meditation" size={20} color={TEXT_DARK} />
                                            <Text style={styles.entryText}>{log.malas} {t('analytics_mala_unit')}</Text>
                                        </View>
                                        <Text style={styles.entryDate}>{log.date}</Text>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.entryRow}>
                                    <View style={styles.entryLeft}>
                                        <MaterialCommunityIcons name="meditation" size={20} color={TEXT_DARK} />
                                        <Text style={styles.entryText}>0 {t('analytics_mala_unit')}</Text>
                                    </View>
                                    <Text style={styles.entryDate}>--</Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.disclaimer}>{t('analytics_disclaimer')}</Text>
                    </ScrollView>
                )}
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 6,
        paddingVertical: 10,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: TEXT_DARK,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 6,
        paddingBottom: 40,
    },
    rankBadge: {
        alignSelf: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 18,
        alignItems: 'center',
        marginVertical: 6,
        borderWidth: 1,
        borderColor: '#333333',
    },
    rankBadgeLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: TEXT_DARK,
    },
    rankBadgeValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: TEXT_DARK,
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: TEXT_DARK,
        textAlign: 'center',
        marginTop: 6,
        marginBottom: 6,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statCard: {
        width: '48%',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 6,
        borderWidth: 1.5,
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: TEXT_DARK,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: TEXT_DARK,
        marginTop: 2,
    },
    periodRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 8,
        gap: 6,
    },
    periodTab: {
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.15)',
    },
    periodTabActive: {
        borderColor: TEXT_DARK,
        backgroundColor: TEXT_DARK,
    },
    periodTabText: {
        fontSize: 12,
        color: TEXT_DARK,
    },
    periodTabTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    tableContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#333333',
        overflow: 'hidden',
        marginBottom: 6,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderBottomWidth: 1.5,
        borderBottomColor: '#333333',
        backgroundColor: '#FFFFFF',
    },
    tableHeaderText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: TEXT_DARK,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    tableRowBorder: {
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    tableCell: {
        fontSize: 13,
        color: TEXT_DARK,
    },
    tableCellName: {
        fontSize: 13,
        fontWeight: '600',
        color: TEXT_DARK,
    },
    tableCellMalas: {
        fontSize: 13,
        fontWeight: 'bold',
        color: TEXT_DARK,
    },
    emptyRow: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 13,
        color: TEXT_DARK,
        opacity: 0.5,
    },
    lastUpdated: {
        fontSize: 11,
        color: TEXT_DARK,
        opacity: 0.6,
        textAlign: 'center',
        paddingVertical: 6,
    },
    passbookCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#333333',
        paddingVertical: 10,
        paddingHorizontal: 6,
        marginBottom: 6,
    },
    passbookHighlight: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fireEmoji: {
        fontSize: 18,
        marginRight: 6,
    },
    passbookHighlightText: {
        fontSize: 14,
        fontWeight: '600',
        color: TEXT_DARK,
    },
    passbookHighlightValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: TEXT_DARK,
        textAlign: 'center',
        marginVertical: 4,
    },
    tabRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 6,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.15)',
        borderRadius: 16,
        paddingVertical: 5,
        paddingHorizontal: 14,
        marginRight: 6,
    },
    tabActive: {
        borderColor: GREEN_BG,
    },
    tabText: {
        fontSize: 13,
        color: TEXT_DARK,
    },
    tabTextActive: {
        color: GREEN_BG,
        fontWeight: '600',
    },
    chartIconBtn: {
        marginLeft: 'auto',
        padding: 4,
    },
    entryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    entryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    entryText: {
        fontSize: 14,
        color: TEXT_DARK,
        marginLeft: 8,
    },
    entryDate: {
        fontSize: 12,
        color: TEXT_DARK,
        opacity: 0.6,
    },
    disclaimer: {
        fontSize: 10,
        color: TEXT_DARK,
        opacity: 0.5,
        marginTop: 4,
        paddingHorizontal: 6,
    },
});
