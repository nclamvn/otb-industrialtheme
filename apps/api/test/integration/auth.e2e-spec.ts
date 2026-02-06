import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

/**
 * Auth API Integration Tests
 * Tests the complete authentication flow against a test database
 */

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  // Test user data
  const testUser = {
    email: 'test@dafc.com',
    password: 'Test@Password123',
    name: 'Test User',
    role: 'ADMIN',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    beforeAll(async () => {
      // Create test user
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      await prisma.user.upsert({
        where: { email: testUser.email },
        update: {},
        create: {
          email: testUser.email,
          password: hashedPassword,
          name: testUser.name,
          role: testUser.role as any,
          status: 'ACTIVE',
        },
      });
    });

    afterAll(async () => {
      // Cleanup
      await prisma.user.deleteMany({
        where: { email: testUser.email },
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');

      // Verify token is valid JWT
      const decoded = jwtService.verify(response.body.accessToken);
      expect(decoded).toHaveProperty('sub');
      expect(decoded.email).toBe(testUser.email);
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@dafc.com',
          password: testUser.password,
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 400 for missing email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: testUser.password,
        })
        .expect(400);
    });

    it('should return 400 for missing password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
        })
        .expect(400);
    });

    it('should return 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'not-an-email',
          password: testUser.password,
        })
        .expect(400);
    });
  });

  describe('GET /auth/profile', () => {
    let accessToken: string;
    let userId: string;

    beforeAll(async () => {
      // Create user and get token
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      const user = await prisma.user.upsert({
        where: { email: testUser.email },
        update: {},
        create: {
          email: testUser.email,
          password: hashedPassword,
          name: testUser.name,
          role: testUser.role as any,
          status: 'ACTIVE',
        },
      });
      userId = user.id;

      accessToken = jwtService.sign({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    });

    afterAll(async () => {
      await prisma.user.deleteMany({
        where: { email: testUser.email },
      });
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.email).toBe(testUser.email);
      expect(response.body.name).toBe(testUser.name);
      expect(response.body.role).toBe(testUser.role);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 401 with expired token', async () => {
      const expiredToken = jwtService.sign(
        { sub: userId, email: testUser.email, role: testUser.role },
        { expiresIn: '-1h' },
      );

      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    let accessToken: string;

    beforeAll(async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      const user = await prisma.user.upsert({
        where: { email: testUser.email },
        update: {},
        create: {
          email: testUser.email,
          password: hashedPassword,
          name: testUser.name,
          role: testUser.role as any,
          status: 'ACTIVE',
        },
      });

      accessToken = jwtService.sign({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    });

    afterAll(async () => {
      await prisma.user.deleteMany({
        where: { email: testUser.email },
      });
    });

    it('should return current user from token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.email).toBe(testUser.email);
      expect(response.body.role).toBe(testUser.role);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });
  });
});
