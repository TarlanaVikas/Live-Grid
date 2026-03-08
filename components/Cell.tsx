"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isFormula, evaluateFormula } from "@/lib/formula";
import type { CellData } from "@/lib/types";

interface CellProps {
  col: number;
  row: number;
  data: CellData | undefined;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (value: string, formula?: string) => void;
  onNavigate: (dir: "left" | "right" | "up" | "down") => void;
  getCellValue: (col: number, row: number) => string | undefined;
}

export function Cell({
  col,
  row,
  data,
  isSelected,
  onSelect,
  onUpdate,
  onNavigate,
  getCellValue,
}: CellProps) {
  const [editValue, setEditValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = (() => {
    if (isEditing) return editValue;
    if (!data) return "";
    if (data.formula && isFormula(data.formula)) {
      return evaluateFormula(data.formula, getCellValue);
    }
    return data.value;
  })();

  useEffect(() => {
    if (isSelected && !isEditing) {
      setEditValue(data?.formula ?? data?.value ?? "");
    }
  }, [isSelected, isEditing, data?.formula, data?.value]);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const val = (e.target as HTMLInputElement).value;
        const asFormula = val.trim().startsWith("=");
        onUpdate(val, asFormula ? val : undefined);
        setIsEditing(false);
        return;
      }
      if (e.key === "Escape") {
        setEditValue(data?.formula ?? data?.value ?? "");
        setIsEditing(false);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const val = (e.target as HTMLInputElement).value;
        const asFormula = val.trim().startsWith("=");
        onUpdate(val, asFormula ? val : undefined);
        setIsEditing(false);
        onNavigate(e.shiftKey ? "left" : "right");
        return;
      }
      if (["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        const val = (e.target as HTMLInputElement).value;
        const asFormula = val.trim().startsWith("=");
        onUpdate(val, asFormula ? val : undefined);
        setIsEditing(false);
        const dir = e.key === "ArrowRight" ? "right" : e.key === "ArrowLeft" ? "left" : e.key === "ArrowDown" ? "down" : "up";
        onNavigate(dir);
        return;
      }
    },
    [data, onUpdate, onNavigate]
  );

  const handleBlur = useCallback(() => {
    if (isEditing) {
      const val = editValue;
      const asFormula = val.trim().startsWith("=");
      onUpdate(val, asFormula ? val : undefined);
      setIsEditing(false);
    }
  }, [isEditing, editValue, onUpdate]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(data?.formula ?? data?.value ?? "");
  }, [data]);

  return (
    <td
      className={`relative min-w-[100px] border-r border-b border-border ${
        isSelected ? "ring-2 ring-primary ring-inset" : ""
      }`}
      style={{
        backgroundColor: data?.format?.bgColor || 'transparent'
      }}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="input h-full w-full outline-none"
        />
      ) : (
        <div
          className={`px-3 py-2 text-sm text-foreground ${
            data?.format?.bold ? 'font-bold' : ''
          } ${
            data?.format?.italic ? 'italic' : ''
          }`}
          style={{
            color: data?.format?.textColor || 'inherit'
          }}
        >
          {displayValue}
        </div>
      )}
    </td>
  );
}
