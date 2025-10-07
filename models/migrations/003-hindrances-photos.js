import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 7,
      steps: [
        addColumns({
          table: 'hindrances',
          columns: [
            { name: 'photos', type: 'string' },
            { name: 'sync_status', type: 'string' },
          ],
        }),
      ],
    },
  ],
});
