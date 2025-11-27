import React, { useEffect } from 'react';
import { useAppStore } from '../store/useStore';
import { apiService } from '../services/api';
import { Todo } from '../types';

export const ScheduleView: React.FC = () => {
  const { todos, setTodos, setLoading } = useAppStore();

  useEffect(() => {
    const loadTodos = async () => {
      setLoading(true);
      try {
        const data = await apiService.fetchTodos();
        setTodos(data);
      } catch (err) {
        console.error("Failed to fetch todos", err);
      } finally {
        setLoading(false);
      }
    };
    loadTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Generate hours 0-23
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Group todos by hour
  const todosByHour: Record<number, Todo[]> = {};
  todos.forEach(todo => {
    if (!todosByHour[todo.hour]) {
      todosByHour[todo.hour] = [];
    }
    todosByHour[todo.hour].push(todo);
  });

  return (
    <div className="h-full overflow-y-auto p-4 relative">
       <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
      
      <div className="space-y-4 pb-20">
        {hours.map((hour) => {
           // Skip early/late hours if empty for cleaner UI, or just show active hours? 
           // Let's show 08:00 to 20:00 primarily, but render all if they exist.
           const hourTodos = todosByHour[hour] || [];
           const isWorkHours = hour >= 8 && hour <= 20;
           
           if (!isWorkHours && hourTodos.length === 0) return null;

           return (
             <div key={hour} className="flex group min-h-[5rem]">
               {/* Time Column */}
               <div className="w-16 flex-shrink-0 text-right pr-4 pt-2">
                 <span className="text-xs font-mono text-zinc-500">
                   {hour.toString().padStart(2, '0')}:00
                 </span>
               </div>
               
               {/* Task Area - Grid for max 4 columns */}
               <div className="flex-1 border-t border-zinc-800 pt-2 pb-4">
                 <div className="grid grid-cols-4 gap-2">
                   {hourTodos.slice(0, 4).map((todo) => (
                     <div 
                        key={todo.id} 
                        className={`p-3 rounded-md border border-zinc-700/50 shadow-sm relative overflow-hidden group/card hover:border-zinc-500 transition-colors ${todo.completed ? 'opacity-50' : ''}`}
                     >
                        <div className={`absolute top-0 left-0 w-1 h-full ${todo.color || 'bg-zinc-600'}`}></div>
                        <h4 className={`text-xs font-medium text-zinc-200 truncate ${todo.completed ? 'line-through decoration-zinc-500' : ''}`}>
                          {todo.title}
                        </h4>
                        <div className="mt-1 flex items-center justify-between">
                             <input 
                                type="checkbox" 
                                checked={todo.completed} 
                                readOnly 
                                className="w-3 h-3 rounded border-zinc-600 bg-transparent checked:bg-emerald-500 accent-emerald-500"
                             />
                        </div>
                     </div>
                   ))}
                   {/* Placeholder if empty but in work hours */}
                   {hourTodos.length === 0 && (
                     <div className="col-span-4 h-full min-h-[2rem] border border-dashed border-zinc-800/50 rounded flex items-center justify-center">
                        <span className="text-[10px] text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity">Free Slot</span>
                     </div>
                   )}
                 </div>
               </div>
             </div>
           );
        })}
      </div>
    </div>
  );
};