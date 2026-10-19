import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DocumentsService } from './documents.service.js';
import { EmployeeDocument } from '../common/types.js';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'List documents, optionally by employeeId' })
  findAll(@Query('employeeId') employeeId?: string) {
    return this.documentsService.findAll(employeeId);
  }

  @Post()
  @ApiOperation({ summary: 'Upload document metadata' })
  create(@Body() body: Partial<EmployeeDocument>) {
    return this.documentsService.create(body);
  }

  @Put(':id/verify')
  @ApiOperation({ summary: 'Verify or reject uploaded document' })
  verify(
    @Param('id') id: string,
    @Body() body: { status: 'Verified' | 'Rejected'; verifiedBy?: string },
  ) {
    return this.documentsService.verify(id, body.status, body.verifiedBy);
  }
}
