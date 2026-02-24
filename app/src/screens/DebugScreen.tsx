import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Copy, Trash2, Share2, Bug, ArrowLeft } from 'lucide-react-native';
import logger, { logApp } from '../utils/logger';
import { COLORS, SPACING, RADIUS } from '../config/theme';

export default function DebugScreen({ onBack }: { onBack?: () => void }) {
  const [logs, setLogs] = useState(logger.getRecentLogs(100));

  const refreshLogs = () => {
    setLogs(logger.getRecentLogs(100));
    logApp.info('Debug logs refreshed');
  };

  const clearLogs = () => {
    Alert.alert('Clear Logs', 'Clear all debug logs?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          logger.clearLogs();
          setLogs([]);
        },
      },
    ]);
  };

  const copyLogs = async () => {
    const logsText = logger.exportLogs();
    // Note: In a real app, you'd use Clipboard.setString()
    Alert.alert('Logs Copied', 'Debug logs have been copied to clipboard (simulated)');
  };

  const shareLogs = async () => {
    const logsText = logger.exportLogs();
    try {
      await Share.share({
        message: logsText,
        title: 'HomeHelp Debug Logs',
      });
    } catch (error) {
      logApp.error('Failed to share logs', error);
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return COLORS.urgent;
      case 'warn': return COLORS.warning;
      case 'info': return COLORS.primary;
      case 'debug': return COLORS.gray;
      default: return COLORS.textPrimary;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <ArrowLeft size={20} color={COLORS.white} />
            </TouchableOpacity>
          )}
          <Bug size={20} color={COLORS.white} />
          <Text style={styles.headerTitle}>Debug Logs</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={refreshLogs}>
            <Text style={styles.headerBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={copyLogs}>
          <Copy size={16} color={COLORS.primary} />
          <Text style={styles.actionBtnText}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={shareLogs}>
          <Share2 size={16} color={COLORS.primary} />
          <Text style={styles.actionBtnText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={clearLogs}>
          <Trash2 size={16} color={COLORS.urgent} />
          <Text style={styles.actionBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.logsContainer} showsVerticalScrollIndicator={false}>
        {logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No logs yet</Text>
          </View>
        ) : (
          logs.map((log, index) => (
            <View key={index} style={styles.logEntry}>
              <View style={styles.logHeader}>
                <Text style={[styles.logLevel, { color: getLogColor(log.level) }]}>
                  {log.level.toUpperCase()}
                </Text>
                <Text style={styles.logTag}>[{log.tag}]</Text>
                <Text style={styles.logTime}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              <Text style={styles.logMessage}>{log.message}</Text>
              {log.data && (
                <Text style={styles.logData}>
                  {JSON.stringify(log.data, null, 2)}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 4,
    marginRight: 4,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  headerActions: { flexDirection: 'row' },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.sm,
  },
  headerBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  logsContainer: { flex: 1, paddingHorizontal: SPACING.md },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { fontSize: 15, color: COLORS.gray },
  logEntry: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  logLevel: { fontSize: 10, fontWeight: '700' },
  logTag: { fontSize: 10, color: COLORS.gray },
  logTime: { fontSize: 10, color: COLORS.gray, marginLeft: 'auto' },
  logMessage: { fontSize: 12, color: COLORS.textPrimary, marginBottom: 4 },
  logData: {
    fontSize: 10,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.inputBackground,
    padding: 6,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
});
