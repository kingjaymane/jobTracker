'use client';

import { useState } from 'react';
import { 
  LayoutDashboard, 
  Plus, 
  Calendar, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onAddJob: () => void;
  activeView?: string;
  onViewChange?: (view: string) => void;
}

export function Sidebar({ collapsed, onToggle, onAddJob, activeView = 'dashboard', onViewChange }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'email', label: 'Email Integration', icon: Mail },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={cn(
      "fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 z-50",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center space-x-2">
                <Briefcase className="h-6 w-6 text-primary" />
                <span className="font-semibold text-lg">JobTracker</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Add Job Button */}
        <div className="p-4">
          <Button
            onClick={onAddJob}
            className="w-full justify-start gap-2"
            size={collapsed ? "icon" : "default"}
          >
            <Plus className="h-4 w-4" />
            {!collapsed && "Add Job"}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeView === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-2 h-10",
                collapsed && "px-2"
              )}
              onClick={() => onViewChange?.(item.id)}
            >
              <item.icon className="h-4 w-4" />
              {!collapsed && item.label}
            </Button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className={cn(
            "text-xs text-muted-foreground",
            collapsed && "text-center"
          )}>
            {collapsed ? "v1.0" : "JobTracker v1.0"}
          </div>
        </div>
      </div>
    </div>
  );
}