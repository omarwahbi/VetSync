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
exports.VisitsGlobalController = exports.VisitsController = void 0;
const common_1 = require("@nestjs/common");
const visits_service_1 = require("./visits.service");
const create_visit_dto_1 = require("./dto/create-visit.dto");
const update_visit_dto_1 = require("./dto/update-visit.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const filter_visit_dto_1 = require("./dto/filter-visit.dto");
let VisitsController = class VisitsController {
    visitsService;
    constructor(visitsService) {
        this.visitsService = visitsService;
    }
    create(createVisitDto, petId, req) {
        return this.visitsService.create(createVisitDto, petId, req.user);
    }
    findAll(petId, req) {
        return this.visitsService.findAll(petId, req.user);
    }
    findOne(id, petId, req) {
        return this.visitsService.findOne(id, petId, req.user);
    }
    update(id, petId, updateVisitDto, req) {
        return this.visitsService.update(id, petId, updateVisitDto, req.user);
    }
    remove(id, petId, req) {
        return this.visitsService.remove(id, petId, req.user);
    }
};
exports.VisitsController = VisitsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Param)('petId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_visit_dto_1.CreateVisitDto, String, Object]),
    __metadata("design:returntype", void 0)
], VisitsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('petId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VisitsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('petId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], VisitsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('petId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_visit_dto_1.UpdateVisitDto, Object]),
    __metadata("design:returntype", void 0)
], VisitsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('petId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], VisitsController.prototype, "remove", null);
exports.VisitsController = VisitsController = __decorate([
    (0, common_1.Controller)('pets/:petId/visits'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [visits_service_1.VisitsService])
], VisitsController);
let VisitsGlobalController = class VisitsGlobalController {
    visitsService;
    constructor(visitsService) {
        this.visitsService = visitsService;
    }
    findUpcoming(req) {
        return this.visitsService.findUpcoming(req.user);
    }
    findAllClinicVisits(req, filterDto) {
        return this.visitsService.findAllClinicVisits(req.user, filterDto);
    }
    findVisitsDueToday(req, page, limit) {
        return this.visitsService.findVisitsDueToday(req.user, page ? +page : undefined, limit ? +limit : undefined);
    }
    async debugDates() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const visits = await this.visitsService.getDebugDateInfo();
        const debugInfo = {
            currentServerTime: now.toISOString(),
            todayDateOnly: today,
            todayStart: `${today}T00:00:00.000Z`,
            todayEnd: `${today}T23:59:59.999Z`,
            visits: visits.map(v => ({
                id: v.id,
                visitType: v.visitType,
                petId: v.petId,
                petName: v.pet?.name,
                clinicId: v.pet?.owner?.clinicId,
                nextReminderDate: v.nextReminderDate?.toISOString(),
                isToday: v.nextReminderDate
                    ? v.nextReminderDate.toISOString().startsWith(today)
                    : false,
            })),
        };
        return debugInfo;
    }
};
exports.VisitsGlobalController = VisitsGlobalController;
__decorate([
    (0, common_1.Get)('upcoming'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VisitsGlobalController.prototype, "findUpcoming", null);
__decorate([
    (0, common_1.Get)('all'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, filter_visit_dto_1.FilterVisitDto]),
    __metadata("design:returntype", void 0)
], VisitsGlobalController.prototype, "findAllClinicVisits", null);
__decorate([
    (0, common_1.Get)('due-today'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", void 0)
], VisitsGlobalController.prototype, "findVisitsDueToday", null);
__decorate([
    (0, common_1.Get)('debug-dates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VisitsGlobalController.prototype, "debugDates", null);
exports.VisitsGlobalController = VisitsGlobalController = __decorate([
    (0, common_1.Controller)('visits'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [visits_service_1.VisitsService])
], VisitsGlobalController);
//# sourceMappingURL=visits.controller.js.map