import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Sse,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Observable, Subject } from 'rxjs';
import { AICopilotService } from './ai-copilot.service';
import { ChatRequestDto, ChatResponseDto, InsightsResponseDto, RefreshInsightsDto } from './dto';
import { RateLimitGuard } from './guards/rate-limit.guard';

interface MessageEvent {
  data: string;
}

@ApiTags('AI Copilot')
@Controller('ai-copilot')
@UseGuards(RateLimitGuard)
export class AICopilotController {
  constructor(private readonly aiService: AICopilotService) {}

  @Post('chat')
  @Sse()
  @ApiOperation({ summary: 'Stream chat with AI Copilot' })
  @ApiResponse({ status: 200, description: 'Streaming response' })
  async chatStream(@Body() dto: ChatRequestDto): Promise<Observable<MessageEvent>> {
    const subject = new Subject<MessageEvent>();

    // Start streaming in background
    (async () => {
      try {
        let fullContent = '';

        for await (const chunk of this.aiService.streamChat(
          dto.messages,
          dto.context?.planId,
        )) {
          if (chunk.type === 'content' && chunk.content) {
            fullContent += chunk.content;
            subject.next({ data: JSON.stringify(chunk) });
          } else if (chunk.type === 'done') {
            subject.next({ data: JSON.stringify({ type: 'done', content: fullContent }) });
            subject.complete();
          } else if (chunk.type === 'error') {
            subject.next({ data: JSON.stringify(chunk) });
            subject.complete();
          }
        }
      } catch (error) {
        subject.next({
          data: JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        });
        subject.complete();
      }
    })();

    return subject.asObservable();
  }

  @Post('chat/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Non-streaming chat with AI Copilot' })
  @ApiResponse({ status: 200, type: ChatResponseDto })
  async chatSync(@Body() dto: ChatRequestDto): Promise<ChatResponseDto> {
    const response = await this.aiService.chat(
      dto.messages,
      dto.context?.planId,
    );

    return {
      content: response.content,
      model: response.model,
      conversationId: dto.conversationId,
      usage: response.usage,
    };
  }

  @Get('insights/:otbPlanId')
  @ApiOperation({ summary: 'Get AI insights for OTB plan' })
  @ApiResponse({ status: 200, type: InsightsResponseDto })
  async getInsights(
    @Param('otbPlanId') otbPlanId: string,
    @Query('type') type?: 'full' | 'quick',
  ): Promise<InsightsResponseDto> {
    const insights = await this.aiService.generateInsights(
      otbPlanId,
      type || 'quick',
    );

    return {
      insights,
      generatedAt: new Date().toISOString(),
      planId: otbPlanId,
    };
  }

  @Post('insights/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh AI insights for OTB plan' })
  @ApiResponse({ status: 200, type: InsightsResponseDto })
  async refreshInsights(@Body() dto: RefreshInsightsDto): Promise<InsightsResponseDto> {
    const insights = await this.aiService.generateInsights(
      dto.otbPlanId,
      dto.type || 'full',
    );

    return {
      insights,
      generatedAt: new Date().toISOString(),
      planId: dto.otbPlanId,
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get AI provider status' })
  async getStatus() {
    const status = await this.aiService.getProvidersStatus();
    return {
      providers: status,
      timestamp: new Date().toISOString(),
    };
  }
}
