import { Test, TestingModule } from '@nestjs/testing';
import { AICopilotService } from '../ai-copilot.service';
import { PrismaService } from '../../../prisma/prisma.service';

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

describe('AICopilotService', () => {
  let service: AICopilotService;

  const mockPrismaService = {
    oTBPlan: {
      findUnique: jest.fn(),
    },
    aIMessage: {
      createMany: jest.fn(),
    },
    aIConversation: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AICopilotService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AICopilotService>(AICopilotService);
    service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(service.chat).toBeDefined();
      expect(service.streamChat).toBeDefined();
      expect(service.generateInsights).toBeDefined();
      expect(service.getProvidersStatus).toBeDefined();
      expect(service.saveConversation).toBeDefined();
    });
  });

  describe('getProvidersStatus', () => {
    it('should return providers status array', async () => {
      const status = await service.getProvidersStatus();

      expect(Array.isArray(status)).toBe(true);
      expect(status.length).toBeGreaterThan(0);
      status.forEach((provider: { name: string; available: boolean }) => {
        expect(provider).toHaveProperty('name');
        expect(provider).toHaveProperty('available');
      });
    });
  });

  describe('generateInsights', () => {
    it('should return empty array when plan not found', async () => {
      mockPrismaService.oTBPlan.findUnique.mockResolvedValue(null);

      const insights = await service.generateInsights('non-existent');

      expect(insights).toEqual([]);
    });
  });

  describe('saveConversation', () => {
    it('should create new conversation', async () => {
      const mockConversation = {
        id: 'conv-1',
        userId: 'user-1',
        title: 'Test conversation',
      };

      mockPrismaService.aIConversation.create.mockResolvedValue(mockConversation);

      const messages = [
        { role: 'user' as const, content: 'Hello AI' },
      ];

      const conversationId = await service.saveConversation(
        'user-1',
        messages,
        'Hi there!'
      );

      expect(conversationId).toBe('conv-1');
      expect(mockPrismaService.aIConversation.create).toHaveBeenCalled();
    });

    it('should add to existing conversation', async () => {
      mockPrismaService.aIMessage.createMany.mockResolvedValue({ count: 2 });

      const messages = [
        { role: 'user' as const, content: 'Follow up question' },
      ];

      const conversationId = await service.saveConversation(
        'user-1',
        messages,
        'Here is the answer',
        'existing-conv-id'
      );

      expect(conversationId).toBe('existing-conv-id');
      expect(mockPrismaService.aIMessage.createMany).toHaveBeenCalled();
    });
  });

  describe('streamChat', () => {
    it('should return async iterable', () => {
      const messages = [{ role: 'user' as const, content: 'Hello' }];
      const stream = service.streamChat(messages);

      expect(stream).toBeDefined();
      expect(typeof stream[Symbol.asyncIterator]).toBe('function');
    });
  });
});
