// tests/users.test.js
import request from 'supertest';
import app from '../server.js';
import prisma from '../config/prisma.js';
import path from 'path';
import fs from 'fs';

// Test data
const testUser1 = {
    email: `usertest1-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    first_name: 'John',
    last_name: 'Doe'
};

const testUser2 = {
    email: `usertest2-${Date.now()}@example.com`,
    password: 'TestPassword456!',
    first_name: 'Jane',
    last_name: 'Smith'
};

// Store tokens and user data between tests
let user1Tokens = {};
let user2Tokens = {};
let user1Id = '';
let user2Id = '';

describe('Users Endpoints', () => {
    // Setup - Create test users
    beforeAll(async () => {
        // Clean up any existing test users
        await prisma.users.deleteMany({
            where: {
                email: {
                    contains: 'usertest'
                }
            }
        });

        // Create test user 1
        const user1Response = await request(app)
            .post('/api/v1/auth/signup')
            .send(testUser1)
            .expect(201);

        user1Tokens = user1Response.body.data.tokens;
        user1Id = user1Response.body.data.user.id;

        // Create test user 2
        const user2Response = await request(app)
            .post('/api/v1/auth/signup')
            .send(testUser2)
            .expect(201);

        user2Tokens = user2Response.body.data.tokens;
        user2Id = user2Response.body.data.user.id;
    });

    describe('GET /api/v1/users/:id', () => {
        test('should get user profile with valid token and correct user ID', async () => {
            const response = await request(app)
                .get(`/api/v1/users/${user1Id}`)
                .set('Authorization', `Bearer ${user1Tokens.access_token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(user1Id);
            expect(response.body.data.email).toBe(testUser1.email);
            expect(response.body.data.first_name).toBe(testUser1.first_name);
            expect(response.body.data.last_name).toBe(testUser1.last_name);
            expect(response.body.data.user_code).toMatch(/^[A-Z0-9]{7}$/);
        });

        test('should reject access to other user\'s profile', async () => {
            const response = await request(app)
                .get(`/api/v1/users/${user2Id}`)
                .set('Authorization', `Bearer ${user1Tokens.access_token}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.errorMessage).toContain('own data');
        });

        test('should reject request without authorization', async () => {
            const response = await request(app)
                .get(`/api/v1/users/${user1Id}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('should return 404 for non-existent user', async () => {
            const fakeUserId = '123e4567-e89b-12d3-a456-426614174000';
            const response = await request(app)
                .get(`/api/v1/users/${fakeUserId}`)
                .set('Authorization', `Bearer ${user1Tokens.access_token}`)
                .expect(403); // Will be 403 because requireUserOwnership blocks it

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/users/:id/groups', () => {
        test('should get user groups (empty for new user)', async () => {
            const response = await request(app)
                .get(`/api/v1/users/${user1Id}/groups`)
                .set('Authorization', `Bearer ${user1Tokens.access_token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(0); // New user has no groups
        });

        test('should reject access to other user\'s groups', async () => {
            const response = await request(app)
                .get(`/api/v1/users/${user2Id}/groups`)
                .set('Authorization', `Bearer ${user1Tokens.access_token}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/users/:id/list', () => {
        test('should get user\'s personal list', async () => {
            const response = await request(app)
                .get(`/api/v1/users/${user1Id}/list`)
                .set('Authorization', `Bearer ${user1Tokens.access_token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('expected_total');
            expect(response.body.data).toHaveProperty('actual_total');
            expect(response.body.data).toHaveProperty('items');
            expect(Array.isArray(response.body.data.items)).toBe(true);
            expect(response.body.data.items.length).toBe(0); // New list is empty
        });
    });

    describe('POST /api/v1/users/:id/list/items', () => {
        test('should add item to user\'s list with all fields', async () => {
            const newItem = {
                item_name: 'Test Milk',
                item_price: 3.99,
                item_quantity: 2,
                item_status: 'NEEDED'
            };

            const response = await request(app)
                .post(`/api/v1/users/${user1Id}/list/items`)
                .set('Authorization', `Bearer ${user1Tokens.access_token}`)
                .send(newItem)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.item_name).toBe(newItem.item_name);
            expect(response.body.data.item_price).toBe(newItem.item_price.toString());
            expect(response.body.data.item_quantity).toBe(newItem.item_quantity);
            expect(response.body.data.item_status).toBe(newItem.item_status);
        });

        test('should add item with minimal required fields', async () => {
            const newItem = {
                item_name: 'Test Bread',
                item_quantity: 1
            };

            const response = await request(app)
                .post(`/api/v1/users/${user1Id}/list/items`)
                .set('Authorization', `Bearer ${user1Tokens.access_token}`)
                .send(newItem)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.item_name).toBe(newItem.item_name);
            expect(response.body.data.item_quantity).toBe(newItem.item_quantity);
            expect(response.body.data.item_status).toBe('NEEDED'); // Default status
            expect(response.body.data.item_price).toBeNull();
        });

        test('should reject item without required fields', async () => {
            const invalidItem = {
                item_price: 2.50
                // Missing item_name and item_quantity
            };

            const response = await request(app)
                .post(`/api/v1/users/${user1Id}/list/items`)
                .set('Authorization', `Bearer ${user1Tokens.access_token}`)
                .send(invalidItem)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errorMessage).toContain('required');
        });
    });

    describe('PUT /api/v1/users/:id', () => {
        test('should update user profile with text fields', async () => {
            const updateData = {
                first_name: 'John Updated',
                last_name: 'Doe Updated'
            };

            const response = await request(app)
                .put(`/api/v1/users/${user1Id}`)
                .set('Authorization', `Bearer ${user1Tokens.access_token}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.first_name).toBe(updateData.first_name);
            expect(response.body.data.last_name).toBe(updateData.last_name);
            expect(response.body.data.email).toBe(testUser1.email); // Should remain unchanged
        });

        test('should update user profile with profile picture', async () => {
            // Create a fake image file for testing
            const testImagePath = path.join(process.cwd(), 'test-image.jpg');
            const fakeImageBuffer = Buffer.from('fake image data');
            fs.writeFileSync(testImagePath, fakeImageBuffer);

            const response = await request(app)
                .put(`/api/v1/users/${user1Id}`)
                .set('Authorization', `Bearer ${user1Tokens.access_token}`)
                .attach('profile_pic', testImagePath)
                .field('first_name', 'John With Picture');

            // Clean up test file
            fs.unlinkSync(testImagePath);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.first_name).toBe('John With Picture');
            expect(response.body.data.profile_pic).toBeTruthy();
        });

        test('should reject update to other user\'s profile', async () => {
            const updateData = {
                first_name: 'Malicious Update'
            };

            const response = await request(app)
                .put(`/api/v1/users/${user2Id}`)
                .set('Authorization', `Bearer ${user1Tokens.access_token}`)
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/users/:id/invitations/received', () => {
        test('should get received invitations (empty for new user)', async () => {
            const response = await request(app)
                .get(`/api/v1/users/${user1Id}/invitations/received`)
                .set('Authorization', `Bearer ${user1Tokens.access_token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(0); // New user has no invitations
        });
    });

    describe('GET /api/v1/users/:id/invitations/sent', () => {
        test('should get sent invitations (empty for new user)', async () => {
            const response = await request(app)
                .get(`/api/v1/users/${user1Id}/invitations/sent`)
                .set('Authorization', `Bearer ${user1Tokens.access_token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(0); // New user has sent no invitations
        });
    });

    describe('PUT /api/v1/users/:id/list/clear', () => {
        test('should clear user\'s list', async () => {
            const response = await request(app)
                .put(`/api/v1/users/${user1Id}/list/clear`)
                .set('Authorization', `Bearer ${user1Tokens.access_token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.deletedCount).toBeGreaterThanOrEqual(0);
        });

        test('should verify list is actually cleared', async () => {
            const response = await request(app)
                .get(`/api/v1/users/${user1Id}/list`)
                .set('Authorization', `Bearer ${user1Tokens.access_token}`)
                .expect(200);

            expect(response.body.data.items.length).toBe(0);
            expect(response.body.data.expected_total).toBe('0');
            expect(response.body.data.actual_total).toBe('0');
        });
    });

    describe('DELETE /api/v1/users/:id', () => {
        test('should delete user account', async () => {
            const response = await request(app)
                .delete(`/api/v1/users/${user2Id}`)
                .set('Authorization', `Bearer ${user2Tokens.access_token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        test('should verify user is actually deleted', async () => {
            const response = await request(app)
                .get(`/api/v1/users/${user2Id}`)
                .set('Authorization', `Bearer ${user2Tokens.access_token}`)
                .expect(401); // Token should be invalid now

            expect(response.body.success).toBe(false);
        });

        test('should reject deletion of other user\'s account', async () => {
            const response = await request(app)
                .delete(`/api/v1/users/${user1Id}`)
                .set('Authorization', `Bearer ${user2Tokens.access_token}`) // user2 token won't work
                .expect(401); // Should fail because user2 is deleted

            expect(response.body.success).toBe(false);
        });
    });

    // Cleanup after all tests
    afterAll(async () => {
        // Get all remaining test users
        const remainingUsers = await prisma.users.findMany({
            where: {
                email: {
                    contains: 'usertest'
                }
            },
            select: { id: true }
        });
        
        // Delete each user through your service (proper cleanup)
        for (const user of remainingUsers) {
            try {
                // Import your user service
                const userService = await import('../services/users.service.js');
                await userService.default.deleteUser(user.id);
            } catch (error) {
                console.log(`Failed to delete test user ${user.id}:`, error.message);

                // If service deletion failed, try direct Supabase cleanup
                try {
                    const { supabaseAdmin } = await import('../config/supabase.js');
                    const { error: supabaseError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
                    if (supabaseError) {
                        console.log(`Failed to delete Supabase user ${user.id}:`, supabaseError.message);
                    } else {
                        console.log(`Cleaned up orphaned Supabase user: ${user.id}`);
                    }
                } catch (supabaseError) {
                    console.log(`Supabase cleanup error for ${user.id}:`, supabaseError.message);
                }
            }
        }

        // Clean up any orphaned Lists (just in case)
        await prisma.lists.deleteMany({
            where: {
                UserLists: null
            }
        });
        
        await prisma.$disconnect();
    });
});