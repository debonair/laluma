import KcAdminClient from '@keycloak/keycloak-admin-client';

let kcAdminClient: KcAdminClient | null = null;

export const getKeycloakAdminClient = async (): Promise<KcAdminClient> => {
    if (kcAdminClient) {
        return kcAdminClient;
    }

    kcAdminClient = new KcAdminClient({
        baseUrl: process.env.KEYCLOAK_URL || 'http://localhost:8080',
        realmName: 'master', // Usually auth via master
    });

    try {
        await kcAdminClient.auth({
            username: process.env.KEYCLOAK_ADMIN_USER || 'admin',
            password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
            grantType: 'password',
            clientId: 'admin-cli',
        });

        // Switch to luma realm after auth
        kcAdminClient.setConfig({
            realmName: process.env.KEYCLOAK_REALM || 'luma',
        });

        return kcAdminClient;
    } catch (error) {
        console.error('Failed to initialize Keycloak Admin Client:', error);
        throw new Error('Keycloak Admin initialization failed');
    }
};
