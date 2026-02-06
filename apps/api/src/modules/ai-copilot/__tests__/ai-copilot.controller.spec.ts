import { Test, TestingModule } from '@nestjs/testing';
import { AICopilotController } from '../ai-copilot.controller';
import { AICopilotService } from '../ai-copilot.service';
import { ChatMessage } from '@dafc/excelai-ai';

describe('AICopilotController', () => {
  let controller: AICopilotController;
  let service: AICopilotService;

  const mockService = {
    chat: jest.fn(),
    streamChat: jest.fn(),
    generateInsights: jest.fn(),
    getProvidersStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AICopilotController],
      providers: [
        {
          provide: AICopilotService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AICopilotController>(AICopilotController);
    service = module.get<AICopilotService>(AICopilotService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStatus', () => {
    it('should return providers status with timestamp', async () => {
      const mockStatus = [
        { name: 'openai', available: true },
        { name: 'anthropic', available: true },
      ];

      mockService.getProvidersStatus.mockResolvedValue(mockStatus);

      const result = await controller.getStatus();

      expect(result).toHaveProperty('providers');
      expect(result).toHaveProperty('timestamp');
      expect(result.providers).toEqual(mockStatus);
      expect(mockService.getProvidersStatus).toHaveBeenCalled();
    });
  });

  describe('chatSync', () => {
    it('should return chat response', async () => {
      const mockResponse = {
        role: 'assistant',
        content: 'Here is the analysis...',
        model: 'gpt-4o-mini',
      };

      mockService.chat.mockResolvedValue(mockResponse);

      const dto = {
        messages: [{ role: 'user' as const, content: 'Analyze the budget' }],
      };

      const result = await controller.chatSync(dto);

      expect(result).toHaveProperty('content', mockResponse.content);
      expect(result).toHaveProperty('model', mockResponse.model);
      expect(mockService.chat).toHaveBeenCalledWith(dto.messages, undefined);
    });

    it('should pass planId when provided in context', async () => {
      const mockResponse = {
        role: 'assistant',
        content: 'Budget analysis...',
        model: 'gpt-4o-mini',
      };

      mockService.chat.mockResolvedValue(mockResponse);

      const dto = {
        messages: [{ role: 'user' as const, content: 'What is the margin?' }],
        context: { planId: 'plan-123' },
      };

      await controller.chatSync(dto);

      expect(mockService.chat).toHaveBeenCalledWith(dto.messages, 'plan-123');
    });
  });

  describe('getInsights', () => {
    it('should return insights response', async () => {
      const mockInsights = [
        {
          type: 'anomaly',
          severity: 'high',
          title: 'Budget Variance',
          description: 'Budget exceeded by 15%',
        },
        {
          type: 'opportunity',
          severity: 'medium',
          title: 'Growth Area',
          description: 'Category X showing strong sales',
        },
      ];

      mockService.generateInsights.mockResolvedValue(mockInsights);

      const result = await controller.getInsights('plan-123');

      expect(result).toHaveProperty('insights', mockInsights);
      expect(result).toHaveProperty('generatedAt');
      expect(result).toHaveProperty('planId', 'plan-123');
      expect(mockService.generateInsights).toHaveBeenCalledWith('plan-123', 'quick');
    });

    it('should support full insight type', async () => {
      const mockInsights = [
        {
          type: 'info',
          severity: 'low',
          title: 'Detailed Analysis',
          description: 'Full breakdown of metrics',
        },
      ];

      mockService.generateInsights.mockResolvedValue(mockInsights);

      const result = await controller.getInsights('plan-123', 'full');

      expect(mockService.generateInsights).toHaveBeenCalledWith('plan-123', 'full');
    });

    it('should return empty insights for plan with no data', async () => {
      mockService.generateInsights.mockResolvedValue([]);

      const result = await controller.getInsights('plan-empty');

      expect(result.insights).toEqual([]);
    });
  });

  describe('refreshInsights', () => {
    it('should refresh and return updated insights', async () => {
      const mockInsights = [
        {
          type: 'info',
          severity: 'low',
          title: 'On Track',
          description: 'All metrics within targets',
        },
      ];

      mockService.generateInsights.mockResolvedValue(mockInsights);

      const dto = {
        otbPlanId: 'plan-123',
        type: 'full' as const,
      };

      const result = await controller.refreshInsights(dto);

      expect(result).toHaveProperty('insights', mockInsights);
      expect(result).toHaveProperty('generatedAt');
      expect(result).toHaveProperty('planId', 'plan-123');
      expect(mockService.generateInsights).toHaveBeenCalledWith('plan-123', 'full');
    });

    it('should default to full type when not specified', async () => {
      mockService.generateInsights.mockResolvedValue([]);

      const dto = {
        otbPlanId: 'plan-123',
      };

      await controller.refreshInsights(dto);

      expect(mockService.generateInsights).toHaveBeenCalledWith('plan-123', 'full');
    });
  });

  describe('chatStream', () => {
    it('should return observable for SSE streaming', async () => {
      const mockChunks = [
        { type: 'content', content: 'Hello' },
        { type: 'content', content: ' world' },
        { type: 'done', content: 'Hello world' },
      ];

      mockService.streamChat.mockReturnValue(
        (async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        })()
      );

      const dto = {
        messages: [{ role: 'user' as const, content: 'Say hello' }],
      };

      const result = await controller.chatStream(dto);

      expect(result).toBeDefined();
      expect(typeof result.subscribe).toBe('function');
    });
  });
});
