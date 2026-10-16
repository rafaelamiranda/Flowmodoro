"use client";

import { useState } from "react";
import { Button, Field, inputCls } from "@/components/ui";
import { TASK_COLORS, type TaskInput } from "./store";

export function TaskForm({
  initial, submitLabel, onSubmit, onCancel,
}: {
  initial?: Partial<TaskInput>;
  submitLabel: string;
  onSubmit: (v: TaskInput) => void | Promise<void>;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "");
  const [color, setColor] = useState(initial?.color ?? TASK_COLORS[0]);
  const valid = name.trim().length > 0;

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) void onSubmit({ name, emoji, color });
      }}
    >
      <Field label="Nome da tarefa">
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus placeholder="Ex.: Estudar inglês" />
      </Field>
      <Field label="Emoji (opcional)">
        <input className={inputCls} value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} placeholder="📚" />
      </Field>
      <fieldset className="flex flex-col gap-1.5 text-sm">
        <legend className="mb-1.5 font-medium">Cor</legend>
        <div className="flex flex-wrap gap-2">
          {TASK_COLORS.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="color" value={c} checked={color === c} onChange={() => setColor(c)} className="peer sr-only" />
              <span
                className="block size-9 rounded-full border-2 border-transparent peer-checked:border-fg peer-focus-visible:outline-3 peer-focus-visible:outline-primary"
                style={{ background: c }}
              />
              <span className="sr-only">{c}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-1 flex justify-end gap-2">
        {onCancel && <Button onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" variant="primary" disabled={!valid}>{submitLabel}</Button>
      </div>
    </form>
  );
}
