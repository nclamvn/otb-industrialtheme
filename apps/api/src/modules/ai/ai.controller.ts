import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // ============================================
  // Chat Conversations
  // ============================================

  @Get('conversations')
  @ApiOperation({ summary: 'Get all AI conversations for current user' })
  getConversations(@CurrentUser() user: CurrentUserPayload) {
    return this.aiService.getConversations(user.id);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a specific conversation with messages' })
  getConversation(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.aiService.getConversation(id, user.id);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation' })
  createConversation(
    @Body() data: { title?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.aiService.createConversation(user.id, data.title);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Add a message to conversation' })
  addMessage(
    @Param('id') id: string,
    @Body() data: { role: 'USER' | 'ASSISTANT'; content: string },
  ) {
    return this.aiService.addMessage(id, data.role, data.content);
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Delete a conversation' })
  deleteConversation(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.aiService.deleteConversation(id, user.id);
  }

  // ============================================
  // AI Suggestions
  // ============================================

  @Get('suggestions')
  @ApiOperation({ summary: 'Get AI suggestions for current user' })
  getSuggestions(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: any,
  ) {
    return this.aiService.getSuggestions(user.id, query);
  }

  @Patch('suggestions/:id/status')
  @ApiOperation({ summary: 'Update suggestion status (accept/reject)' })
  updateSuggestionStatus(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() data: { status: string; reviewNotes?: string },
  ) {
    return this.aiService.updateSuggestionStatus(id, user.id, data.status, data.reviewNotes);
  }

  // ============================================
  // AI Generated Plans
  // ============================================

  @Get('generated-plans')
  @ApiOperation({ summary: 'Get AI generated plans for current user' })
  getGeneratedPlans(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: any,
  ) {
    return this.aiService.getGeneratedPlans(user.id, query);
  }

  // ============================================
  // Predictive Alerts
  // ============================================

  @Get('predictive-alerts')
  @ApiOperation({ summary: 'Get predictive alerts' })
  getPredictiveAlerts(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: any,
  ) {
    return this.aiService.getPredictiveAlerts(user.id, query);
  }

  @Patch('predictive-alerts/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge a predictive alert' })
  acknowledgePredictiveAlert(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.aiService.acknowledgePredictiveAlert(id, user.id);
  }

  // ============================================
  // Dashboard Summary
  // ============================================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get AI dashboard summary' })
  getDashboardSummary(@CurrentUser() user: CurrentUserPayload) {
    return this.aiService.getDashboardSummary(user.id);
  }
}
