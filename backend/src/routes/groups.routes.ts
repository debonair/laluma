import { Router } from 'express';
import {
    getGroups,
    createGroup,
    getGroup,
    joinGroup,
    leaveGroup
} from '../controllers/groups.controller';
import {
    getGroupPosts,
    createPost
} from '../controllers/posts.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getGroups);
router.post('/', authenticate, createGroup);
router.get('/:groupId', authenticate, getGroup);
router.post('/:groupId/join', authenticate, joinGroup);
router.post('/:groupId/leave', authenticate, leaveGroup);
router.get('/:groupId/posts', authenticate, getGroupPosts);
router.post('/:groupId/posts', authenticate, createPost);

export default router;
