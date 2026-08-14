import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DocumentSummary, DocumentUploadTicket } from '@dealroom/shared';
import { CurrentUser, RequestUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import {
  CreateDocumentDto,
  RenameDocumentDto,
  RequestUploadDto,
} from './dto/document.dto';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser): Promise<DocumentSummary[]> {
    return this.documents.list(user.id);
  }

  @Post('upload-ticket')
  requestUpload(
    @CurrentUser() user: RequestUser,
    @Body() dto: RequestUploadDto,
  ): Promise<DocumentUploadTicket> {
    return this.documents.requestUpload(user.id, dto);
  }

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateDocumentDto,
  ): Promise<DocumentSummary> {
    return this.documents.create(user.id, dto);
  }

  @Patch(':id')
  rename(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: RenameDocumentDto,
  ): Promise<DocumentSummary> {
    return this.documents.rename(user.id, id, dto);
  }

  @Get(':id/download')
  async download(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<{ url: string }> {
    return { url: await this.documents.downloadUrl(user.id, id) };
  }

  @Delete(':id')
  @HttpCode(204)
  archive(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.documents.archive(user.id, id);
  }
}
