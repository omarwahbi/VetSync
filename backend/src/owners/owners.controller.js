"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnersController = void 0;
const common_1 = require("@nestjs/common");
const owners_service_1 = require("./owners.service");
const create_owner_dto_1 = require("./dto/create-owner.dto");
const update_owner_dto_1 = require("./dto/update-owner.dto");
const filter_owner_dto_1 = require("./dto/filter-owner.dto");
let OwnersController = class OwnersController {
    ownersService;
    constructor(ownersService) {
        this.ownersService = ownersService;
    }
    create(createOwnerDto, req) {
        return this.ownersService.create(createOwnerDto, req.user);
    }
    findAll(filterOwnerDto, req) {
        return this.ownersService.findAll(req.user, filterOwnerDto);
    }
    findOne(id, req) {
        return this.ownersService.findOne(id, req.user);
    }
    update(id, updateOwnerDto, req) {
        return this.ownersService.update(id, updateOwnerDto, req.user);
    }
    remove(id, req) {
        return this.ownersService.remove(id, req.user);
    }
};
exports.OwnersController = OwnersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_owner_dto_1.CreateOwnerDto, Object]),
    __metadata("design:returntype", void 0)
], OwnersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filter_owner_dto_1.FilterOwnerDto, Object]),
    __metadata("design:returntype", void 0)
], OwnersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OwnersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_owner_dto_1.UpdateOwnerDto, Object]),
    __metadata("design:returntype", void 0)
], OwnersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OwnersController.prototype, "remove", null);
exports.OwnersController = OwnersController = __decorate([
    (0, common_1.Controller)('owners'),
    __metadata("design:paramtypes", [owners_service_1.OwnersService])
], OwnersController);
//# sourceMappingURL=owners.controller.js.map