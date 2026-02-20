import axios from 'axios';
import * as cheerio from 'cheerio';

const KEYCLOAK_URL = 'http://localhost:8080';
const REALM = 'luma-realm';
const CLIENT_ID = 'luma-web';
const REDIRECT_URI = 'http://localhost:5173/';

async function main() {
    try {
        const client = axios.create({
            withCredentials: true,
            maxRedirects: 0,
            validateStatus: () => true
        });

        // 1. Initial auth request
        const authUrl = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=openid`;
        let res = await client.get(authUrl);

        // Follow redirect to login page if any
        if (res.status === 302 && res.headers.location) {
            res = await client.get(res.headers.location, {
                headers: { Cookie: res.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') }
            });
        }

        const html = res.data;
        const $ = cheerio.load(html);
        const formAction = $('form').attr('action');

        if (!formAction) {
            console.log('No form found!', html.substring(0, 500));
            return;
        }

        console.log('Login form action:', formAction);

        // 2. Submit login
        const form = new URLSearchParams({
            username: 'testuser001',
            password: 'TestPass123!',
            credentialId: ''
        });

        const cookies = res.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ');

        const loginRes = await client.post(formAction, form.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Cookie: cookies
            }
        });

        console.log('Login response status:', loginRes.status);
        console.log('Login response location:', loginRes.headers.location);

        if (loginRes.status === 302 && loginRes.headers.location) {
            // Follow redirect to see where it goes
            const nextRes = await client.get(loginRes.headers.location, {
                headers: { Cookie: loginRes.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') || cookies }
            });
            console.log('Next step URL:', loginRes.headers.location);

            if (loginRes.headers.location.includes('required-action')) {
                const $2 = cheerio.load(nextRes.data);
                console.log('Required action page title:', $2('title').text());
                console.log('Required action page header:', $2('h1').text(), $2('h2').text(), $2('.pf-c-title').text());
            }
        } else {
            console.log('Login form HTML:', loginRes.data.substring(0, 500));
        }

    } catch (err: any) {
        console.error('Error:', err.message);
    }
}
main();
