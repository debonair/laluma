import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const testFilePath = path.join(__dirname, 'test_attachment.png');
fs.writeFileSync(testFilePath, 'fake image content');

async function getAdminToken() {
    try {
        const params = new URLSearchParams();
        params.append('client_id', 'luma-frontend');
        params.append('username', 'admin_user');
        params.append('password', 'Password123!');
        params.append('grant_type', 'password');

        const response = await axios.post(
            'http://localhost:8080/realms/luma-realm/protocol/openid-connect/token',
            params,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        return response.data.access_token;
    } catch (error: any) {
        console.error('Failed to get Keycloak token:', error.response?.data || error.message);
        throw error;
    }
}

async function testAttachmentUpload() {
    try {
        console.log('1. Getting Keycloak admin token...');
        const token = await getAdminToken();

        console.log('2. Fetching users to find a recipient...');
        const usersRes = await axios.get('http://localhost:3000/api/users', {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Find anyone who isn't the admin
        const recipient = usersRes.data.users.find((u: any) => u.username !== 'admin_user');
        if (!recipient) {
            console.log('Could not find a recipient user to test with.');
            return;
        }

        console.log(`3. Sending attachment to ${recipient.username}...`);
        const form = new FormData();
        form.append('recipientId', recipient.id);
        form.append('content', 'Here is a test attachment from the verification script!');
        form.append('attachment', fs.createReadStream(testFilePath));

        const sendRes = await axios.post('http://localhost:3000/api/messages/send/attachment', form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });

        console.log('✅ Message with attachment sent successfully!');
        const message = sendRes.data.message;
        console.log('Response:', JSON.stringify(message, null, 2));

        if (!message.attachmentUrl) {
            throw new Error('Message was sent but attachmentUrl is missing!');
        }

        console.log('\n4. Testing read receipt logic...');
        const convId = message.conversationId;
        const readRes = await axios.post('http://localhost:3000/api/messages/read', {
            conversationId: convId
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Conversation marked as read explicitly.');
        console.log('Response:', JSON.stringify(readRes.data, null, 2));

    } catch (error: any) {
        console.error('\n❌ Test failed');
        if (error.response) {
            console.error(error.response.data);
        } else {
            console.error(error.message);
        }
    } finally {
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    }
}

testAttachmentUpload();
