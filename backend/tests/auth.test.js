import request from 'supertest';
import prisma from '../config/prisma.js';

const app = `http://localhost:${process.env.PORT}`;
// Test data
const testUser = {
    email: `usertest1-${Date.now()}@example.com`, // Unique email for each test run
    password: 'TestPassword123!',
    first_name: 'Test',
    last_name: 'User'
};

const testUser2 = {
    email: `usertest2-${Date.now()}@example.com`,
    password: 'TestPassword456!',
    first_name: 'Test2',
    last_name: 'User2'
};

// Store tokens and user data between tests
let authTokens = {};
let refreshTokens = {};
let userIds = [];

describe('Server Connection', () => {
    test('should connect to server', async () => {
        const response = await request(app)
            .get('/api/v1/auth/me') // This should return 401 but prove connection works
            .expect(401);
        
        console.log('Connection test passed');
    });
});

describe('Auth Endpoints', () => {
    // Cleanup before tests start
    beforeAll(async () => {
        // Clean up any existing test users
        await prisma.users.deleteMany({
            where: {
                email: {
                    contains: 'test'
                }
            }
        });
    });

    describe('POST /api/v1/auth/signup', () => {
        test('should create new user successfully with valid data', async () => {
            const response = await request(app)
                .post('/api/v1/auth/signup')
                .send(testUser)

            console.log('Response status:', response.status);
            console.log('Response body:', response.body);
            expect(response.status).toBe(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(testUser.email);
            expect(response.body.data.user.first_name).toBe(testUser.first_name);
            expect(response.body.data.user.last_name).toBe(testUser.last_name);
            expect(response.body.data.user.user_code).toMatch(/^[A-Z0-9]{7}$/);
            expect(response.body.data.user.id).toBeDefined();
            
            // Check tokens
            expect(response.body.data.tokens.access_token).toBeDefined();
            expect(response.body.data.tokens.refresh_token).toBeDefined();
            expect(response.body.data.tokens.expires_in).toBe(3600);
            expect(response.body.data.tokens.expires_at).toBeDefined();

            // Store for other tests
            authTokens.user1 = response.body.data.tokens.access_token;
            refreshTokens.user1 = response.body.data.tokens.refresh_token;
            userIds.push(response.body.data.user.id);
        });

        test('should reject duplicate email registration', async () => {
            const response = await request(app)
                .post('/api/v1/auth/signup')
                .send(testUser) // Same email as previous test
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.errorMessage).toContain('already registered');
        });

        test('should reject missing required fields', async () => {
            const response = await request(app)
                .post('/api/v1/auth/signup')
                .send({
                    email: 'incomplete@test.com',
                    password: 'password123'
                    // Missing firstName and lastName
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errorMessage).toContain('Missing required field');
        });

        test('should reject invalid email format', async () => {
            const response = await request(app)
                .post('/api/v1/auth/signup')
                .send({
                    email: 'invalid-email',
                    password: 'password123',
                    first_name: 'Test',
                    last_name: 'User'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should reject weak password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/signup')
                .send({
                    email: 'weakpass@test.com',
                    password: '123', // Too weak
                    first_name: 'Test',
                    last_name: 'User'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/auth/signin', () => {
        test('should login successfully with valid credentials', async () => {
            const response = await request(app)
                .post('/api/v1/auth/signin')
                .send({
                    email: testUser.email,
                    password: testUser.password
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(testUser.email);
            expect(response.body.data.tokens.access_token).toBeDefined();
            expect(response.body.data.tokens.refresh_token).toBeDefined();

            // Update stored tokens
            authTokens.user1 = response.body.data.tokens.access_token;
            refreshTokens.user1 = response.body.data.tokens.refresh_token;
        });

        test('should reject invalid email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/signin')
                .send({
                    email: 'nonexistent@test.com',
                    password: testUser.password
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.errorMessage).toContain('Invalid');
        });

        test('should reject invalid password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/signin')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.errorMessage).toContain('Invalid');
        });

        test('should reject missing fields', async () => {
            const response = await request(app)
                .post('/api/v1/auth/signin')
                .send({
                    email: testUser.email
                    // Missing password
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/auth/me', () => {
        test('should get user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${authTokens.user1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe(testUser.email);
            expect(response.body.data.first_name).toBe(testUser.first_name);
            expect(response.body.data.last_name).toBe(testUser.last_name);
            expect(response.body.data.user_code).toMatch(/^[A-Z0-9]{7}$/);
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.created_at).toBeDefined();
            expect(response.body.data.updated_at).toBeDefined();
        });

        test('should reject request without authorization header', async () => {
            const response = await request(app)
                .get('/api/v1/auth/me')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.errorMessage).toContain('Authorization header required');
        });

        test('should reject request with invalid token format', async () => {
            const response = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', 'InvalidToken')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.errorMessage).toContain('Invalid authorization format');
        });

        test('should reject request with invalid token', async () => {
            const response = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', 'Bearer invalid.token.here')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.errorMessage).toContain('Invalid');
        });
    });

    describe('POST /api/v1/auth/refresh', () => {
        test('should refresh token with valid refresh token', async () => {
            const response = await request(app)
                .post('/api/v1/auth/refresh')
                .set('Authorization', `Bearer ${authTokens.user1}`)
                .send({
                    refresh_token: refreshTokens.user1
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.access_token).toBeDefined();
            expect(response.body.data.refresh_token).toBeDefined();
            expect(response.body.data.access_token).not.toBe(authTokens.user1); // Should be new token

            // Update stored tokens
            authTokens.user1 = response.body.data.access_token;
            refreshTokens.user1 = response.body.data.refresh_token;
        });

        test('should reject refresh without auth middleware', async () => {
            const response = await request(app)
                .post('/api/v1/auth/refresh')
                .send({
                    refresh_token: refreshTokens.user1
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('should reject refresh without refresh token', async () => {
            const response = await request(app)
                .post('/api/v1/auth/refresh')
                .set('Authorization', `Bearer ${authTokens.user1}`)
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errorMessage).toContain('required');
        });

        test('should reject invalid refresh token', async () => {
            const response = await request(app)
                .post('/api/v1/auth/refresh')
                .set('Authorization', `Bearer ${authTokens.user1}`)
                .send({
                    refresh_token: 'invalid_refresh_token'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/auth/signout', () => {
        // Create a second user for signout testing
        beforeAll(async () => {
            const response = await request(app)
                .post('/api/v1/auth/signup')
                .send(testUser2)
                .expect(201);

            authTokens.user2 = response.body.data.tokens.access_token;
            userIds.push(response.body.data.user.id);
        });

        test('should signout successfully with valid token', async () => {
            const response = await request(app)
                .post('/api/v1/auth/signout')
                .set('Authorization', `Bearer ${authTokens.user2}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeNull();
            expect(response.body.successMessage).toContain('Signed out successfully');
        });

        test('should reject signout without authorization', async () => {
            const response = await request(app)
                .post('/api/v1/auth/signout')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('should reject signout with invalid token', async () => {
            const response = await request(app)
                .post('/api/v1/auth/signout')
                .set('Authorization', 'Bearer invalid.token')
                .expect(401);

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
            }
        }
        
        await prisma.$disconnect();
    });
});