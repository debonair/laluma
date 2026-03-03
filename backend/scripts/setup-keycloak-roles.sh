#!/bin/bash
# script to set up the 5 realm roles (`member`, `moderator`, `editorial`, `admin`, `brand_partner`).

# Default to localhost if KEYCLOAK_URL is not provided
KC_URL=${KEYCLOAK_URL:-http://localhost:8080}
KC_REALM=${KEYCLOAK_REALM:-luma}
KC_USER=${KEYCLOAK_ADMIN:-admin}
KC_PASSWORD=${KEYCLOAK_ADMIN_PASSWORD:-admin}

# Path to the keycloak admin cli inside the container, or local wrapper
# Assuming standard Keycloak container setup
KCADM="/opt/keycloak/bin/kcadm.sh"

echo "Connecting to Keycloak at $KC_URL..."

# Authenticate
docker exec keycloak $KCADM config credentials --server $KC_URL --realm master --user $KC_USER --password $KC_PASSWORD

echo "Creating roles in realm: $KC_REALM"

ROLES=("member" "moderator" "editorial" "admin" "brand_partner")

for ROLE in "${ROLES[@]}"; do
    echo "Creating role: $ROLE"
    # Ignore error if role already exists
    docker exec keycloak $KCADM create roles -r $KC_REALM -s name=$ROLE || echo "Role $ROLE may already exist"
done

echo "Role setup complete."
