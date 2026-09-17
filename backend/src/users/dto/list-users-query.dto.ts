import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { CursorPaginationQueryDto } from "../../common/pagination/cursor-pagination.dto.js";
import { UserRole } from "../../generated/prisma/enums.js";

export class ListUsersQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ enum: UserRole, enumName: "UserRole" })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
