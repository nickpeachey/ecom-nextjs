// Initialize replica set if not already initiated
try {
  const status = rs.status();
  if (status.ok !== 1) {
    throw new Error('Replica set not initiated');
  }
  print('Replica set already initiated');
} catch (e) {
  print('Initiating replica set rs0...');
  rs.initiate({
    _id: 'rs0',
    members: [{ _id: 0, host: 'localhost:27017' }],
  });
}
