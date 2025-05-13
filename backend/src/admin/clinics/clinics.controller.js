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
exports.ClinicsController = void 0;
const common_1 = require("@nestjs/common");
const clinics_service_1 = require("./clinics.service");
const admin_guard_1 = require("../../auth/guards/admin.guard");
const update_clinic_settings_dto_1 = require("./dto/update-clinic-settings.dto");
const create_clinic_dto_1 = require("./dto/create-clinic.dto");
const admin_clinic_list_query_dto_1 = require("./dto/admin-clinic-list-query.dto");
let ClinicsController = class ClinicsController {
    clinicsService;
    constructor(clinicsService) {
        this.clinicsService = clinicsService;
    }
    createClinic(createClinicDto, req) {
        return this.clinicsService.createClinic(createClinicDto, req.user);
    }
    findAllClinics(queryDto) {
        return this.clinicsService.findAllClinics(queryDto);
    }
    findClinicById(id) {
        return this.clinicsService.findClinicById(id);
    }
    updateClinicSettings(id, updateClinicSettingsDto, req) {
        return this.clinicsService.updateClinicSettings(id, updateClinicSettingsDto, req.user);
    }
};
exports.ClinicsController = ClinicsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_clinic_dto_1.CreateClinicDto, Object]),
    __metadata("design:returntype", void 0)
], ClinicsController.prototype, "createClinic", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_clinic_list_query_dto_1.AdminClinicListQueryDto]),
    __metadata("design:returntype", void 0)
], ClinicsController.prototype, "findAllClinics", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClinicsController.prototype, "findClinicById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_clinic_settings_dto_1.UpdateClinicSettingsDto, Object]),
    __metadata("design:returntype", void 0)
], ClinicsController.prototype, "updateClinicSettings", null);
exports.ClinicsController = ClinicsController = __decorate([
    (0, common_1.Controller)('admin/clinics'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [clinics_service_1.ClinicsService])
], ClinicsController);
//# sourceMappingURL=clinics.controller.js.map