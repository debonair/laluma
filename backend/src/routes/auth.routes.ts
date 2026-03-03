import { Router } from 'express';
import { signUp, signIn, signOut, refreshToken, oauthRedirect } from '../controllers/auth.controller';

const router = Router();

router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/refresh', refreshToken);
router.post('/signout', signOut);

// Step 1: Request redirect URL for provider
router.get('/oauth/:provider', oauthRedirect);

// Step 2: PKCE callback (Usually handled purely on the frontend, but documented here for routing completeness)
// router.get('/oauth/callback', oauthCallback);

export default router;

