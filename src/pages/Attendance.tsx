import React, { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/contexts/AppDataContext";
import { Attendance as AttendanceType } from "@/types";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  User,
  Users,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function AttendancePage() {
  const { staff, attendance, upsertAttendance } = useAppData();
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 20)); // January 2024
  const [selectedDate, setSelectedDate] = useState<string>("2024-01-20");

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const formatDateString = (day: number) => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const getAttendanceForDate = (date: string) => attendance.filter((a) => a.date === date);

  const selectedDateAttendance = getAttendanceForDate(selectedDate);
  const presentCount = selectedDateAttendance.filter((a) => a.status === "present" || a.status === "late").length;
  const absentCount = selectedDateAttendance.filter((a) => a.status === "absent").length;

  const getStatusBadge = (status: AttendanceType["status"]) => {
    switch (status) {
      case "present":
        return <Badge variant="success">Present</Badge>;
      case "absent":
        return <Badge variant="danger">Absent</Badge>;
      case "late":
        return <Badge variant="warning">Late</Badge>;
      case "half-day":
        return <Badge variant="outline">Half Day</Badge>;
      case "leave":
        return <Badge variant="glass">Leave</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const toggleAttendance = (staffId: string, currentStatus: AttendanceType["status"] | undefined) => {
    const newStatus = currentStatus === "present" ? "absent" : "present";
    upsertAttendance({
      staffId,
      date: selectedDate,
      status: newStatus,
    }).then(() =>
      toast({
        title: `Attendance Updated`,
        description: `Marked as ${newStatus}`,
      })
    );
  };

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-10" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDateString(day);
    const dayAttendance = getAttendanceForDate(dateStr);
    const presentToday = dayAttendance.filter((a) => a.status === "present" || a.status === "late").length;
    const isSelected = dateStr === selectedDate;
    const isToday = day === 20 && currentMonth === 0 && currentYear === 2024;

    calendarDays.push(
      <button
        key={day}
        onClick={() => setSelectedDate(dateStr)}
        className={`h-10 rounded-lg flex flex-col items-center justify-center text-sm transition-all ${
          isSelected
            ? "bg-primary text-primary-foreground"
            : isToday
            ? "bg-accent/20 text-accent"
            : "hover:bg-muted/50"
        }`}
      >
        <span className="font-medium">{day}</span>
        {presentToday > 0 && (
          <span className={`text-xs ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {presentToday}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Attendance</h1>
          <p className="text-muted-foreground">হাজিরা ব্যবস্থাপনা • Daily Attendance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <GlassCard className="p-6 lg:col-span-1 animate-fade-in stagger-1">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h3 className="font-display font-semibold">
              {MONTHS[currentMonth]} {currentYear}
            </h3>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div key={day} className="h-8 flex items-center justify-center text-xs text-muted-foreground font-medium">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">{calendarDays}</div>

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">Selected: {selectedDate}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-accent/20 text-center">
                <p className="text-2xl font-display font-bold text-accent">{presentCount}</p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/20 text-center">
                <p className="text-2xl font-display font-bold text-destructive">{absentCount}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Attendance List */}
        <GlassCard className="p-6 lg:col-span-2 animate-fade-in stagger-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg">
              Attendance for {selectedDate}
            </h3>
            <Badge variant="glass">
              <Users className="w-4 h-4 mr-1" />
            {staff.length} Staff
            </Badge>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-auto custom-scrollbar">
          {staff.map((member) => {
            const record = selectedDateAttendance.find((a) => a.staffId === member.id);

              return (
                <div
                key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-bold">
                    {member.name.charAt(0)}
                    </div>
                    <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {record && (
                      <div className="text-sm text-muted-foreground">
                        {record.checkIn && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {record.checkIn}
                            {record.checkOut && ` - ${record.checkOut}`}
                          </span>
                        )}
                      </div>
                    )}

                    {record ? (
                      getStatusBadge(record.status)
                    ) : (
                      <Badge variant="outline">Not Marked</Badge>
                    )}

                    <div className="flex gap-1">
                      <Button
                        variant={record?.status === "present" ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleAttendance(member.id, record?.status)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={record?.status === "absent" ? "destructive" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleAttendance(member.id, record?.status)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Monthly Summary */}
      <GlassCard className="p-6 animate-fade-in stagger-3">
        <h3 className="font-display font-semibold text-lg mb-4">Monthly Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium">Staff</th>
                <th className="text-center p-3 font-medium">Present</th>
                <th className="text-center p-3 font-medium">Absent</th>
                <th className="text-center p-3 font-medium">Late</th>
                <th className="text-center p-3 font-medium">Working Days</th>
                <th className="text-right p-3 font-medium">Salary Impact</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => {
                const staffRecords = attendance.filter((a) => a.staffId === member.id);
                const present = staffRecords.filter((a) => a.status === "present").length;
                const absent = staffRecords.filter((a) => a.status === "absent").length;
                const late = staffRecords.filter((a) => a.status === "late").length;
                const workingDays = present + late;
                const dailyRate = member.salary / 26;
                const deduction = absent * dailyRate;

                return (
                  <tr key={member.id} className="border-b border-border/50 table-row-hover">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground text-sm font-bold">
                          {member.name.charAt(0)}
                        </div>
                        <span className="font-medium">{member.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="success">{present}</Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="danger">{absent}</Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="warning">{late}</Badge>
                    </td>
                    <td className="p-3 text-center font-medium">{workingDays}</td>
                    <td className="p-3 text-right">
                      {deduction > 0 ? (
                        <span className="text-destructive font-medium">-{formatCurrency(Math.round(deduction))}</span>
                      ) : (
                        <span className="text-accent font-medium">No deduction</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
