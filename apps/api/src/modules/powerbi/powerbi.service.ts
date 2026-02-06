import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PowerBIReportType,
  EmbedTokenRequestDto,
  CreatePowerBIReportDto,
  UpdatePowerBIReportDto,
  EmbedTokenResponseDto,
  PowerBIConfigDto,
} from './dto/powerbi.dto';

// Power BI REST API types
interface PowerBITokenResponse {
  token: string;
  tokenId: string;
  expiration: string;
}

interface PowerBIEmbedInfo {
  embedUrl: string;
  embedToken: PowerBITokenResponse;
}

@Injectable()
export class PowerBIService {
  private readonly logger = new Logger(PowerBIService.name);
  private readonly tenantId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly defaultGroupId: string;
  private accessToken: string | null = null;
  private tokenExpiration: Date | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.tenantId = this.configService.get<string>('POWERBI_TENANT_ID', '');
    this.clientId = this.configService.get<string>('POWERBI_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>('POWERBI_CLIENT_SECRET', '');
    this.defaultGroupId = this.configService.get<string>('POWERBI_GROUP_ID', '');
  }

  /**
   * Check if Power BI is configured
   */
  isConfigured(): boolean {
    return !!(this.tenantId && this.clientId && this.clientSecret);
  }

  /**
   * Get Power BI configuration status
   */
  getConfig(): PowerBIConfigDto {
    return {
      isConfigured: this.isConfigured(),
      tenantId: this.tenantId ? `${this.tenantId.substring(0, 8)}...` : undefined,
      clientId: this.clientId ? `${this.clientId.substring(0, 8)}...` : undefined,
      availableReportTypes: Object.values(PowerBIReportType),
    };
  }

  /**
   * Get Azure AD access token for Power BI API
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiration && new Date() < this.tokenExpiration) {
      return this.accessToken;
    }

    if (!this.isConfigured()) {
      throw new BadRequestException('Power BI is not configured. Please set POWERBI_TENANT_ID, POWERBI_CLIENT_ID, and POWERBI_CLIENT_SECRET environment variables.');
    }

    const tokenEndpoint = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
    const scope = 'https://analysis.windows.net/powerbi/api/.default';

    try {
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Failed to get Power BI access token: ${error}`);
        throw new BadRequestException('Failed to authenticate with Power BI');
      }

      const data = await response.json();
      this.accessToken = data.access_token as string;
      // Token expires in 1 hour, refresh 5 minutes early
      this.tokenExpiration = new Date(Date.now() + (data.expires_in - 300) * 1000);

      return this.accessToken;
    } catch (error) {
      this.logger.error('Power BI authentication error:', error);
      throw new BadRequestException('Failed to authenticate with Power BI');
    }
  }

  /**
   * Generate embed token for a report
   */
  async generateEmbedToken(
    dto: EmbedTokenRequestDto,
    userId: string,
  ): Promise<EmbedTokenResponseDto> {
    const accessToken = await this.getAccessToken();
    const groupId = dto.groupId || this.defaultGroupId;

    // Get report embed URL
    const reportUrl = `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${dto.reportId}`;

    try {
      const reportResponse = await fetch(reportUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!reportResponse.ok) {
        throw new NotFoundException('Power BI report not found');
      }

      const reportData = await reportResponse.json();

      // Generate embed token
      const generateTokenUrl = `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${dto.reportId}/GenerateToken`;

      const tokenBody: {
        accessLevel: string;
        allowSaveAs?: boolean;
        identities?: { username: string; roles: string[]; datasets: string[] }[];
      } = {
        accessLevel: 'View',
        allowSaveAs: false,
      };

      // Apply row-level security if roles are specified
      if (dto.roles && dto.roles.length > 0 && dto.datasetId) {
        tokenBody.identities = [
          {
            username: userId,
            roles: dto.roles,
            datasets: [dto.datasetId],
          },
        ];
      }

      const tokenResponse = await fetch(generateTokenUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tokenBody),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        this.logger.error(`Failed to generate embed token: ${error}`);
        throw new BadRequestException('Failed to generate embed token');
      }

      const tokenData: PowerBITokenResponse = await tokenResponse.json();

      // Log access for audit
      this.logger.log(`User ${userId} accessed Power BI report ${dto.reportId}`);

      return {
        token: tokenData.token,
        expiration: new Date(tokenData.expiration),
        embedUrl: reportData.embedUrl,
        reportId: dto.reportId,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Power BI embed token error:', error);
      throw new BadRequestException('Failed to generate Power BI embed token');
    }
  }

