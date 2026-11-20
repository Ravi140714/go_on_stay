/**
 * Strict Department-Isolated Staff Portal Layout
 * 
 * Provides a dedicated workspace layout for the authenticated staff member.
 * Strictly renders:
 * - Current Department identity, badge, and operational navigation only.
 * - Current Staff Member's verified profile (Employee ID, Login ID, Department).
 * - ZERO references, links, buttons, or badges to the other 4 departments.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Hotel, LogOut, User, Shield, CheckCircle2, ChevronRight, Menu, X, Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStaffDepartment } from '../../context/StaffDepartmentContext';
import { getDepartmentConfig } from '../../config/staffDepartments';

export const StaffPortalLayout = ({
  department,
  activeTab,
  onSelectTab,
  children
}) => {
  const { user, logout } = useAuth();
  const { departmentProfile, departmentConfig } = useStaffDepartment();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active configuration for this isolated portal
  const config = departmentConfig || getDepartmentConfig(department);
  const DeptIcon = config?.icon || Hotel;
  const navItems = config?.navItems || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const employeeId = departmentProfile?.employee_id || user?.employee_id || 'GOS-STAFF';
  const loginId = departmentProfile?.login_id || user?.login_id || user?.username || 'staff';
  const staffName = departmentProfile?.full_name || `${departmentProfile?.first_name || ''} ${departmentProfile?.last_name || ''}`.trim() || user?.first_name || 'Staff Officer';
  const designation = departmentProfile?.designation || `${config?.name || 'Department'} Officer`;

  const renderNavList = () => (
    <div className="space-y-1.5 py-4">
      <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
        {config?.name || 'Department'} Navigation
      </div>
      {navItems.map((item) => {
        const ItemIcon = item.icon || DeptIcon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (onSelectTab) onSelectTab(item.id, item.filter);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none text-left ${
              isActive
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/80'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <ItemIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className="truncate">{item.label}</span>
            </div>
            {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex font-sans selection:bg-slate-900 selection:text-white">
      
      {/* DESKTOP SIDEBAR (Strictly Isolated to This Department) */}
      <aside className="hidden lg:flex flex-col shrink-0 w-72 bg-white border-r border-slate-200 h-screen sticky top-0 z-30 select-none shadow-xs">
        {/* Brand & Department Badge */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 shadow-sm font-black">
              <DeptIcon className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-black text-slate-900 truncate">GoOnStay Staff</h2>
              <div className="mt-0.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="truncate">{config?.portalName || 'Staff Portal'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items (Only for this department) */}
        <div className="flex-1 overflow-y-auto px-3">
          {renderNavList()}
        </div>

        {/* Staff User Profile Card Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70">
          <div className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xs shrink-0">
                {staffName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-slate-900 truncate">{staffName}</div>
                <div className="text-[10px] font-mono font-bold text-slate-500 truncate">{employeeId}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Logout from Staff Portal"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white border-r border-slate-200 flex flex-col z-50 shadow-2xl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-black">
                  <DeptIcon className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-xs font-black text-slate-900 truncate">{config?.portalName}</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3">
              {renderNavList()}
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN PORTAL CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Mobile Header Bar */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xs">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <DeptIcon className="w-4 h-4 text-slate-900" />
            <span className="text-xs font-black text-slate-900 truncate">{config?.portalName}</span>
          </div>
          <div className="text-[10px] font-mono font-bold text-slate-500 px-2 py-1 rounded bg-slate-100">
            {employeeId}
          </div>
        </header>

        {/* Portal Workspace Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

    </div>
  );
};

export default StaffPortalLayout;
