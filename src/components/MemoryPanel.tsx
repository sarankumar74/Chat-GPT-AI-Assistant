/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Memory } from "../types";
import { BrainCircuit, Trash2, Plus, Smile, User, Brain, AlertCircle } from "lucide-react";
import { collection, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface MemoryPanelProps {
  userId: string;
  memories: Memory[];
  onMemoryAdded: () => void;
  onMemoryDeleted: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function MemoryPanel({ 
  userId, 
  memories, 
  onMemoryAdded, 
  onMemoryDeleted, 
  isOpen, 
  onClose 
}: MemoryPanelProps) {
  if (!isOpen) return null;

  const [newMemory, setNewMemory] = useState("");
  const [newType, setNewType] = useState<"profile" | "long" | "short" | "semantic">("long");
  const [importance, setImportance] = useState(3);
  const [loading, setLoading] = useState(false);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemory.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "memories"), {
        userId,
        content: newMemory.trim(),
        type: newType,
        importance,
        createdAt: Date.now(),
      });
      setNewMemory("");
      onMemoryAdded();
    } catch (err) {
      console.error("Error adding memory:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await deleteDoc(doc(db, "memories", id));
      onMemoryDeleted();
    } catch (err) {
      console.error("Error deleting memory:", err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "profile":
        return <User className="w-3.5 h-3.5 text-slate-500" />;
      case "semantic":
        return <BrainCircuit className="w-3.5 h-3.5 text-slate-500" />;
      default:
        return <Brain className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "profile": return "Profile Fact";
      case "semantic": return "Semantic Knowledge";
      case "short": return "Short term";
      default: return "Long-term Fact";
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-fade-in" id="memory_modal">
      <div 
        className="w-full max-w-lg bg-white border border-slate-200/80 rounded-2xl shadow-lg overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        id="memory_card"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-800">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold font-sans text-slate-900">Long-Term Memory Vault</h2>
              <p className="text-xs text-slate-400">View and update facts the AI has memorized about you</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 transition text-xs font-semibold font-sans px-3 py-1.5 hover:bg-slate-100 rounded-md cursor-pointer"
            id="btn_close_memory"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Add Manual Memory Form */}
          <form onSubmit={handleAddMemory} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3" id="form_add_memory">
            <span className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider block">
              Inject Custom Fact
            </span>
            <div className="flex flex-col gap-2.5">
              <input
                type="text"
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                placeholder="e.g. Saran is building a full-stack chatbot with Express and Firebase"
                className="w-full bg-white border border-slate-200 focus:border-slate-450 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-800 outline-none transition placeholder:text-slate-400"
                required
              />
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                <div className="flex gap-2">
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="bg-white border border-slate-200 text-[11px] text-slate-700 rounded px-2.5 py-1.5 outline-none font-sans focus:border-slate-400 flex-1 sm:flex-initial"
                  >
                    <option value="long">Long-term Fact</option>
                    <option value="profile">Profile Fact</option>
                    <option value="semantic">Semantic Fact</option>
                  </select>
                  <select
                    value={importance}
                    onChange={(e) => setImportance(parseInt(e.target.value))}
                    className="bg-white border border-slate-200 text-[11px] text-slate-700 rounded px-2.5 py-1.5 outline-none font-sans focus:border-slate-400 flex-1 sm:flex-initial"
                  >
                    <option value="1">Importance: 1</option>
                    <option value="2">Importance: 2</option>
                    <option value="3">Importance: 3</option>
                    <option value="4">Importance: 4</option>
                    <option value="5">Importance: 5</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading || !newMemory.trim()}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-1.5 rounded-lg flex items-center justify-center gap-1 transition disabled:opacity-50 cursor-pointer shadow-sm mt-1 sm:mt-0"
                  id="btn_add_memory"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Fact</span>
                </button>
              </div>
            </div>
          </form>

          {/* Memories List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider block">
                Active Memorized Facts ({memories.length})
              </label>
              {memories.length > 0 && (
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <Smile className="w-3 h-3" /> Auto-applied in chats
                </span>
              )}
            </div>

            {memories.length === 0 ? (
              <div className="text-center py-8 p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400" id="empty_memories">
                <BrainCircuit className="w-7 h-7 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-700">Your memory vault is currently empty.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">As you chat, the AI will automatically learn facts about you and save them here.</p>
              </div>
            ) : (
              <div className="space-y-2" id="memories_list">
                {memories.map((m) => (
                  <div 
                    key={m.id} 
                    className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-slate-50 rounded-lg shrink-0 mt-0.5 border border-slate-100">
                        {getIcon(m.type)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-sans font-medium text-slate-800 leading-relaxed">
                          {m.content}
                        </p>
                        <div className="flex items-center gap-2 text-[9px] font-mono text-slate-400">
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                            {getTypeName(m.type)}
                          </span>
                          <span>Importance: {m.importance}/5</span>
                          <span>•</span>
                          <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMemory(m.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                      title="Forget this fact"
                      id={`btn_delete_memory_${m.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Educational Note */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex gap-3 text-xs text-slate-500">
            <AlertCircle className="w-4 h-4 shrink-0 text-slate-500 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Continuous Memory Synthesis</p>
              <p className="mt-0.5 text-slate-500 leading-relaxed">
                Modern LLMs leverage structured client-directed memory. In this implementation, recent statements are analyzed asynchronously by a background pipeline to update this list, creating a customized agentic persona.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
