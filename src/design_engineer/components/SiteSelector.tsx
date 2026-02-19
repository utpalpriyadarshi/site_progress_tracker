import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Menu, Button, Divider, Text } from 'react-native-paper';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import SiteModel from '../../../models/SiteModel';
import { useDesignEngineerContext } from '../context/DesignEngineerContext';
import { logger } from '../../services/LoggingService';
import { COLORS } from '../../theme/colors';

interface SiteSelectorProps {
  style?: any;
}

const SiteSelector: React.FC<SiteSelectorProps> = ({ style }) => {
  const { selectedSiteId, setSelectedSiteId, setSelectedSite, engineerId } = useDesignEngineerContext();
  const [menuVisible, setMenuVisible] = useState(false);
  const [sites, setSites] = useState<SiteModel[]>([]);
  const [selectedSiteName, setSelectedSiteName] = useState<string>('All Sites');

  useEffect(() => {
    // Fetch sites assigned to the design engineer
    const fetchSites = async () => {
      try {
        const designerSites = await database.collections
          .get('sites')
          .query(Q.where('design_engineer_id', engineerId))
          .fetch();

        setSites(designerSites as SiteModel[]);

        // Update selected site name
        if (selectedSiteId === 'all') {
          setSelectedSiteName('All Sites');
          setSelectedSite(null);
        } else {
          const site = designerSites.find(s => s.id === selectedSiteId);
          if (site) {
            setSelectedSiteName(site.name);
            setSelectedSite(site as SiteModel);
          }
        }
      } catch (error) {
        logger.error('Error fetching sites for designer', error as Error, {
          component: 'SiteSelector',
          engineerId,
        });
      }
    };

    if (engineerId) {
      fetchSites();
    }
  }, [selectedSiteId, engineerId]);

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
            mode="contained"
            onPress={openMenu}
            icon="map-marker"
            contentStyle={styles.buttonContent}
            style={styles.button}
            buttonColor="rgba(255, 255, 255, 0.95)"
            textColor="#333"
            labelStyle={styles.buttonLabel}
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  buttonContent: {
    justifyContent: 'flex-start',
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuContent: {
    backgroundColor: 'white',
    maxHeight: 400,
  },
  selectedItem: {
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  disabledItem: {
    color: '#999',
    fontStyle: 'italic',
  },
  siteInfo: {
    marginTop: 4,
    marginLeft: 12,
    color: '#E0E0E0',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SiteSelector;
