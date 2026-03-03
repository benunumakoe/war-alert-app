import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import { colors } from '../constants/colors';

const FilterButtons = ({ selectedFilter, onFilterChange }) => {
  const filters = [
    { id: 'all', label: 'All', icon: '🌍', color: colors.primary },
    { id: 'rocket', label: 'Rocket', icon: '🚀', color: '#FF3B30' },
    { id: 'drone', label: 'Drone', icon: '🚁', color: '#FF9500' },
    { id: 'ground', label: 'Ground', icon: '⚔️', color: '#5856D6' },
    { id: 'air', label: 'Air', icon: '✈️', color: '#5AC8FA' },
    { id: 'naval', label: 'Naval', icon: '⚓', color: '#34C759' }
  ];

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {filters.map(filter => (
        <TouchableOpacity
          key={filter.id}
          style={[
            styles.filterButton,
            { backgroundColor: filter.color + '20' }, // 20% opacity
            selectedFilter === filter.id && styles.activeFilter,
            selectedFilter === filter.id && { backgroundColor: filter.color }
          ]}
          onPress={() => onFilterChange(filter.id)}
        >
          <Text style={styles.filterIcon}>{filter.icon}</Text>
          <Text style={[
            styles.filterLabel,
            selectedFilter === filter.id && styles.activeLabel
          ]}>
            {filter.label}
          </Text>
          {selectedFilter === filter.id && (
            <View style={styles.activeIndicator} />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    maxHeight: 70
  },
  contentContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center'
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative'
  },
  activeFilter: {
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 6
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text
  },
  activeLabel: {
    color: colors.white,
    fontWeight: '600'
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    left: '40%',
    right: '40%',
    height: 3,
    backgroundColor: colors.white,
    borderRadius: 2
  }
});

export default FilterButtons;
