import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Menu, Button, Divider, Text } from 'react-native-paper';
import { database } from '../../../models/database';
import SiteModel from '../../../models/SiteModel';

interface SimpleSiteSelectorProps {
  selectedSite: SiteModel | null;
  onSiteChange: (site: SiteModel | null) => void;
  style?: any;
}

const SimpleSiteSelector: React.FC<SimpleSiteSelectorProps> = ({
  selectedSite,
  onSiteChange,
  style,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [sites, setSites] = useState<SiteModel[]>([]);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const allSites = await database.collections
        .get<SiteModel>('sites')
        .query()
        .fetch();

      setSites(allSites);
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const handleSiteSelect = (site: SiteModel | null) => {
    onSiteChange(site);
    setMenuVisible(false);
  };

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const selectedSiteName = selectedSite?.name || 'Select Site';

  return (
    <View style={[styles.container, style]}>
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

        {sites.length > 0 && <Divider />}

        <Menu.Item
          onPress={() => handleSiteSelect(null)}
          title="Clear Selection"
          leadingIcon="close"
          disabled={!selectedSite}
        />

        {sites.length === 0 && (
          <Menu.Item
            title="No sites available"
            disabled
            titleStyle={styles.disabledItem}
          />
        )}
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
  label: {
    marginBottom: 8,
    color: '#666',
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
