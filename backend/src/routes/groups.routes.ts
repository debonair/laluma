import { Router } from 'express';
import {
    getGroups,
    createGroup,
    getGroup,
    joinGroup,
    leaveGroup,
    getRecommendedGroups,
    getGroupMembers,
    removeMember,
    updateMemberRole
} from '../controllers/groups.controller';
import {
    getGroupPosts,
    createPost
} from '../controllers/posts.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getGroups);
router.post('/', authenticate, createGroup);
router.get('/recommended', authenticate, getRecommendedGroups);
router.get('/:groupId', authenticate, getGroup);
router.post('/:groupId/join', authenticate, joinGroup);
router.post('/:groupId/leave', authenticate, leaveGroup);
router.get('/:groupId/posts', authenticate, getGroupPosts);
router.post('/:groupId/posts', authenticate, createPost);

// Group management
router.get('/:groupId/members', authenticate, getGroupMembers);
router.delete('/:groupId/members/:memberId', authenticate, removeMember);
router.patch('/:groupId/members/:memberId/role', authenticate, updateMemberRole);

export default router;
