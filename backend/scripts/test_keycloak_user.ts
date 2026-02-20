import axios from 'axios';

const KEYCLOAK_URL = 'http://localhost:8080';
const KEYCLOAK_REALM = 'luma-realm';
const KEYCLOAK_ADMIN_USER = 'admin';
const KEYCLOAK_ADMIN_PASSWORD = 'admin';

async function main() {
    try {
        // 1. Get admin token
        const form = new URLSearchParams({
            client_id: 'admin-cli',
            grant_type: 'password',
            username: KEYCLOAK_ADMIN_USER,
            password: KEYCLOAK_ADMIN_PASSWORD
        });
        const tokenRes = await axios.post(
            `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
            form.toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        const adminToken = tokenRes.data.access_token;

        // 2. Get user testuser001
        const usersRes = await axios.get(
            `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users?username=testuser001&exact=true`,
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        const user = usersRes.data[0];
        console.log('User:', JSON.stringify(user, null, 2));

        if (!user) return;

        // 3. Try to get credentials
        try {
            const credsRes = await axios.get(
                `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${user.id}/credentials`,
                { headers: { Authorization: `Bearer ${adminToken}` } }
            );
            console.log('Credentials:', JSON.stringify(credsRes.data, null, 2));

            console.log('Attempting to reset password directly...');
            await axios.put(
                `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${user.id}/reset-password`,
                {
                    type: 'password',
                    value: 'TestPass123!',
                    temporary: false
                },
                { headers: { Authorization: `Bearer ${adminToken}` } }
            );
            console.log('Password reset successful.');
        } catch (e: any) {
            console.log('Could not get/set credentials', e.response?.data || e.message);
        }

        // 4. Try Direct Access Grant
        try {
            const loginForm = new URLSearchParams({
                client_id: 'luma-web',
                grant_type: 'password',
                username: 'testuser001',
                password: 'TestPass123!'
            });
            const loginRes = await axios.post(
                `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
                loginForm.toString(),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
            console.log('Login success! Tokens:', Object.keys(loginRes.data));
        } catch (e: any) {
            console.log('Login failed:', JSON.stringify(e.response?.data || e.message));
        }
    } catch (err: any) {
        console.error('Error:', err.response?.data || err.message);
    }
}

main();
