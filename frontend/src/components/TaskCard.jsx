import React from 'react';
import { Calendar, User } from 'lucide-react';
import { SERVICE_TYPES, PRIORITIES, findOpt, formatDate, isOverdue } from '../lib/workflow';

export default function TaskCard({ task, onClick, draggable, onDragStart }) {
  const service = findOpt(SERVICE_TYPES, task.service_type);
  const priority = findOpt(PRIORITIES, task.priority);
  const overdue = isOverdue(task.due_date, task.status);
  const initials = (task.assignee_name || '').slice(0, 2).toUpperCase();

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md hover:border-cyan-300 transition cursor-pointer"
      data-testid={`task-card-${task.id}`}
    >
      <div className="flex items-start gap-2">
        {priority && <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${priority.dot}`} title={priority.label} />}
        <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
        {service && <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${service.color}`}>{service.label}</span>}
        {task.client_name && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{task.client_name}</span>
        )}
      </div>

      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-1.5 text-xs">
          {task.due_date ? (
            <span className={`inline-flex items-center gap-1 ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
              <Calendar size={12} /> {formatDate(task.due_date)}
            </span>
          ) : <span />}
        </div>
        {task.assignee_name ? (
          <span className="h-6 w-6 rounded-full bg-cyan-600 text-white grid place-items-center text-[10px] font-bold" title={task.assignee_name}>
            {initials}
          </span>
        ) : (
          <span className="text-gray-300" title="Belum ditugaskan"><User size={14} /></span>
        )}
      </div>
    </div>
  );
}
