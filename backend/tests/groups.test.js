// tests/groups.test.js
import request from 'supertest';
import app from '../server.js';
import prisma from '../config/prisma.js';
import path from 'path';
import fs from 'fs';

// Test data
const testMember1 = {
    email: `groupmember1-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    first_name: 'Member',
    last_name: 'One'
};

const testMember2 = {
    email: `groupmember2-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    first_name: 'Member',
    last_name: 'Two'
};

const testMember3 = {
    email: `groupmember3-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    first_name: 'Member',
    last_name: 'Three'
};

const testNonMember = {
    email: `groupnonmember-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    first_name: 'Non',
    last_name: 'Member'
};

// Store tokens and IDs
let member1Tokens = {};
let member2Tokens = {};
let member3Tokens = {};
let nonMemberTokens = {};
let member1Id = '';
let member2Id = '';
let member3Id = '';
let nonMemberId = '';
let groupId = '';
let groupCode = '';
let groupListId = '';
let invitationId = '';

describe('Groups Endpoints', () => {
    // Setup - Create test users and group
    beforeAll(async () => {
        // Clean up any existing test data
        await prisma.users.deleteMany({
            where: {
                OR: [
                    { email: { contains: 'groupmember' } },
                    { email: { contains: 'groupnonmember' } }
                ]
            }
        });

        // Create test users
        const member1Response = await request(app)
            .post('/api/v1/auth/signup')
            .send(testMember1)
            .expect(201);

        member1Tokens = member1Response.body.data.tokens;
        member1Id = member1Response.body.data.user.id;

        const member2Response = await request(app)
            .post('/api/v1/auth/signup')
            .send(testMember2)
            .expect(201);

        member2Tokens = member2Response.body.data.tokens;
        member2Id = member2Response.body.data.user.id;

        const member3Response = await request(app)
            .post('/api/v1/auth/signup')
            .send(testMember3)
            .expect(201);

        member3Tokens = member3Response.body.data.tokens;
        member3Id = member3Response.body.data.user.id;

        const nonMemberResponse = await request(app)
            .post('/api/v1/auth/signup')
            .send(testNonMember)
            .expect(201);

        nonMemberTokens = nonMemberResponse.body.data.tokens;
        nonMemberId = nonMemberResponse.body.data.user.id;

        // Create a group via START_GROUP invitation
        const startGroupResponse = await request(app)
            .post('/api/v1/invitations/start-group')
            .set('Authorization', `Bearer ${member1Tokens.access_token}`)
            .send({
                to_user_code: member2Response.body.data.user.user_code, // Using user_code
                group_name: 'Test Shopping Group',
                message: 'Let\'s shop together!'
            })
            .expect(201);

        invitationId = startGroupResponse.body.data.id;

        // Accept invitation to create the group
        const acceptResponse = await request(app)
            .put(`/api/v1/invitations/${invitationId}/accept`)
            .set('Authorization', `Bearer ${member2Tokens.access_token}`)
            .expect(200);

        groupId = acceptResponse.body.data.group_id;

        // Get group details to have the group code
        const groupResponse = await request(app)
            .get(`/api/v1/groups/${groupId}`)
            .set('Authorization', `Bearer ${member1Tokens.access_token}`)
            .expect(200);

        groupCode = groupResponse.body.data.group_code;
    });

    describe('GET /api/v1/groups/:id', () => {
        test('should get group details for member', async () => {
            const response = await request(app)
                .get(`/api/v1/groups/${groupId}`)
                .set('Authorization', `Bearer ${member1Tokens.access_token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(groupId);
            expect(response.body.data.group_name).toBe('Test Shopping Group');
            expect(response.body.data.group_code).toMatch(/^[A-Z0-9]{7}$/);
            expect(response.body.data.created_at).toBeDefined();
        });

        test('should get group details for other member', async () => {
            const response = await request(app)
                .get(`/api/v1/groups/${groupId}`)
                .set('Authorization', `Bearer ${member2Tokens.access_token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(groupId);
        });

        test('should reject access from non-member', async () => {
            const response = await request(app)
                .get(`/api/v1/groups/${groupId}`)
                .set('Authorization', `Bearer ${nonMemberTokens.access_token}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.errorMessage).toContain('member');
        });

        test('should return 404 for non-existent group', async () => {
            const response = await request(app)
                .get('/api/v1/groups/999999')
                .set('Authorization', `Bearer ${member1Tokens.access_token}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        test('should reject request without authorization', async () => {
            const response = await request(app)
                .get(`/api/v1/groups/${groupId}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/groups/:id/list', () => {
        test('should get group list for member', async () => {
            const response = await request(app)
                .get(`/api/v1/groups/${groupId}/list`)
                .set('Authorization', `Bearer ${member1Tokens.access_token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('expected_total');
            expect(response.body.data).toHaveProperty('actual_total');
            expect(response.body.data).toHaveProperty('Items'); // Capital 'I' based on service
            expect(response.body.data).toHaveProperty('item_count');
            expect(Array.isArray(response.body.data.Items)).toBe(true);

            groupListId = response.body.data.id;
        });

        test('should reject access from non-member', async () => {
            const response = await request(app)
                .get(`/api/v1/groups/${groupId}/list`)
                .set('Authorization', `Bearer ${nonMemberTokens.access_token}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/groups/:id/list/items', () => {
        let addedItemId;

        test('should add item to group list', async () => {
            const newItem = {
                item_name: 'Group Eggs',
                item_price: 4.99,
                item_quantity: 2,
                item_status: 'NEEDED'
            };

            const response = await request(app)
                .post(`/api/v1/groups/${groupId}/list/items`)
                .set('Authorization', `Bearer ${member1Tokens.access_token}`)
                .send(newItem)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.item_name).toBe(newItem.item_name);
            expect(response.body.data.item_price).toBe(newItem.item_price.toString());
            expect(response.body.data.item_quantity).toBe(newItem.item_quantity);
            expect(response.body.data.user_id).toBe(member1Id);

            addedItemId = response.body.data.id;
        });

        test('should allow other member to add item', async () => {
            const newItem = {
                item_name: 'Group Butter',
                item_quantity: 1
            };

            const response = await request(app)
                .post(`/api/v1/groups/${groupId}/list/items`)
                .set('Authorization', `Bearer ${member2Tokens.access_token}`)
                .send(newItem)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user_id).toBe(member2Id);
        });

        test('should reject item from non-member', async () => {
            const newItem = {
                item_name: 'Unauthorized Item',
                item_quantity: 1
            };

            const response = await request(app)
                .post(`/api/v1/groups/${groupId}/list/items`)
                .set('Authorization', `Bearer ${nonMemberTokens.access_token}`)
                .send(newItem)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        test('should reject item without required fields', async () => {
            const invalidItem = {
                item_price: 2.50
                // Missing item_name and item_quantity
            };

            const response = await request(app)
                .post(`/api/v1/groups/${groupId}/list/items`)
                .set('Authorization', `Bearer ${member1Tokens.access_token}`)
                .send(invalidItem)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errorMessage).toContain('required');
        });
    });

    describe('GET /api/v1/groups/:id/members', () => {
        test('should get group members list', async () => {
            const response = await request(app)
                .get(`/api/v1/groups/${groupId}/members`)
                .set('Authorization', `Bearer ${member1Tokens.access_token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(2); // member1 and member2
            
            const memberIds = response.body.data.map(m => m.id);
            expect(memberIds).toContain(member1Id);
            expect(memberIds).toContain(member2Id);
        });

        test('should reject access from non-member', async () => {
            const response = await request(app)
                .get(`/api/v1/groups/${groupId}/members`)
                .set('Authorization', `Bearer ${nonMemberTokens.access_token}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/groups/:id/invitations', () => {
        test('should get group invitation history', async () => {
            const response = await request(app)
                .get(`/api/v1/groups/${groupId}/invitations`)
                .set('Authorization', `Bearer ${member1Tokens.access_token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            // Should have at least the START_GROUP invitation
            expect(response.body.data.length).toBeGreaterThanOrEqual(1);
        });

        test('should reject access from non-member', async () => {
            const response = await request(app)
                .get(`/api/v1/groups/${groupId}/invitations`)
                .set('Authorization', `Bearer ${nonMemberTokens.access_token}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/v1/groups/:id', () => {
        test('should update group details with text fields', async () => {
            const updateData = {
                group_name: 'Updated Shopping Group'
            };

            const response = await request(app)
                .put(`/api/v1/groups/${groupId}`)
                .set('Authorization', `Bearer ${member1Tokens.access_token}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.group_name).toBe(updateData.group_name);
            expect(response.body.data.group_code).toBe(groupCode); // Should remain unchanged
        });

        test('should allow any member to update group', async () => {
            const updateData = {
                group_name: 'Member 2 Updated Group'
            };

            const response = await request(app)
                .put(`/api/v1/groups/${groupId}`)
                .set('Authorization', `Bearer ${member2Tokens.access_token}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.group_name).toBe(updateData.group_name);
        });

        test('should update group with image', async () => {
            // Create a fake image file for testing
            const testImagePath = path.join(process.cwd(), 'test-group-image.jpg');
            const fakeImageBuffer = Buffer.from('fake group image data');
            fs.writeFileSync(testImagePath, fakeImageBuffer);

            const response = await request(app)
                .put(`/api/v1/groups/${groupId}`)
                .set('Authorization', `Bearer ${member1Tokens.access_token}`)
                .attach('group_image', testImagePath)
                .field('group_name', 'Group With Image');

            // Clean up test file
            fs.unlinkSync(testImagePath);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.group_name).toBe('Group With Image');
            expect(response.body.data.group_image).toBeTruthy();
        });

        test('should reject update from non-member', async () => {
            const updateData = {
                group_name: 'Unauthorized Update'
            };

            const response = await request(app)
                .put(`/api/v1/groups/${groupId}`)
                .set('Authorization', `Bearer ${nonMemberTokens.access_token}`)
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/v1/groups/:id/list/clear', () => {
        beforeAll(async () => {
            // Add some items to clear
            await request(app)
                .post(`/api/v1/groups/${groupId}/list/items`)
                .set('Authorization', `Bearer ${member1Tokens.access_token}`)
                .send({
                    item_name: 'Item to Clear 1',
                    item_quantity: 1
                })
                .expect(200);

            await request(app)
                .post(`/api/v1/groups/${groupId}/list/items`)
                .set('Authorization', `Bearer ${member2Tokens.access_token}`)
                .send({
                    item_name: 'Item to Clear 2',
                    item_quantity: 2
                })
                .expect(200);
        });

        test('should clear group list', async () => {
            const response = await request(app)
                .put(`/api/v1/groups/${groupId}/list/clear`)
                .set('Authorization', `Bearer ${member1Tokens.access_token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.deletedCount).toBeGreaterThanOrEqual(2);
        });

        test('should verify list is actually cleared', async () => {
            const response = await request(app)
                .get(`/api/v1/groups/${groupId}/list`)
                .set('Authorization', `Bearer ${member2Tokens.access_token}`)
                .expect(200);

            expect(response.body.data.Items.length).toBe(0);
            expect(response.body.data.expected_total).toBe('0');
            expect(response.body.data.actual_total).toBe('0');
        });

        test('should reject clear from non-member', async () => {
            const response = await request(app)
                .put(`/api/v1/groups/${groupId}/list/clear`)
                .set('Authorization', `Bearer ${nonMemberTokens.access_token}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/v1/groups/:id/leave', () => {
        let tempGroupId;

        beforeEach(async () => {
            // Create a temporary group for leave tests
            const startGroupResponse = await request(app)
                .post('/api/v1/invitations/start-group')
                .set('Authorization', `Bearer ${member1Tokens.access_token}`)
                .send({
                    to_user_id: member3Id,
                    group_name: 'Temp Leave Test Group',
                    message: 'Temporary group for testing leave'
                })
                .expect(201);

            const tempInvitationId = startGroupResponse.body.data.id;

            const acceptResponse = await request(app)
                .put(`/api/v1/invitations/${tempInvitationId}/accept`)
                .set('Authorization', `Bearer ${member3Tokens.access_token}`)
                .expect(200);

            tempGroupId = acceptResponse.body.data.group_id;
        });

        test('should allow member to leave group', async () => {
            const response = await request(app)
                .delete(`/api/v1/groups/${tempGroupId}/leave`)
                .set('Authorization', `Bearer ${member3Tokens.access_token}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify member no longer has access
            await request(app)
                .get(`/api/v1/groups/${tempGroupId}`)
                .set('Authorization', `Bearer ${member3Tokens.access_token}`)
                .expect(403);
        });

        test('should disband group if last member leaves', async () => {
            // First member leaves
            await request(app)
                .delete(`/api/v1/groups/${tempGroupId}/leave`)
                .set('Authorization', `Bearer ${member3Tokens.access_token}`)
                .expect(200);

            // Last member leaves - should disband
            const response = await request(app)
                .delete(`/api/v1/groups/${tempGroupId}/leave`)
                .set('Authorization', `Bearer ${member1Tokens.access_token}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify group no longer exists
            await request(app)
                .get(`/api/v1/groups/${tempGroupId}`)
                .set('Authorization', `Bearer ${member1Tokens.access_token}`)
                .expect(404);
        });

        test('should reject leave from non-member', async () => {
            const response = await request(app)
                .delete(`/api/v1/groups/${tempGroupId}/leave`)
                .set('Authorization', `Bearer ${nonMemberTokens.access_token}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/v1/groups/:id', () => {
        let tempGroupId;

        beforeEach(async () => {
            // Create a temporary group for disband tests
            const startGroupResponse = await request(app)
                .post('/api/v1/invitations/start-group')
                .set('Authorization', `Bearer ${member2Tokens.access_token}`)
                .send({
                    to_user_id: member3Id,
                    group_name: 'Temp Disband Test Group',
                    message: 'Temporary group for testing disband'
                })
                .expect(201);

            const tempInvitationId = startGroupResponse.body.data.id;

            const acceptResponse = await request(app)
                .put(`/api/v1/invitations/${tempInvitationId}/accept`)
                .set('Authorization', `Bearer ${member3Tokens.access_token}`)
                .expect(200);

            tempGroupId = acceptResponse.body.data.group_id;
        });

        test('should disband group by any member', async () => {
            const response = await request(app)
                .delete(`/api/v1/groups/${tempGroupId}`)
                .set('Authorization', `Bearer ${member2Tokens.access_token}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify group is deleted
            await request(app)
                .get(`/api/v1/groups/${tempGroupId}`)
                .set('Authorization', `Bearer ${member2Tokens.access_token}`)
                .expect(404);
        });

        test('should reject disband from non-member', async () => {
            const response = await request(app)
                .delete(`/api/v1/groups/${tempGroupId}`)
                .set('Authorization', `Bearer ${nonMemberTokens.access_token}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        test('should reject disband without authorization', async () => {
            const response = await request(app)
                .delete(`/api/v1/groups/${tempGroupId}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    // Cleanup after all tests
    afterAll(async () => {
        // Clean up test users (this will cascade delete all related data)
        const testUsers = await prisma.users.findMany({
            where: {
                OR: [
                    { email: { contains: 'groupmember' } },
                    { email: { contains: 'groupnonmember' } }
                ]
            },
            select: { id: true }
        });

        for (const user of testUsers) {
            try {
                const userService = await import('../services/users.service.js');
                await userService.default.deleteUser(user.id);
            } catch (error) {
                console.log(`Failed to delete test user ${user.id}:`, error.message);

                // Try Supabase cleanup if service fails
                try {
                    const { supabaseAdmin } = await import('../config/supabase.js');
                    await supabaseAdmin.auth.admin.deleteUser(user.id);
                } catch (supabaseError) {
                    console.log(`Supabase cleanup error for ${user.id}:`, supabaseError.message);
                }
            }
        }

        await prisma.$disconnect();
    });

})