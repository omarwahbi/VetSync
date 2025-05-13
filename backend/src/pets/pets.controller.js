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
exports.PetsController = exports.PetsTopLevelController = void 0;
const common_1 = require("@nestjs/common");
const pets_service_1 = require("./pets.service");
const create_pet_dto_1 = require("./dto/create-pet.dto");
const update_pet_dto_1 = require("./dto/update-pet.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const filter_pet_dto_1 = require("./dto/filter-pet.dto");
let PetsTopLevelController = class PetsTopLevelController {
    petsService;
    constructor(petsService) {
        this.petsService = petsService;
    }
    findAllClinicPets(filterPetDto, req) {
        return this.petsService.findAllClinicPets(req.user, filterPetDto);
    }
    findOne(id, req) {
        return this.petsService.findOneByPetId(id, req.user);
    }
};
exports.PetsTopLevelController = PetsTopLevelController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filter_pet_dto_1.FilterPetDto, Object]),
    __metadata("design:returntype", void 0)
], PetsTopLevelController.prototype, "findAllClinicPets", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PetsTopLevelController.prototype, "findOne", null);
exports.PetsTopLevelController = PetsTopLevelController = __decorate([
    (0, common_1.Controller)('pets'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [pets_service_1.PetsService])
], PetsTopLevelController);
let PetsController = class PetsController {
    petsService;
    constructor(petsService) {
        this.petsService = petsService;
    }
    create(createPetDto, ownerId, req) {
        return this.petsService.create(createPetDto, ownerId, req.user);
    }
    findAll(ownerId, filterPetDto, req) {
        return this.petsService.findAll(ownerId, req.user, filterPetDto);
    }
    findOne(id, ownerId, req) {
        return this.petsService.findOne(id, ownerId, req.user);
    }
    update(id, ownerId, updatePetDto, req) {
        return this.petsService.update(id, ownerId, updatePetDto, req.user);
    }
    remove(id, ownerId, req) {
        return this.petsService.remove(id, ownerId, req.user);
    }
};
exports.PetsController = PetsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Param)('ownerId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_pet_dto_1.CreatePetDto, String, Object]),
    __metadata("design:returntype", void 0)
], PetsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('ownerId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, filter_pet_dto_1.FilterPetDto, Object]),
    __metadata("design:returntype", void 0)
], PetsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('ownerId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PetsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('ownerId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_pet_dto_1.UpdatePetDto, Object]),
    __metadata("design:returntype", void 0)
], PetsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('ownerId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PetsController.prototype, "remove", null);
exports.PetsController = PetsController = __decorate([
    (0, common_1.Controller)('owners/:ownerId/pets'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [pets_service_1.PetsService])
], PetsController);
//# sourceMappingURL=pets.controller.js.map