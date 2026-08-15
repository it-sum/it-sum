import { Controller, Get, Headers, Param, Query, Res } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { ResourceListQuerySchema, StreamTokenResponseSchema } from "@it-sum/shared";
import type { Response } from "express";
import { CurrentUser, Public } from "../auth/auth.decorators.js";
import type { AuthUser } from "../auth/auth.types.js";
import { ResourcesService } from "./resources.service.js";
import { StreamProxyService } from "./stream-proxy.service.js";

class ResourceListQueryDto extends createZodDto(ResourceListQuerySchema) {}

@ApiTags("resources")
@Controller("resources")
export class ResourcesController {
  constructor(
    private readonly resources: ResourcesService,
    private readonly streamProxy: StreamProxyService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List published resources for the current university" })
  list(@CurrentUser() user: AuthUser, @Query() query: ResourceListQueryDto) {
    return this.resources.list(user, query);
  }

  @Get(":id/stream-token")
  @ApiOperation({ summary: "Issue a short-lived token for PDF streaming" })
  issueStreamToken(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return StreamTokenResponseSchema.parse(this.resources.issueStreamToken(id, user));
  }

  @Public()
  @Get(":id/stream")
  @ApiOperation({ summary: "Stream a published PDF through the API" })
  @ApiQuery({ name: "token", required: true, type: String })
  async stream(
    @Param("id") id: string,
    @Query("token") token: string,
    @Headers("range") range: string | undefined,
    @Headers("if-none-match") ifNoneMatch: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    await this.streamProxy.send(id, token, range, ifNoneMatch, response);
  }
}
