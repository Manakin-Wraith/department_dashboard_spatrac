/**
 * Test script for status utilities
 * This file helps verify that our status management system is working correctly
 */

import { 
  SCHEDULE_STATUS, 
  normalizeStatus, 
  isValidStatusTransition, 
  getStatusColor,
  getStatusLabel,
  canEditItem,
  canConfirmItem,
  createStatusChangeHistoryEntry
} from './statusUtils';

// Test normalization of legacy statuses
console.log('=== Testing Status Normalization ===');
console.log(`'planned' normalizes to: ${normalizeStatus('planned')}`);
console.log(`'scheduled' normalizes to: ${normalizeStatus('scheduled')}`);
console.log(`'completed' normalizes to: ${normalizeStatus('completed')}`);

// Test valid transitions
console.log('\n=== Testing Valid Status Transitions ===');
console.log(`From SCHEDULED to IN_PROGRESS: ${isValidStatusTransition(SCHEDULE_STATUS.SCHEDULED, SCHEDULE_STATUS.IN_PROGRESS)}`);
console.log(`From SCHEDULED to COMPLETED: ${isValidStatusTransition(SCHEDULE_STATUS.SCHEDULED, SCHEDULE_STATUS.COMPLETED)}`);
console.log(`From IN_PROGRESS to COMPLETED: ${isValidStatusTransition(SCHEDULE_STATUS.IN_PROGRESS, SCHEDULE_STATUS.COMPLETED)}`);
console.log(`From COMPLETED to SCHEDULED: ${isValidStatusTransition(SCHEDULE_STATUS.COMPLETED, SCHEDULE_STATUS.SCHEDULED)}`);

// Test with legacy status
console.log('\n=== Testing Legacy Status Transitions ===');
console.log(`From 'planned' to 'scheduled': ${isValidStatusTransition('planned', 'scheduled')}`);
console.log(`From 'planned' to COMPLETED: ${isValidStatusTransition('planned', SCHEDULE_STATUS.COMPLETED)}`);

// Test status colors
console.log('\n=== Testing Status Colors ===');
console.log(`Color for SCHEDULED: ${getStatusColor(SCHEDULE_STATUS.SCHEDULED)}`);
console.log(`Color for IN_PROGRESS: ${getStatusColor(SCHEDULE_STATUS.IN_PROGRESS)}`);
console.log(`Color for COMPLETED: ${getStatusColor(SCHEDULE_STATUS.COMPLETED)}`);
console.log(`Color for legacy 'planned': ${getStatusColor('planned')}`);

// Test status labels
console.log('\n=== Testing Status Labels ===');
console.log(`Label for SCHEDULED: ${getStatusLabel(SCHEDULE_STATUS.SCHEDULED)}`);
console.log(`Label for IN_PROGRESS: ${getStatusLabel(SCHEDULE_STATUS.IN_PROGRESS)}`);
console.log(`Label for COMPLETED: ${getStatusLabel(SCHEDULE_STATUS.COMPLETED)}`);
console.log(`Label for legacy 'planned': ${getStatusLabel('planned')}`);

// Test permission checks
console.log('\n=== Testing Permission Checks ===');
console.log(`Can edit SCHEDULED item: ${canEditItem(SCHEDULE_STATUS.SCHEDULED)}`);
console.log(`Can edit IN_PROGRESS item: ${canEditItem(SCHEDULE_STATUS.IN_PROGRESS)}`);
console.log(`Can edit COMPLETED item: ${canEditItem(SCHEDULE_STATUS.COMPLETED)}`);
console.log(`Can confirm SCHEDULED item: ${canConfirmItem(SCHEDULE_STATUS.SCHEDULED)}`);
console.log(`Can confirm COMPLETED item: ${canConfirmItem(SCHEDULE_STATUS.COMPLETED)}`);

// Test history entry creation
console.log('\n=== Testing History Entry Creation ===');
const historyEntry = createStatusChangeHistoryEntry(
  SCHEDULE_STATUS.SCHEDULED, 
  SCHEDULE_STATUS.COMPLETED,
  'Test User'
);
console.log('History entry:', JSON.stringify(historyEntry, null, 2));

console.log('\n=== All Tests Complete ===');

/**
 * To run this test:
 * 1. Open a terminal in the project directory
 * 2. Run: node -r esm src/utils/testStatusUtils.js
 * 
 * Note: You may need to install ESM first: npm install esm
 */
