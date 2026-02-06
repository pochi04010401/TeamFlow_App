'use client';

import { useState } from 'react';
import { Users, ChevronDown } from 'lucide-react';
import type { Member } from '@/lib/types';

export function MemberFilter({
  members,
  selectedMemberId,
  onSelect
}: {
  members: Member[];
  selectedMemberId: string | null;
  onSelect: (memberId: string | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedMember = members.find(m => m.id === selectedMemberId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700/50 hover:bg-dark-600/50 transition-colors"
      >
        {selectedMember ? (
          <>
            <div 
              className="w-5 h-5 rounded-full"
              style={{ backgroundColor: selectedMember.color }}
            />
            <span className="text-sm text-dark-200">{selectedMember.name}</span>
          </>
        ) : (
          <>
            <Users className="w-4 h-4 text-dark-400" />
            <span className="text-sm text-dark-300">全員</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-48 bg-dark-700 rounded-xl shadow-lg border border-dark-600 z-50 overflow-hidden">
            <button
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-600 transition-colors ${
                !selectedMemberId ? 'bg-accent-primary/20' : ''
              }`}
            >
              <Users className="w-5 h-5 text-dark-400" />
              <span className="text-sm text-dark-200">全員</span>
            </button>
            {members.map(member => (
              <button
                key={member.id}
                onClick={() => {
                  onSelect(member.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-600 transition-colors ${
                  selectedMemberId === member.id ? 'bg-accent-primary/20' : ''
                }`}
              >
                <div 
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: member.color }}
                />
                <span className="text-sm text-dark-200">{member.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
