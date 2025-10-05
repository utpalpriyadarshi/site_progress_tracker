import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Menu, Button, Divider, Text } from 'react-native-paper';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import SiteModel from '../../../models/SiteModel';
import { useSiteContext } from '../context/SiteContext';

interface SiteSelectorProps {
  style?: any;
}

const SiteSelector: React.FC<SiteSelectorProps> = ({ style }) => {
  const { selectedSiteId, setSelectedSiteId, setSelectedSite, supervisorId } = useSiteContext();
  const [menuVisible, setMenuVisible] = useState(false);
  const [sites, setSites] = useState<SiteModel[]>([]);
  const [selectedSiteName, setSelectedSiteName] = useState<string>('All Sites');

  useEffect(() => {
    // Fetch sites for the supervisor
    const fetchSites = async () => {
      try {
        const supervisorSites = await database.collections
          .get('sites')
          .query(Q.where('supervisor_id', supervisorId))
          .fetch();

        setSites(supervisorSites as SiteModel[]);

        // Update selected site name
        if (selectedSiteId === 'all') {
          setSelectedSiteName('All Sites');
          setSelectedSite(null);
        } else {
          const site = supervisorSites.find(s => s.id === selectedSiteId);
          if (site) {
            setSelectedSiteName(site.name);
            setSelectedSite(site as SiteModel);
          }
        }
      } catch (error) {
        console.error('Error fetching sites:', error);
      }
    };

    fetchSites();
  }, [selectedSiteId, supervisorId]);

  const handleSiteSelect = (siteId: string | 'all', siteName: string) => {
    setSelectedSiteId(siteId);
    setMenuVisible(false);

    if (siteId === 'all') {
      setSelectedSite(null);
    } else {
      const site = sites.find(s => s.id === siteId);
      if (site) {
        setSelectedSite(site);
      }
    }
  };

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  return (
    <View style={[styles.container, style]}>
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
        contentStyle={styles.menuContent}
      >
        <Menu.Item
          onPress={() => handleSiteSelect('all', 'All Sites')}
          title="All Sites"
          leadingIcon={selectedSiteId === 'all' ? 'check' : undefined}
          titleStyle={selectedSiteId === 'all' ? styles.selectedItem : undefined}
        />

        {sites.length > 0 && <Divider />}

        {sites.map((site) => (
          <Menu.Item
            key={site.id}
            onPress={() => handleSiteSelect(site.id, site.name)}
            title={site.name}
            leadingIcon={selectedSiteId === site.id ? 'check' : 'map-marker-outline'}
            titleStyle={selectedSiteId === site.id ? styles.selectedItem : undefined}
          />
        ))}

        {sites.length === 0 && (
          <Menu.Item
            title="No sites assigned"
            disabled
            titleStyle={styles.disabledItem}
          />
        )}
      </Menu>

      {selectedSiteId !== 'all' && sites.length > 0 && (
        <Text variant="bodySmall" style={styles.siteInfo}>
          {sites.find(s => s.id === selectedSiteId)?.location || ''}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  button: {
    borderColor: '#007AFF',
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
    color: '#007AFF',
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

export default SiteSelector;
