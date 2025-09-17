# Simple MongoDB image for local development
FROM mongo:7

# Copy replica set init script
COPY rs-init.js /docker-entrypoint-initdb.d/rs-init.js

# Run mongod with replica set enabled
CMD ["mongod", "--replSet", "rs0", "--bind_ip_all"]

EXPOSE 27017
