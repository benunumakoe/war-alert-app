import moment from 'moment';

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Unknown time';
  
  const date = moment(timestamp);
  const now = moment();
  
  if (now.diff(date, 'minutes') < 1) {
    return 'Just now';
  } else if (now.diff(date, 'hours') < 1) {
    return `${now.diff(date, 'minutes')} min ago`;
  } else if (now.diff(date, 'days') < 1) {
    return date.format('h:mm A');
  } else if (now.diff(date, 'days') < 7) {
    return date.format('ddd h:mm A');
  } else {
    return date.format('MMM D, YYYY');
  }
};

export const getSeverityLevel = (severity) => {
  const levels = {
    high: 3,
    medium: 2,
    low: 1,
    critical: 3,
    warning: 2,
    info: 1
  };
  
  return levels[severity?.toLowerCase()] || 0;
};

export const groupAlertsByDate = (alerts) => {
  const grouped = {};
  
  alerts.forEach(alert => {
    const date = moment(alert.timestamp).format('YYYY-MM-DD');
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(alert);
  });
  
  return grouped;
};

export const filterAlertsByProximity = (alerts, userLocation, maxDistance = 50) => {
  if (!userLocation || !alerts.length) return alerts;
  
  return alerts.filter(alert => {
    if (alert.coordinates) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        alert.coordinates.latitude,
        alert.coordinates.longitude
      );
      return distance <= maxDistance;
    }
    return false;
  });
};

export const sortAlertsByPriority = (alerts) => {
  return [...alerts].sort((a, b) => {
    // Sort by severity first
    const severityDiff = getSeverityLevel(b.severity) - getSeverityLevel(a.severity);
    if (severityDiff !== 0) return severityDiff;
    
    // Then by time (newest first)
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return re.test(phone);
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
