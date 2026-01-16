import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Menu, Button, Divider, Text } from 'react-native-paper';
import SiteModel from '../../../models/SiteModel';
import { usePlanningContext } from '../context';

interface SimpleSiteSelectorProps {
  selectedSite: SiteModel | null;
  onSiteChange: (site: SiteModel | null) => void;
  style?: any;
}

/**
 * SimpleSiteSelector
 *
 * Site selector that uses PlanningContext to show only sites
 * for the user's assigned project. Updates both local state
 * (via onSiteChange) and global context.
 */
const SimpleSiteSelector: React.FC<SimpleSiteSelectorProps> = ({
  selectedSite,
  onSiteChange,
  style,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  // Use sites from PlanningContext (filtered by assigned project)
  const { sites, selectSite, projectName, loading, error } = usePlanningContext();

  // Handle site selection - update both local state and global context
  const handleSiteSelect = useCallback((site: SiteModel | null) => {
    onSiteChange(site);
    selectSite(site?.id || null); // Update global context
    setMenuVisible(false);
  }, [onSiteChange, selectSite]);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const selectedSiteName = selectedSite?.name || 'Select Site';

  // Handle loading state
  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <Text variant="labelMedium" style={styles.label}>Site</Text>
        <Button mode="outlined" disabled icon="loading" style={styles.button}>
          Loading sites...
        </Button>
      </View>
    );
  }

  // Handle error state
  if (error) {
    return (
      <View style={[styles.container, style]}>
        <Text variant="labelMedium" style={styles.label}>Site</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Project name header */}
      {projectName && (
        <Text variant="labelSmall" style={styles.projectLabel}>
          Project: {projectName}
        </Text>
      )}
      <Text variant="labelMedium" style={styles.label}>
        Site
      </Text>
      <Menu
        visible={menuVisible}
        onDismiss={closeMenu}
        anchor={
          <Button
            mode="outlined"
            onPress={openMenu}
            icon="map-marker"
            contentStyle={styles.buttonContent}
            style={styles.button}
          >
            {selectedSiteName}
          </Button>
        }
        // @ts-ignore - react-native-paper Menu children typing issue
        contentContainerStyle={styles.menuContent}
      >
        {sites.map(site => (
          <Menu.Item
            key={site.id}
            onPress={() => handleSiteSelect(site)}
            title={site.name}
            leadingIcon={
              selectedSite?.id === site.id ? 'check' : 'map-marker-outline'
            }
            titleStyle={
              selectedSite?.id === site.id ? styles.selectedItem : undefined
            }
          />
        ))}

        {sites.length > 0 ? <Divider /> : null}

        <Menu.Item
          onPress={() => handleSiteSelect(null)}
          title="Clear Selection"
          leadingIcon="close"
          disabled={!selectedSite}
        />

        {sites.length === 0 ? (
          <Menu.Item
            title="No sites available"
            disabled
            titleStyle={styles.disabledItem}
          />
        ) : null}
      </Menu>

      {selectedSite && (
        <Text variant="bodySmall" style={styles.siteInfo}>
          {selectedSite.location || 'No location specified'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  projectLabel: {
    marginBottom: 4,
    color: '#6200ee',
    fontWeight: '600',
  },
  label: {
    marginBottom: 8,
    color: '#666',
  },
  errorText: {
    color: '#B00020',
    fontStyle: 'italic',
  },
  button: {
    borderColor: '#6200ee',
  },
  buttonContent: {
    justifyContent: 'flex-start',
  },
  menuContent: {
    backgroundColor: 'white',
    maxHeight: 400,
  },
  selectedItem: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  disabledItem: {
    color: '#999',
    fontStyle: 'italic',
  },
  siteInfo: {
    marginTop: 4,
    marginLeft: 12,
    color: '#666',
  },
});

export default SimpleSiteSelector;
