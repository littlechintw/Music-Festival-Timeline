import { ref } from 'vue';

export const notificationHistory = ref(JSON.parse(localStorage.getItem('notification_history') || '[]'));

export function getSentReminders() {
  return new Set(JSON.parse(localStorage.getItem('sent_reminders') || '[]'));
}

export function saveNotificationToHistory(key, title, body) {
  // Update sent keys
  const sent = getSentReminders();
  sent.add(key);
  localStorage.setItem('sent_reminders', JSON.stringify([...sent]));

  // Update history log
  const history = notificationHistory.value;
  history.unshift({
    key,
    title,
    body,
    timestamp: new Date().getTime()
  });
  
  // Keep only the last 100 notifications to prevent storage overflow
  if (history.length > 100) {
    history.pop();
  }
  
  notificationHistory.value = history;
  localStorage.setItem('notification_history', JSON.stringify(history));
}

export function hasNotified(key) {
  return getSentReminders().has(key);
}

export function clearNotificationHistory() {
  notificationHistory.value = [];
  localStorage.removeItem('notification_history');
  localStorage.removeItem('sent_reminders');
}
