import { useEffect, useRef } from 'react';
import { useUpload } from './useUpload';
import { deleteItemHelper } from '@/utils/deleteHelpers';
import { useArchive } from '@/hooks/useArchive';

const compareValues = (value1, operator, value2) => {
  switch (operator) {
    case 'gt':
      return value1 > value2;
    case 'lt':
      return value1 < value2;
    case 'gte':
      return value1 >= value2;
    case 'lte':
      return value1 <= value2;
    case 'eq':
      return value1 === value2;
    default:
      return false;
  }
};

export function useAutomationRules(items, apiKey, activeType) {
  const rulesRef = useRef([]);
  const intervalsRef = useRef({});
  const itemsRef = useRef(items); // Keep track of items
  const prevItemsRef = useRef([]); // Track previous items for event detection
  const initializationRef = useRef(false); // Track if we've initialized

  const { controlTorrent, controlQueuedItem } = useUpload(apiKey);
  const { archiveDownload } = useArchive(apiKey);

  // Log rule execution
  const logRuleExecution = (ruleId, action, success, itemsAffected = 0, details = '', error = '') => {
    try {
      const logEntry = {
        timestamp: Date.now(),
        action,
        success,
        itemsAffected,
        details,
        error
      };
      
      const existingLogs = localStorage.getItem(`torboxRuleLogs_${ruleId}`);
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      // Add new log entry
      logs.unshift(logEntry);
      
      // Keep only last 100 log entries per rule
      if (logs.length > 100) {
        logs.splice(100);
      }
      
      localStorage.setItem(`torboxRuleLogs_${ruleId}`, JSON.stringify(logs));
    } catch (err) {
      console.error('Error logging rule execution:', err);
    }
  };

  // Helper functions for rule metadata
  const getRuleMetadata = (rule, now = Date.now()) => {
    return (
      rule.metadata || {
        executionCount: 0,
        lastExecutedAt: null,
        triggeredCount: 0,
        lastTriggeredAt: null,
        lastEnabledAt: now,
        createdAt: now,
        updatedAt: now,
      }
    );
  };

  const updateRuleMetadata = (ruleId, updates) => {
    // Update rule metadata in storage
    const updatedRules = rulesRef.current.map((rule) =>
      rule.id === ruleId
        ? {
            ...rule,
            metadata: {
              ...getRuleMetadata(rule),
              ...updates,
            },
          }
        : rule,
    );
    localStorage.setItem('torboxAutomationRules', JSON.stringify(updatedRules));
    rulesRef.current = updatedRules;
    return updatedRules.find((r) => r.id === ruleId);
  };

  const executeRule = async (rule, unfilteredItems) => {
    // Skip execution if not for torrents
    if (activeType !== 'torrents') {
      return;
    }

    const items = unfilteredItems.filter((item) =>
      item.hasOwnProperty('active'),
    );
    // Check if rule should execute

    if (!rule.enabled) {
      // Skip disabled rules
      return;
    }

    const now = Date.now();

    // Find items that meet the conditions
    const matchingItems = items.filter((item) => {
      const conditions = rule.conditions || [rule.condition]; // Support both new and old format
      const logicOperator = rule.logicOperator || 'and'; // Default to AND
      
      const conditionResults = conditions.map((condition) => {
        let conditionValue = 0;
        switch (condition.type) {
          case 'seeding_time':
            if (!item.active) return false;
            conditionValue =
              (now - new Date(item.cached_at).getTime()) / (1000 * 60 * 60);
            break;
          case 'stalled_time':
            if (
              ['stalled', 'stalledDL', 'stalled (no seeds)'].includes(
                item.download_state,
              ) &&
              item.active
            ) {
              conditionValue =
                (now - new Date(item.updated_at).getTime()) / (1000 * 60 * 60);
            } else {
              return false;
            }
            break;
          case 'seeding_ratio':
            if (!item.active) return false;
            conditionValue = item.ratio;
            break;
          case 'seeds':
            conditionValue = item.seeds || 0;
            break;
          case 'peers':
            conditionValue = item.peers || 0;
            break;
          case 'download_speed':
            conditionValue = (item.download_speed || 0) / 1024; // Convert to KB/s
            break;
          case 'upload_speed':
            conditionValue = (item.upload_speed || 0) / 1024; // Convert to KB/s
            break;
          case 'file_size':
            conditionValue = (item.size || 0) / (1024 * 1024 * 1024); // Convert to GB
            break;
          case 'age':
            conditionValue = (now - new Date(item.created_at).getTime()) / (1000 * 60 * 60); // Hours since created
            break;
        case 'tracker':
          // For tracker, we'll do a string comparison instead of numeric
          const trackerUrl = item.tracker || '';
          conditionValue = trackerUrl.includes(condition.value) ? 1 : 0;
          break;
        case 'inactive':
          // Check if download is inactive (not active)
          conditionValue = item.active ? 0 : 1;
          break;
        case 'active_download_count':
          // This is a global condition, handled separately
          // For per-item evaluation, skip it
          return true; // Will be handled in global condition check
        }

        const conditionMet = compareValues(
          conditionValue,
          condition.operator,
          condition.value,
        );

        // Check if condition is met

        return conditionMet;
      });

      // Apply logic operator
      if (logicOperator === 'or') {
        return conditionResults.some(result => result);
      } else {
        return conditionResults.every(result => result);
      }
    });

    if (matchingItems.length === 0) {
      // No items match the rule conditions
      return;
    }

    // Update trigger metadata once per execution, not per item
    updateRuleMetadata(rule.id, {
      lastTriggeredAt: now,
      triggeredCount: (getRuleMetadata(rule).triggeredCount || 0) + 1,
    });

    // Execute actions on matching items
    let totalItemsAffected = 0;
    let totalErrors = 0;
    const actionDetails = [];

    // Execute actions
    for (const item of matchingItems) {
      try {
        // Execute the action
        let actionSucceeded = false;
        let result;

        switch (rule.action.type) {
          case 'stop_seeding':
            // Stop seeding the torrent
            result = await controlTorrent(item.id, 'stop_seeding');
            actionSucceeded = result.success;
            break;
          case 'archive':
            // Archive the download
            archiveDownload(item);
            result = await deleteItemHelper(item.id, apiKey);
            actionSucceeded = result.success;
            break;
          case 'delete':
            // Delete the download
            result = await deleteItemHelper(item.id, apiKey);
            actionSucceeded = result.success;
            break;
          case 'force_start':
            // Force start the download
            result = await controlQueuedItem(item.id, 'start');
            actionSucceeded = result.success;
            break;
        }

        if (actionSucceeded) {
          totalItemsAffected++;
          actionDetails.push(`${item.name || 'Unknown item'}`);
          // Only increment execution count when action succeeds
          updateRuleMetadata(rule.id, {
            lastExecutedAt: now,
            executionCount: (getRuleMetadata(rule).executionCount || 0) + 1,
          });
        } else {
          totalErrors++;
        }
      } catch (error) {
        totalErrors++;
        console.error('❌ Action execution failed:', {
          ruleName: rule.name,
          itemName: item.name,
          action: rule.action.type,
          error,
        });
      }
    }

    // Log the rule execution
    const actionText = rule.action.type.replace('_', ' ');
    const success = totalItemsAffected > 0;
    const details = actionDetails.length > 0 ? `Items: ${actionDetails.slice(0, 3).join(', ')}${actionDetails.length > 3 ? '...' : ''}` : '';
    const error = totalErrors > 0 ? `Failed on ${totalErrors} items` : '';

    logRuleExecution(rule.id, actionText, success, totalItemsAffected, details, error);
  };

  // Execute rule with global condition handling (for active_download_count)
  const executeRuleWithGlobalCondition = async (rule, allItems) => {
    if (activeType !== 'torrents') {
      return;
    }

    if (!rule.enabled) {
      return;
    }

    const now = Date.now();
    const conditions = rule.conditions || [rule.condition];
    const logicOperator = rule.logicOperator || 'and';

    // Check if this rule has a global condition (active_download_count)
    const hasGlobalCondition = conditions.some(c => c.type === 'active_download_count');

    if (hasGlobalCondition) {
      // Handle global condition evaluation
      const activeCount = allItems.filter(item => item.active).length;
      
      // Evaluate all conditions
      const conditionResults = conditions.map((condition) => {
        if (condition.type === 'active_download_count') {
          return compareValues(activeCount, condition.operator, condition.value);
        } else {
          // For other conditions with global condition, we'll just evaluate the global one
          // In a more complex scenario, you could evaluate other conditions on all items
          return true;
        }
      });

      // Apply logic operator
      const conditionMet = logicOperator === 'or'
        ? conditionResults.some(result => result)
        : conditionResults.every(result => result);

      if (!conditionMet) {
        return;
      }

      // Condition met - find oldest active download
      const activeItems = allItems
        .filter(item => item.active)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      if (activeItems.length === 0) {
        return;
      }

      // Update trigger metadata
      updateRuleMetadata(rule.id, {
        lastTriggeredAt: now,
        triggeredCount: (getRuleMetadata(rule).triggeredCount || 0) + 1,
      });

      // Execute action on oldest active download
      const oldestActive = activeItems[0];
      let actionSucceeded = false;
      let result;
      const actionDetails = [];

      try {
        switch (rule.action.type) {
          case 'stop_seeding':
            result = await controlTorrent(oldestActive.id, 'stop_seeding');
            actionSucceeded = result.success;
            break;
          case 'archive':
            archiveDownload(oldestActive);
            result = await deleteItemHelper(oldestActive.id, apiKey);
            actionSucceeded = result.success;
            break;
          case 'delete':
            result = await deleteItemHelper(oldestActive.id, apiKey);
            actionSucceeded = result.success;
            break;
          case 'force_start':
            result = await controlQueuedItem(oldestActive.id, 'start');
            actionSucceeded = result.success;
            break;
        }

        if (actionSucceeded) {
          actionDetails.push(`${oldestActive.name || 'Unknown item'}`);
          updateRuleMetadata(rule.id, {
            lastExecutedAt: now,
            executionCount: (getRuleMetadata(rule).executionCount || 0) + 1,
          });
        }
      } catch (error) {
        console.error('❌ Action execution failed:', {
          ruleName: rule.name,
          itemName: oldestActive.name,
          action: rule.action.type,
          error,
        });
      }

      // Log the rule execution
      const actionText = rule.action.type.replace('_', ' ');
      const success = actionSucceeded;
      const details = actionDetails.length > 0 ? `Item: ${actionDetails[0]}` : '';
      const error = !actionSucceeded ? 'Action failed' : '';

      logRuleExecution(rule.id, actionText, success, actionSucceeded ? 1 : 0, details, error);
    } else {
      // Use existing executeRule for non-global conditions
      await executeRule(rule, allItems);
    }
  };

  // Update items ref when items change
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Event-based detection for new downloads
  useEffect(() => {
    if (activeType !== 'torrents') {
      return;
    }

    // Get current active downloads
    const currentActive = items.filter(item => item.active);
    const prevActive = prevItemsRef.current.filter(item => item.active);

    // Find newly added active downloads
    const newActiveDownloads = currentActive.filter(
      current => !prevActive.find(prev => prev.id === current.id)
    );

    // If new active download detected, check for event-based rules
    if (newActiveDownloads.length > 0) {
      // Small debounce to handle rapid additions
      const timeoutId = setTimeout(() => {
        const eventBasedRules = rulesRef.current.filter(
          rule => rule.enabled && rule.trigger?.type === 'download_added'
        );

        // Execute event-based rules
        eventBasedRules.forEach(rule => {
          executeRuleWithGlobalCondition(rule, items);
        });
      }, 100); // 100ms debounce

      // Update previous items
      prevItemsRef.current = items;

      return () => clearTimeout(timeoutId);
    }

    // Update previous items even if no new downloads
    prevItemsRef.current = items;
  }, [items, activeType]);

  // Main initialization
  useEffect(() => {
    // Skip initialization if not for torrents
    if (activeType !== 'torrents') {
      return;
    }

    if (initializationRef.current) return;
    initializationRef.current = true;

    // Initialize automation rules

    const savedRules = localStorage.getItem('torboxAutomationRules');
    if (savedRules) {
      try {
        rulesRef.current = JSON.parse(savedRules);
        // Rules loaded from storage
      } catch (error) {
        console.error('Error parsing automation rules from localStorage:', error);
        rulesRef.current = [];
      }
    }

    function setupRuleInterval(rule) {
      if (!rule.enabled) {
        // Skip disabled rules
        return;
      }

      // Skip interval setup for event-based triggers
      if (rule.trigger?.type === 'download_added') {
        return; // Event-based rules are handled by the useEffect above
      }

      const now = Date.now();
      const metadata = getRuleMetadata(rule, now);
      let initialDelay = rule.trigger.value * 1000 * 60;
      const referenceTime = metadata.lastTriggeredAt || metadata.lastEnabledAt;

      if (referenceTime) {
        const timeSinceRef = now - referenceTime;
        const remainingTime = initialDelay - timeSinceRef;
        initialDelay = Math.max(0, remainingTime);

        // Calculate initial delay for rule execution
      }

      // Set up rule timer

      // Clear any existing interval
      if (intervalsRef.current[rule.id]) {
        clearInterval(intervalsRef.current[rule.id]);
      }

      // Check if rule has global condition (check once outside setTimeout)
      const hasGlobalCondition = (rule.conditions || [rule.condition]).some(
        c => c.type === 'active_download_count'
      );

      // Set up new interval
      setTimeout(() => {
        if (hasGlobalCondition) {
          executeRuleWithGlobalCondition(rule, itemsRef.current);
        } else {
          executeRule(rule, itemsRef.current);
        }

        intervalsRef.current[rule.id] = setInterval(
          () => {
            // Execute rule on interval
            if (hasGlobalCondition) {
              executeRuleWithGlobalCondition(rule, itemsRef.current);
            } else {
              executeRule(rule, itemsRef.current);
            }
          },
          rule.trigger.value * 1000 * 60,
        );
      }, initialDelay);
    }

    // Set up intervals for all rules
    rulesRef.current.forEach(setupRuleInterval);

    // Listen for rule changes in storage
    const handleStorageChange = (e) => {
      if (e.key === 'torboxAutomationRules') {
        // Rules updated, reload intervals
        try {
          const newRules = JSON.parse(e.newValue || '[]');

        // Find rules that were deleted or disabled
        rulesRef.current.forEach((oldRule) => {
          const newRule = newRules.find((r) => r.id === oldRule.id);
          if (!newRule || !newRule.enabled) {
            if (intervalsRef.current[oldRule.id]) {
              clearInterval(intervalsRef.current[oldRule.id]);
              delete intervalsRef.current[oldRule.id];
            }
          }
        });

        rulesRef.current = newRules;
        rulesRef.current.forEach(setupRuleInterval);
        } catch (error) {
          console.error('Error parsing automation rules from storage change:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      // Clean up rule intervals
      window.removeEventListener('storage', handleStorageChange);
      Object.values(intervalsRef.current).forEach((interval) =>
        clearInterval(interval),
      );
    };
  });
}
