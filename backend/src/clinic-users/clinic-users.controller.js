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
exports.ClinicUsersController = void 0;
const common_1 = require("@nestjs/common");
const clinic_users_service_1 = require("./clinic-users.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const clinic_admin_guard_1 = require("../auth/guards/clinic-admin.guard");
const clinic_create_user_dto_1 = require("./dto/clinic-create-user.dto");
const clinic_update_user_dto_1 = require("./dto/clinic-update-user.dto");
let ClinicUsersController = class ClinicUsersController {
    clinicUsersService;
    constructor(clinicUsersService) {
        this.clinicUsersService = clinicUsersService;
    }
    findAll(req) {
        return this.clinicUsersService.findUsersForClinic(req.user.clinicId);
    }
    createUser(req, createUserDto) {
        return this.clinicUsersService.createUserInClinic(req.user, createUserDto);
    }
    updateUser(req, userIdToUpdate, updateDto) {
        return this.clinicUsersService.updateUserInClinic(req.user, userIdToUpdate, updateDto);
    }
    deleteUser(req, userIdToDelete) {
        return this.clinicUsersService.deleteUserInClinic(req.user, userIdToDelete);
    }
};
exports.ClinicUsersController = ClinicUsersController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ClinicUsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, clinic_admin_guard_1.ClinicAdminGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, clinic_create_user_dto_1.ClinicCreateUserDto]),
    __metadata("design:returntype", void 0)
], ClinicUsersController.prototype, "createUser", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, clinic_admin_guard_1.ClinicAdminGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, clinic_update_user_dto_1.ClinicUpdateUserDto]),
    __metadata("design:returntype", void 0)
], ClinicUsersController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, clinic_admin_guard_1.ClinicAdminGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ClinicUsersController.prototype, "deleteUser", null);
exports.ClinicUsersController = ClinicUsersController = __decorate([
    (0, common_1.Controller)('/dashboard/clinic-users'),
    __metadata("design:paramtypes", [clinic_users_service_1.ClinicUsersService])
], ClinicUsersController);
//# sourceMappingURL=clinic-users.controller.js.map