// tests/items.test.js
import request from 'supertest';
import app from '../server.js';
import prisma from '../config/prisma.js';

// Test data
const testUser = {
    email: `itemtest-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    first_name: 'Item',
    last_name: 'Tester'
};

const testGroupMember1 = {
    email: `itemgroupmember1-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    first_name: 'Group',
    last_name: 'Member1'
};

const testGroupMember2 = {
    email: `itemgroupmember2-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    first_name: 'Group',
    last_name: 'Member2'
};

const testNonMember = {
    email: `itemnonmember-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    first_name: 'Non',
    last_name: 'Member'
};

// Store tokens and IDs
let userTokens = {};
let member1Tokens = {};
let member2Tokens = {};
let nonMemberTokens = {};
let userId = '';
let member1Id = '';
let member2Id = '';
let nonMemberId = '';
let personalListId = '';
let groupId = '';
let groupListId = '';
let personalItemId = '';
let groupItemId = '';
let testItems = [];

describe('Items Endpoints', () => {
    // Setup - Create test users, lists, and items
    beforeAll(async () => {
        // Clean up any existing test data
        await prisma.users.deleteMany({
            where: {
                OR: [
                    { email: { contains: 'itemtest' } },
                    { email: { contains: 'itemgroupmember' } },
                    { email: { contains: 'itemnonmember' } }
                ]
            }
        });

        // Create test user with personal list
        const userResponse = await request(app)
            .post('/api/v1/auth/signup')
            .send(testUser)
            .expect(201);

        userTokens = userResponse.body.data.tokens;
        userId = userResponse.body.data.user.id;

        // Create group members
        const member1Response = await request(app)
            .post('/api/v1/auth/signup')
            .send(testGroupMember1)
            .expect(201);

        member1Tokens = member1Response.body.data.tokens;
        member1Id = member1Response.body.data.user.id;

        const member2Response = await request(app)
            .post('/api/v1/auth/signup')
            .send(testGroupMember2)
            .expect(201);

        member2Tokens = member2Response.body.data.tokens;
        member2Id = member2Response.body.data.user.id;

        // Create non-member user
        const nonMemberResponse = await request(app)
            .post('/api/v1/auth/signup')
            .send(testNonMember)
            .expect(201);

        nonMemberTokens = nonMemberResponse.body.data.tokens;
        nonMemberId = nonMemberResponse.body.data.user.id;

        // Get personal list ID for regular user
        const personalListResponse = await request(app)
            .get(`/api/v1/users/${userId}/list`)
            .set('Authorization', `Bearer ${userTokens.access_token}`)
            .expect(200);

        personalListId = personalListResponse.body.data.id;

        // Create a group via invitation (START_GROUP type)
        const groupInviteResponse = await request(app)
            .post('/api/v1/invitations/start-group')
            .set('Authorization', `Bearer ${member1Tokens.access_token}`)
            .send({
                to_user_id: member2Id,
                group_name: 'Test Item Group',
                message: 'Join my test group'
            })
            .expect(201);

        const invitationId = groupInviteResponse.body.data.id;

        // Accept invitation to create the group
        const acceptResponse = await request(app)
            .put(`/api/v1/invitations/${invitationId}/accept`)
            .set('Authorization', `Bearer ${member2Tokens.access_token}`)
            .expect(200);

        groupId = acceptResponse.body.data.group_id;

        // Get group list ID
        const groupListResponse = await request(app)
            .get(`/api/v1/groups/${groupId}/list`)
            .set('Authorization', `Bearer ${member1Tokens.access_token}`)
            .expect(200);

        groupListId = groupListResponse.body.data.id;

        // Add item to personal list
        const personalItemResponse = await request(app)
            .post(`/api/v1/users/${userId}/list/items`)
            .set('Authorization', `Bearer ${userTokens.access_token}`)
            .send({
                item_name: 'Personal Milk',
                item_price: 3.99,
                item_quantity: 1,
                item_status: 'NEEDED'
            })
            .expect(200);

        personalItemId = personalItemResponse.body.data.id;
        testItems.push(personalItemId);

        // Add item to group list
        const groupItemResponse = await request(app)
            .post(`/api/v1/groups/${groupId}/list/items`)
            .set('Authorization', `Bearer ${member1Tokens.access_token}`)
            .send({
                item_name: 'Group Bread',
                item_price: 2.50,
                item_quantity: 2,
                item_status: 'NEEDED'
            })
            .expect(200);

        groupItemId = groupItemResponse.body.data.id;
        testItems.push(groupItemId);
    });

    describe('GET /api/v1/items/:id', () => {
        test('should get personal item details with valid access', async () => {
            const response = await request(app)
                .get(`/api/v1/items/${personalItemId}`)
                .set('Authorization', `Bearer ${userTokens.access_token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(personalItemId);
            expect(response.body.data.item_name).toBe('Personal Milk');
            expect(response.body.data.item_price).toBe('3.99');
            expect(response.body.data.item_quantity).toBe(1);
            expect(response.body.data.item_status).toBe('NEEDED');
            expect(response.body.data.user_id).toBe(userId);
            expect(response.body.data.list_id).toBe(personalListId);
        });

        test('should get group item details for group member', async () => {
            const response = await request(app)
                .get(`/api/v1/items/${groupItemId}`)
                .set('Authorization', `Bearer ${member1Tokens.access_token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(groupItemId);
            expect(response.body.data.item_name).toBe('Group Bread');
            expect(response.body.data.item_price).toBe('2.50');
            expect(response.body.data.item_quantity).toBe(2);
            expect(response.body.data.list_id).toBe(groupListId);
        });

        test('should allow other group member to access group item', async () => {
            const response = await request(app)
                .get(`/api/v1/items/${groupItemId}`)
                .set('Authorization', `Bearer ${member2Tokens.access_token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(groupItemId);
        });

        test('should reject access to personal item from other user', async () => {
            const response = await request(app)
                .get(`/api/v1/items/${personalItemId}`)
                .set('Authorization', `Bearer ${member1Tokens.access_token}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        test('should reject access to group item from non-member', async () => {
            const response = await request(app)
                .get(`/api/v1/items/${groupItemId}`)
                .set('Authorization', `Bearer ${nonMemberTokens.access_token}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        test('should return 404 for non-existent item', async () => {
            const fakeItemId = 999999;
            const response = await request(app)
                .get(`/api/v1/items/${fakeItemId}`)
                .set('Authorization', `Bearer ${userTokens.access_token}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        test('should reject request without authorization', async () => {
            const response = await request(app)
                .get(`/api/v1/items/${personalItemId}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/v1/items/:id', () => {
        test('should update personal item details', async () => {
            const updateData = {
                item_name: 'Organic Milk',
                item_price: 5.99,
                item_quantity: 3
            };

            const response = await request(app)
                .put(`/api/v1/items/${personalItemId}`)
                .set('Authorization', `Bearer ${userTokens.access_token}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.item_name).toBe(updateData.item_name);
            expect(response.body.data.item_price).toBe(updateData.item_price.toString());
            expect(response.body.data.item_quantity).toBe(updateData.item_quantity);
        });

        test('should update group item by any group member', async () => {
            const updateData = {
                item_name: 'Whole Wheat Bread',
                item_quantity: 3
            };

            const response = await request(app)
                .put(`/api/v1/items/${groupItemId}`)
                .set('Authorization', `Bearer ${member2Tokens.access_token}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.item_name).toBe(updateData.item_name);
            expect(response.body.data.item_quantity).toBe(updateData.item_quantity);
        });

        test('should update with partial data', async () => {
            const updateData = {
                item_price: 7.99
            };

            const response = await request(app)
                .put(`/api/v1/items/${personalItemId}`)
                .set('Authorization', `Bearer ${userTokens.access_token}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.item_price).toBe(updateData.item_price.toString());
            expect(response.body.data.item_name).toBe('Organic Milk'); // Should remain from previous update
        });

        test('should reject update from non-owner for personal item', async () => {
            const updateData = {
                item_name: 'Stolen Milk'
            };

            const response = await request(app)
                .put(`/api/v1/items/${personalItemId}`)
                .set('Authorization', `Bearer ${member1Tokens.access_token}`)
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        test('should reject update from non-member for group item', async () => {
            const updateData = {
                item_name: 'Unauthorized Bread'
            };

            const response = await request(app)
                .put(`/api/v1/items/${groupItemId}`)
                .set('Authorization', `Bearer ${nonMemberTokens.access_token}`)
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        test('should reject invalid data types', async () => {
            const updateData = {
                item_price: 'not-a-number',
                item_quantity: 'not-an-integer'
            };

            const response = await request(app)
                .put(`/api/v1/items/${personalItemId}`)
                .set('Authorization', `Bearer ${userTokens.access_token}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/v1/items/:id/status', () => {
        test('should update item status to PURCHASED', async () => {
            const response = await request(app)
                .put(`/api/v1/items/${personalItemId}/status`)
                .set('Authorization', `Bearer ${userTokens.access_token}`)
                .send({ item_status: 'PURCHASED' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.item_status).toBe('PURCHASED');
        });

        test('should update item status to OPTIONAL', async () => {
            const response = await request(app)
                .put(`/api/v1/items/${groupItemId}/status`)
                .set('Authorization', `Bearer ${member1Tokens.access_token}`)
                .send({ item_status: 'OPTIONAL' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.item_status).toBe('OPTIONAL');
        });

        test('should update item status back to NEEDED', async () => {
            const response = await request(app)
                .put(`/api/v1/items/${personalItemId}/status`)
                .set('Authorization', `Bearer ${userTokens.access_token}`)
                .send({ item_status: 'NEEDED' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.item_status).toBe('NEEDED');
        });

        test('should reject invalid status value', async () => {
            const response = await request(app)
                .put(`/api/v1/items/${personalItemId}/status`)
                .set('Authorization', `Bearer ${userTokens.access_token}`)
                .send({ item_status: 'INVALID_STATUS' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errorMessage).toContain('Invalid status');
        });

        test('should reject status update without permission', async () => {
            const response = await request(app)
                .put(`/api/v1/items/${personalItemId}/status`)
                .set('Authorization', `Bearer ${member1Tokens.access_token}`)
                .send({ item_status: 'PURCHASED' })
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        test('should reject missing status field', async () => {
            const response = await request(app)
                .put(`/api/v1/items/${personalItemId}/status`)
                .set('Authorization', `Bearer ${userTokens.access_token}`)
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/v1/items/:id', () => {
        let itemToDeleteId;

        beforeEach(async () => {
            // Create a new item for deletion test
            const newItemResponse = await request(app)
                .post(`/api/v1/users/${userId}/list/items`)
                .set('Authorization', `Bearer ${userTokens.access_token}`)
                .send({
                    item_name: 'Item to Delete',
                    item_price: 1.99,
                    item_quantity: 1
                })
                .expect(200);

            itemToDeleteId = newItemResponse.body.data.id;
        });

        test('should delete personal item successfully', async () => {
            const response = await request(app)
                .delete(`/api/v1/items/${itemToDeleteId}`)
                .set('Authorization', `Bearer ${userTokens.access_token}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify item is deleted
            await request(app)
                .get(`/api/v1/items/${itemToDeleteId}`)
                .set('Authorization', `Bearer ${userTokens.access_token}`)
                .expect(404);
        });

        test('should delete group item by any member', async () => {
            // Create group item first
            const groupItemResponse = await request(app)
                .post(`/api/v1/groups/${groupId}/list/items`)
                .set('Authorization', `Bearer ${member2Tokens.access_token}`)
                .send({
                    item_name: 'Group Item to Delete',
                    item_quantity: 1
                })
                .expect(200);

            const groupItemToDeleteId = groupItemResponse.body.data.id;

            // Delete by different member
            const response = await request(app)
                .delete(`/api/v1/items/${groupItemToDeleteId}`)
                .set('Authorization', `Bearer ${member1Tokens.access_token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        test('should reject deletion without permission', async () => {
            const response = await request(app)
                .delete(`/api/v1/items/${personalItemId}`)
                .set('Authorization', `Bearer ${member1Tokens.access_token}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        test('should reject deletion of non-existent item', async () => {
            const response = await request(app)
                .delete('/api/v1/items/999999')
                .set('Authorization', `Bearer ${userTokens.access_token}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        test('should reject deletion without authorization', async () => {
            const response = await request(app)
                .delete(`/api/v1/items/${personalItemId}`)
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
                    { email: { contains: 'itemtest' } },
                    { email: { contains: 'itemgroupmember' } },
                    { email: { contains: 'itemnonmember' } }
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
});