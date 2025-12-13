import React from 'react';
import { ScrollView, View, StyleSheet, RefreshControl } from 'react-native';
import { Card, IconButton } from 'react-native-paper';
import SiteModel from '../../../../models/SiteModel';
import { ItemWithSite, ItemPhotoCounts } from '../types';
import { ItemCard } from './ItemCard';
import ItemModel from '../../../../models/ItemModel';
import { EmptyState } from '../../../components/common/EmptyState';

interface ItemsListProps {
  sites: SiteModel[];
  itemsWithSites: ItemWithSite[];
  itemPhotoCounts: ItemPhotoCounts;
  refreshing: boolean;
  onRefresh: () => void;
  onUpdateItem: (item: ItemModel) => void;
}

/**
 * ItemsList Component
 *
 * Displays a scrollable list of items grouped by site
 * Each site shows a card with its items
 * Supports pull-to-refresh
 */
export const ItemsList: React.FC<ItemsListProps> = ({
  sites,
  itemsWithSites,
  itemPhotoCounts,
  refreshing,
  onRefresh,
  onUpdateItem,
}) => {
  return (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {/* Show empty state if no sites */}
      {sites.length === 0 ? (
        <EmptyState
          icon="map-marker-off"
          title="No Sites Assigned"
          message="You don't have any sites assigned yet. Contact your administrator to get started."
        />
      ) : (
        /* Display sites with their items */
        sites.map(site => {
          const siteItems = itemsWithSites.filter(
            iws => iws.item.siteId === site.id,
          );

          return (
            <Card key={site.id} style={styles.siteCard}>
              <Card.Title
                title={site.name}
                subtitle={site.location}
                left={props => <IconButton {...props} icon="map-marker" />}
              />
              <Card.Content>
                {siteItems.length === 0 ? (
                  <View style={styles.siteEmptyState}>
                    <EmptyState
                      icon="package-variant"
                      title="No Items"
                      message="No construction items assigned to this site yet."
                      iconSize={48}
                    />
                  </View>
                ) : (
                  siteItems.map(({ item }) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      photoCount={itemPhotoCounts[item.id] || 0}
                      onUpdate={onUpdateItem}
                    />
                  ))
                )}
              </Card.Content>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  siteCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  siteEmptyState: {
    paddingVertical: 16,
  },
});