  /**
   * Get all registered Power BI reports
   */
  async findAllReports(options?: {
    type?: PowerBIReportType;
    isActive?: boolean;
  }) {
    const where: Record<string, unknown> = {};
    if (options?.type) where.type = options.type;
    if (options?.isActive !== undefined) where.isActive = options.isActive;

    // For now, return mock data since we don't have the PowerBIReport table in schema
    // In production, this would query from the database
    const mockReports = [
      {
        id: '1',
        name: 'Sales Dashboard',
        type: PowerBIReportType.SALES_DASHBOARD,
        powerbiReportId: 'mock-sales-report-id',
        powerbiGroupId: this.defaultGroupId,
        description: 'Overview of sales performance across all brands',
        isActive: true,
        thumbnail: null,
        defaultFilters: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Inventory Analytics',
        type: PowerBIReportType.INVENTORY_ANALYTICS,
        powerbiReportId: 'mock-inventory-report-id',
        powerbiGroupId: this.defaultGroupId,
        description: 'Detailed inventory analysis and stock levels',
        isActive: true,
        thumbnail: null,
        defaultFilters: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: 'OTB Overview',
        type: PowerBIReportType.OTB_OVERVIEW,
        powerbiReportId: 'mock-otb-report-id',
        powerbiGroupId: this.defaultGroupId,
        description: 'Open-to-Buy planning and execution overview',
        isActive: true,
        thumbnail: null,
        defaultFilters: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '4',
        name: 'KPI Scorecard',
        type: PowerBIReportType.KPI_SCORECARD,
        powerbiReportId: 'mock-kpi-report-id',
        powerbiGroupId: this.defaultGroupId,
        description: 'Fashion retail KPI scorecard with benchmarks',
        isActive: true,
        thumbnail: null,
        defaultFilters: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return mockReports.filter((r) => {
      if (options?.type && r.type !== options.type) return false;
      if (options?.isActive !== undefined && r.isActive !== options.isActive) return false;
      return true;
    });
  }

  /**
   * Get a specific report by ID
   */
  async findOneReport(id: string) {
    const reports = await this.findAllReports();
    const report = reports.find((r) => r.id === id);
    if (!report) {
      throw new NotFoundException('Power BI report not found');
    }
    return report;
  }

  /**
   * Create a new report registration
   */
  async createReport(dto: CreatePowerBIReportDto) {
    // In production, this would create a database record
    // For now, return mock created report
    return {
      id: `${Date.now()}`,
      ...dto,
      isActive: dto.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Update a report registration
   */
  async updateReport(id: string, dto: UpdatePowerBIReportDto) {
    const report = await this.findOneReport(id);
    // In production, this would update the database record
    return {
      ...report,
      ...dto,
      updatedAt: new Date(),
    };
  }

  /**
   * Delete a report registration
   */
  async deleteReport(id: string) {
    await this.findOneReport(id);
    // In production, this would delete from database
    return { deleted: true };
  }

  /**
   * List available reports from Power BI workspace
   */
  async listWorkspaceReports(groupId?: string) {
    const accessToken = await this.getAccessToken();
    const targetGroupId = groupId || this.defaultGroupId;

    const url = `https://api.powerbi.com/v1.0/myorg/groups/${targetGroupId}/reports`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new BadRequestException('Failed to list Power BI workspace reports');
      }

      const data = await response.json();
      return data.value || [];
    } catch (error) {
      this.logger.error('Failed to list workspace reports:', error);
      throw new BadRequestException('Failed to list Power BI workspace reports');
    }
  }

  /**
   * Refresh a Power BI dataset
   */
  async refreshDataset(datasetId: string, groupId?: string) {
    const accessToken = await this.getAccessToken();
    const targetGroupId = groupId || this.defaultGroupId;

    const url = `https://api.powerbi.com/v1.0/myorg/groups/${targetGroupId}/datasets/${datasetId}/refreshes`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new BadRequestException(`Failed to refresh dataset: ${error}`);
      }

      return { success: true, message: 'Dataset refresh initiated' };
    } catch (error) {
      this.logger.error('Failed to refresh dataset:', error);
      throw new BadRequestException('Failed to refresh Power BI dataset');
    }
  }
}
