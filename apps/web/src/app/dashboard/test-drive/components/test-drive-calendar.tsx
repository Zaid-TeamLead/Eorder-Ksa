"use client";

import { useState, useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, View, SlotInfo } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BookTestDrive } from "@/services/bookTestDrive";

const DragAndDropCalendar = withDragAndDrop(Calendar);

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface TestDriveEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: BookTestDrive;
  status?: string;
}

interface TestDriveCalendarProps {
  bookings: BookTestDrive[];
  onEventClick?: (booking: BookTestDrive) => void;
  onSlotSelect?: (slotInfo: SlotInfo) => void;
  onEventDrop?: (event: TestDriveEvent, start: Date, end: Date) => void;
}

const statusColors: Record<string, string> = {
  Active: "#3b82f6",
  Pending: "#f59e0b",
  Confirmed: "#10b981",
  Completed: "#6b7280",
  Cancelled: "#ef4444",
  "In Progress": "#8b5cf6",
};

export function TestDriveCalendar({
  bookings,
  onEventClick,
  onSlotSelect,
  onEventDrop,
}: TestDriveCalendarProps) {
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());

  // Convert bookings to calendar events
  const events: TestDriveEvent[] = useMemo(() => {
    return bookings.map((booking) => {
      const startDate = new Date(booking.DATEOUT);
      const endDate = new Date(booking.DATEIN);

      // Add time if available
      if (booking.TIMEOUT) {
        const [hours, minutes] = booking.TIMEOUT.split(":");
        startDate.setHours(parseInt(hours), parseInt(minutes));
      }
      if (booking.TIMEIN) {
        const [hours, minutes] = booking.TIMEIN.split(":");
        endDate.setHours(parseInt(hours), parseInt(minutes));
      }

      return {
        id: booking.SLNO,
        title: `${booking.CUSTOMERNAME} - ${booking.MANUFACTURERNAME || booking.MANUFACTURER || ""} ${booking.MODELNAME || booking.MODEL || ""}`,
        start: startDate,
        end: endDate,
        resource: booking,
        status: booking.STATUS,
      };
    });
  }, [bookings]);

  // Event style getter for color coding
  const eventStyleGetter = useCallback(
    (event: TestDriveEvent) => {
      const backgroundColor = statusColors[event.status || "Active"] || statusColors.Active;
      return {
        style: {
          backgroundColor,
          borderRadius: "4px",
          opacity: 0.8,
          color: "white",
          border: "0px",
          display: "block",
          fontSize: "0.875rem",
        },
      };
    },
    []
  );

  const handleSelectEvent = useCallback(
    (event: TestDriveEvent) => {
      onEventClick?.(event.resource);
    },
    [onEventClick]
  );

  const handleSelectSlot = useCallback(
    (slotInfo: SlotInfo) => {
      onSlotSelect?.(slotInfo);
    },
    [onSlotSelect]
  );

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  const handleEventDrop = useCallback(
    ({ event, start, end }: { event: TestDriveEvent; start: Date; end: Date }) => {
      if (onEventDrop) {
        onEventDrop(event, start, end);
      }
    },
    [onEventDrop]
  );

  const handleEventResize = useCallback(
    ({ event, start, end }: { event: TestDriveEvent; start: Date; end: Date }) => {
      if (onEventDrop) {
        onEventDrop(event, start, end);
      }
    },
    [onEventDrop]
  );

  return (
    <div className="h-full flex flex-col">
      <style>{`
        .rbc-calendar {
          font-family: inherit;
        }
        .rbc-header {
          padding: 10px 3px;
          font-weight: 600;
          font-size: 0.875rem;
        }
        .rbc-today {
          background-color: rgba(59, 130, 246, 0.05);
        }
        .rbc-event {
          padding: 2px 5px;
          border-radius: 4px;
          cursor: pointer;
        }
        .rbc-event:hover {
          opacity: 1 !important;
        }
        .rbc-event-label {
          font-size: 0.75rem;
        }
        .rbc-event-content {
          font-size: 0.875rem;
          font-weight: 500;
        }
        .rbc-toolbar {
          padding: 10px 0;
          margin-bottom: 10px;
        }
        .rbc-toolbar button {
          padding: 5px 12px;
          border: 1px solid #ddd;
          background-color: white;
          cursor: pointer;
          font-size: 0.875rem;
          border-radius: 4px;
        }
        .rbc-toolbar button:hover {
          background-color: #f3f4f6;
        }
        .rbc-toolbar button.rbc-active {
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        .rbc-month-view,
        .rbc-time-view {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        .rbc-time-slot {
          min-height: 40px;
        }
        .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid #f3f4f6;
        }
        .rbc-time-header-content {
          border-left: 1px solid #e5e7eb;
        }
        .rbc-time-content {
          border-top: 1px solid #e5e7eb;
        }
        .dark .rbc-calendar {
          color: #e5e7eb;
        }
        .dark .rbc-toolbar button {
          background-color: #374151;
          border-color: #4b5563;
          color: #e5e7eb;
        }
        .dark .rbc-toolbar button:hover {
          background-color: #4b5563;
        }
        .dark .rbc-toolbar button.rbc-active {
          background-color: #3b82f6;
          border-color: #3b82f6;
        }
        .dark .rbc-month-view,
        .dark .rbc-time-view {
          border-color: #374151;
          background-color: #1f2937;
        }
        .dark .rbc-header {
          border-color: #374151;
        }
        .dark .rbc-day-bg {
          border-color: #374151;
        }
        .dark .rbc-time-header-content {
          border-color: #374151;
        }
        .dark .rbc-time-content {
          border-color: #374151;
        }
        .dark .rbc-today {
          background-color: rgba(59, 130, 246, 0.1);
        }
        .dark .rbc-off-range-bg {
          background-color: #111827;
        }
        .dark .rbc-day-slot .rbc-time-slot {
          border-color: #374151;
        }
      `}</style>
      {/* Calendar Controls */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={view === "day" ? "default" : "outline"}
            onClick={() => setView("day")}
          >
            Day
          </Button>
          <Button
            size="sm"
            variant={view === "week" ? "default" : "outline"}
            onClick={() => setView("week")}
          >
            Week
          </Button>
          <Button
            size="sm"
            variant={view === "month" ? "default" : "outline"}
            onClick={() => setView("month")}
          >
            Month
          </Button>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-muted-foreground">{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg border p-4">
        <DragAndDropCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%", minHeight: "500px" }}
          view={view}
          onView={handleViewChange}
          date={date}
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          selectable
          resizable
          eventPropGetter={eventStyleGetter}
          popup
          views={["month", "week", "day"]}
          step={30}
          showMultiDayTimes
          defaultDate={new Date()}
        />
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 border rounded-lg">
          <div className="text-sm text-muted-foreground">Total Bookings</div>
          <div className="text-2xl font-bold">{bookings.length}</div>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="text-sm text-muted-foreground">Active</div>
          <div className="text-2xl font-bold">
            {bookings.filter((b) => b.STATUS === "Active" || !b.STATUS).length}
          </div>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="text-sm text-muted-foreground">Completed</div>
          <div className="text-2xl font-bold">
            {bookings.filter((b) => b.STATUS === "Completed").length}
          </div>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="text-sm text-muted-foreground">This Month</div>
          <div className="text-2xl font-bold">
            {
              bookings.filter((b) => {
                const bookingDate = new Date(b.DATEOUT);
                return (
                  bookingDate.getMonth() === new Date().getMonth() &&
                  bookingDate.getFullYear() === new Date().getFullYear()
                );
              }).length
            }
          </div>
        </div>
      </div>
    </div>
  );
}
