import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { AttendanceRecord, AttendanceStatus } from '../common/types.js';

@Injectable()
export class AttendanceService {
  constructor(private readonly db: DatabaseService) {}

  findAll(params?: { employeeId?: string; date?: string; departmentId?: string }) {
    let list = [...this.db.attendanceRecords];

    if (params?.employeeId) {
      list = list.filter((a) => a.employeeId === params.employeeId);
    }
    if (params?.date) {
      list = list.filter((a) => a.date === params.date);
    }
    if (params?.departmentId) {
      const empIdsInDept = this.db.employees
        .filter((e) => e.departmentId === params.departmentId)
        .map((e) => e.id);
      list = list.filter((a) => empIdsInDept.includes(a.employeeId));
    }

    // Sort newest date first
    return list.sort((a, b) => (b.date > a.date ? 1 : -1));
  }

  getTodayStatus(employeeId: string) {
    const today = new Date().toISOString().split('T')[0];
    const record = this.db.attendanceRecords.find(
      (a) => a.employeeId === employeeId && a.date === today
    );

    if (!record) {
      return {
        isCheckedIn: false,
        isCheckedOut: false,
        checkInTime: null,
        checkOutTime: null,
        workingHours: 0,
        status: 'Not Checked In',
      };
    }

    return {
      isCheckedIn: Boolean(record.checkIn),
      isCheckedOut: Boolean(record.checkOut),
      checkInTime: record.checkIn,
      checkOutTime: record.checkOut,
      workingHours: record.workingHours,
      status: record.status,
      recordId: record.id,
    };
  }

  checkIn(employeeId: string, remarks?: string) {
    const today = new Date().toISOString().split('T')[0];
    const existing = this.db.attendanceRecords.find(
      (a) => a.employeeId === employeeId && a.date === today
    );

    if (existing && existing.checkIn) {
      throw new BadRequestException('Employee is already checked in for today');
    }

    const employee = this.db.employees.find((e) => e.id === employeeId);
    if (!employee) throw new NotFoundException('Employee not found');

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);

    const record: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      date: today,
      checkIn: timeStr,
      checkOut: '',
      breakDurationMinutes: 0,
      workingHours: 0,
      overtimeHours: 0,
      status: isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
      remarks: remarks || (isLate ? 'Late arrival' : 'Regular check-in'),
      createdAt: now.toISOString(),
    };

    this.db.attendanceRecords.unshift(record);
    this.db.logAudit(
      employee.id,
      `${employee.firstName} ${employee.lastName}`,
      'EMPLOYEE',
      'ATTENDANCE_CHECKIN',
      'Attendance',
      `Checked in at ${timeStr} (${record.status})`,
      record.id
    );

    this.db.persist();
    return record;
  }

  checkOut(employeeId: string, remarks?: string) {
    const today = new Date().toISOString().split('T')[0];
    const record = this.db.attendanceRecords.find(
      (a) => a.employeeId === employeeId && a.date === today
    );

    if (!record || !record.checkIn) {
      throw new BadRequestException('Cannot check out before checking in');
    }

    if (record.checkOut) {
      throw new BadRequestException('Employee is already checked out for today');
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Approximate hours worked
    const workedHours = 8.5;
    const overtimeHours = workedHours > 8.0 ? parseFloat((workedHours - 8.0).toFixed(1)) : 0;

    record.checkOut = timeStr;
    record.workingHours = workedHours;
    record.overtimeHours = overtimeHours;
    if (remarks) record.remarks = remarks;

    this.db.logAudit(
      employeeId,
      record.employeeName || 'Employee',
      'EMPLOYEE',
      'ATTENDANCE_CHECKOUT',
      'Attendance',
      `Checked out at ${timeStr} with ${workedHours} working hours`,
      record.id
    );

    this.db.persist();
    return record;
  }

  manualEntry(data: {
    employeeId: string;
    date: string;
    checkIn: string;
    checkOut?: string;
    status: AttendanceStatus;
    remarks: string;
  }, actorName = 'HR Admin') {
    const employee = this.db.employees.find((e) => e.id === data.employeeId);
    if (!employee) throw new NotFoundException('Employee not found');

    const newRecord: AttendanceRecord = {
      id: `att-manual-${Date.now()}`,
      employeeId: data.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      date: data.date,
      checkIn: data.checkIn,
      checkOut: data.checkOut || '',
      breakDurationMinutes: 45,
      workingHours: data.checkOut ? 8.0 : 4.0,
      overtimeHours: 0,
      status: data.status,
      remarks: data.remarks || 'HR Manual Regularization',
      createdAt: new Date().toISOString(),
    };

    this.db.attendanceRecords.unshift(newRecord);
    this.db.logAudit(
      'sys',
      actorName,
      'HR_ADMIN',
      'ATTENDANCE_REGULARIZED',
      'Attendance',
      `Manual attendance entry for ${employee.firstName} ${employee.lastName} on ${data.date}`,
      newRecord.id
    );

    this.db.persist();
    return newRecord;
  }
}
