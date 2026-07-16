/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ChatSettings } from "../types";
import { Settings, Sparkles, Sliders, Info, Search, HelpCircle } from "lucide-react";

interface SettingsPanelProps {
  settings: ChatSettings;
  onChange: (settings: ChatSettings) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ settings, onChange, isOpen, onClose }: SettingsPanelProps) {
  if (!isOpen) return null;

  const models = [
    { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", desc: "Super fast, lightweight, and highly intelligent multimodal model.", recommended: true },
    { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", desc: "Ultra-lightweight, extremely fast, and highly resilient under peak demand." },
    { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro (Preview)", desc: "Deep reasoning, best for complex coding, mathematics, and intricate logic." }
  ];

  const handleModelChange = (modelId: string) => {
    onChange({ ...settings, model: modelId });
  };

  const handleSystemInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...settings, systemInstruction: e.target.value });
  };

  const handleSearchToggle = () => {
    onChange({ ...settings, searchGroundingEnabled: !settings.searchGroundingEnabled });
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...settings, temperature: parseFloat(e.target.value) });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-fade-in" id="settings_modal">
      <div 
        className="w-full max-w-lg bg-white border border-slate-200/80 rounded-2xl shadow-lg overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        id="settings_card"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-800">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold font-sans text-slate-900">Settings</h2>
              <p className="text-xs text-slate-400">Configure assistant behavior and model variables</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 transition text-xs font-semibold font-sans px-3 py-1.5 hover:bg-slate-100 rounded-md cursor-pointer"
            id="btn_close_settings"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Model Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider block">LLM Engine</label>
            <div className="grid grid-cols-1 gap-3">
              {models.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleModelChange(m.id)}
                  className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all relative cursor-pointer group ${
                    settings.model === m.id 
                      ? "bg-slate-50/50 border-slate-950 shadow-sm" 
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                  id={`btn_model_${m.id}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 group-hover:text-slate-950">
                      {m.name}
                    </span>
                    {m.recommended && (
                      <span className="text-[9px] bg-slate-900 text-white font-mono font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Web Search Grounding */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-900" />
                  <span className="font-semibold text-xs text-slate-900 font-sans">Google Search Grounding</span>
                </div>
                <p className="text-xs text-slate-500">
                  Allow the AI to dynamically search Google for up-to-date facts, local news, and search citations.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSearchToggle}
                className={`w-11 h-6 rounded-full transition-colors relative duration-200 cursor-pointer ${
                  settings.searchGroundingEnabled ? "bg-slate-900" : "bg-slate-200"
                }`}
                id="toggle_search_grounding"
              >
                <span 
                  className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ${
                    settings.searchGroundingEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Custom System Instruction */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider">
                System Persona & Rules
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Injected in context</span>
            </div>
            <textarea
              value={settings.systemInstruction}
              onChange={handleSystemInstructionChange}
              placeholder="e.g. You are an expert Python tutor who answers with code blocks and short explanations..."
              className="w-full h-28 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-xl p-4 text-xs text-slate-800 outline-none transition resize-none custom-scrollbar font-sans placeholder:text-slate-400"
              id="settings_system_instruction"
            />
          </div>

          {/* Temperature Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <label className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider">Temperature</label>
              </div>
              <span className="text-xs font-mono font-bold text-slate-900 px-1.5 py-0.5 bg-slate-100 rounded">
                {settings.temperature.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.5"
              step="0.1"
              value={settings.temperature}
              onChange={handleTemperatureChange}
              className="w-full h-1 bg-slate-200 accent-slate-900 rounded-lg appearance-none cursor-pointer"
              id="slider_temperature"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0.0 (Precise / Deterministic)</span>
              <span>1.5 (Creative / Wild)</span>
            </div>
          </div>

          {/* API Info Callout */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex gap-3 text-xs text-slate-500">
            <Info className="w-4 h-4 shrink-0 text-slate-500 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Server-Side API Ingress</p>
              <p className="mt-0.5 text-slate-500">
                All model inference, search orchestration, and document analysis happen securely in our backend server to avoid exposing API keys.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


