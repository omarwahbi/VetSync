"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateOwnerDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_owner_dto_1 = require("./create-owner.dto");
class UpdateOwnerDto extends (0, mapped_types_1.PartialType)(create_owner_dto_1.CreateOwnerDto) {
}
exports.UpdateOwnerDto = UpdateOwnerDto;
//# sourceMappingURL=update-owner.dto.js.map