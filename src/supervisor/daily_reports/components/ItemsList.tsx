import React from 'react';
import { ScrollView, View, StyleSheet, RefreshControl } from 'react-native';
import { Card, Paragraph, IconButton } from 'react-native-paper';
import SiteModel from '../../../../models/SiteModel';
import { ItemWithSite, ItemPhotoCounts } from '../types';
import { ItemCard } from './ItemCard';
import ItemModel from '../../../../models/ItemModel';

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
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Paragraph>No sites assigned to you yet.</Paragraph>
          </Card.Content>
        </Card>
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
                  <Paragraph style={styles.noItems}>
                    No items for this site
                  </Paragraph>
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
  emptyCard: {
    margin: 16,
    elevation: 2,
  },
  noItems: {
    fontStyle: 'italic',
    color: '#666',
  },
});
