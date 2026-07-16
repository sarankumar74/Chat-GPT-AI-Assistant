/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Conversation, UserProfile } from "../types";
import { 
  MessageSquare, 
  Trash2, 
  Settings, 
  BrainCircuit, 
  LogOut, 
  Plus, 
  Edit3, 
  Check, 
  X, 
  Sparkles,
  Menu,
  ChevronLeft
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

interface SidebarProps {
  user: UserProfile;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onOpenSettings: () => void;
  onOpenMemory: () => void;
  onLogout: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export default function Sidebar({
  user,
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  onRenameConversation,
  onOpenSettings,
  onOpenMemory,
  onLogout,
  isSidebarOpen,
  setIsSidebarOpen
}: SidebarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");

  const startRename = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(c.id);
    setRenameTitle(c.title);
  };

  const saveRename = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (renameTitle.trim()) {
      onRenameConversation(id, renameTitle.trim());
    }
    setRenamingId(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <>
      {/* Sidebar container - Light Mode ChatGPT Style */}
      <div 
        className={`fixed top-0 bottom-0 left-0 z-45 bg-[#fcfcfc] border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out shrink-0 ${
          isSidebarOpen 
            ? "translate-x-0 md:static w-72 md:w-72 opacity-100" 
            : "-translate-x-full md:translate-x-0 md:static w-0 md:w-0 md:border-r-0 md:opacity-0 overflow-hidden"
        }`}
        id="sidebar"
      >
        {/* Header Block */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#10a37f] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold tracking-tight text-base text-slate-800 font-sans">
              AI Workspace
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition md:hidden cursor-pointer"
            id="btn_mobile_menu_close"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Action Button: New Chat */}
        <div className="p-4">
          <button
            onClick={() => {
              onCreateConversation();
              // Auto close sidebar on mobile after choosing/creating
              if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
              }
            }}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 py-2.5 px-4 rounded-xl transition duration-150 font-medium text-xs font-sans cursor-pointer active:scale-[0.98] shadow-sm"
            id="btn_new_chat"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Navigation: History List */}
        <div className="flex-grow overflow-y-auto px-3 py-1 space-y-1 custom-scrollbar">
          <span className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider px-3 block mb-2">
            History ({conversations.length})
          </span>

          {conversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 px-3 font-sans">
              No conversations yet.
            </div>
          ) : (
            <div className="space-y-0.5" id="conversations_history">
              {conversations.map((c) => {
                const isActive = activeConversationId === c.id;
                const isRenaming = renamingId === c.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      if (!isRenaming) {
                        onSelectConversation(c.id);
                        if (window.innerWidth < 768) {
                          setIsSidebarOpen(false);
                        }
                      }
                    }}
                    className={`group w-full flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-left transition duration-150 text-xs font-medium font-sans border-none ${
                      isActive
                        ? "bg-slate-100 text-slate-900"
                        : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
                    }`}
                    id={`conversation_item_${c.id}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#10a37f]" : "text-slate-400 group-hover:text-slate-600"}`} />
                      
                      {isRenaming ? (
                        <form 
                          onSubmit={(e) => saveRename(c.id, e)} 
                          className="flex items-center gap-1.5 w-full mr-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={renameTitle}
                            onChange={(e) => setRenameTitle(e.target.value)}
                            className="bg-white text-slate-900 px-1.5 py-0.5 rounded outline-none border border-slate-200 w-full text-xs font-sans focus:border-slate-400"
                            autoFocus
                            onBlur={(e) => saveRename(c.id, e)}
                          />
                        </form>
                      ) : (
                        <span className="truncate pr-1 select-none">
                          {c.title}
                        </span>
                      )}
                    </div>

                    {!isRenaming && (
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0 ml-2">
                        <button
                          onClick={(e) => startRename(c, e)}
                          className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition hover:bg-slate-200 cursor-pointer"
                          title="Rename"
                          id={`btn_rename_conv_${c.id}`}
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(c.id);
                          }}
                          className="p-0.5 text-slate-400 hover:text-red-600 rounded transition hover:bg-slate-200 cursor-pointer"
                          title="Delete"
                          id={`btn_delete_conv_${c.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Navigation Utilities */}
        <div className="p-3 border-t border-slate-100 space-y-0.5">
          <button
            onClick={onOpenMemory}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 transition text-xs font-medium font-sans cursor-pointer text-left"
            id="btn_open_memory_panel"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-slate-400" />
            <span>Memory Vault</span>
          </button>
          
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 transition text-xs font-medium font-sans cursor-pointer text-left"
            id="btn_open_settings_panel"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Settings</span>
          </button>
        </div>

        {/* Profile Card & Session Termination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3" id="profile_card">
          <div className="flex items-center gap-3 min-w-0">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || "User"} 
                className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#10a37f] flex items-center justify-center font-bold text-white uppercase select-none text-xs shadow-sm">
                {(user.displayName || user.email || "?")[0]}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate leading-snug">
                {user.displayName || user.email?.split("@")[0]}
              </p>
              <p className="text-[10px] text-slate-400 truncate leading-snug font-mono">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition cursor-pointer"
            title="Sign Out"
            id="btn_signout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 md:hidden"
        />
      )}
    </>
  );
}


