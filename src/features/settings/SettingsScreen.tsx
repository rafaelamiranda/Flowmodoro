"use client";

import { useState, type ReactNode } from "react";
import { Button, Card, Field, inputCls } from "@/components/ui";
import { playSound, SOUNDS, unlockAudio } from "@/lib/audio";
import { requestNotificationPermission, useNotificationPermission } from "@/lib/notifications";
import { DataSection } from "./DataSection";
import { useSettings, type Theme } from "./store";

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }): ReactNode {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-1.5">
      <span className="text-sm">
        <span className="font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" className="size-6 shrink-0 accent-[var(--primary)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

/** Campo numérico que aceita digitar livremente (ex.: "2,5") e só confirma valores válidos. */
function NumberField({ label, hint, value, min, step, onCommit }: { label: string; hint?: string; value: number; min: number; step: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? String(value);
  return (
    <Field label={label} hint={hint}>
      <input
        className={inputCls}
        inputMode="decimal"
        value={text}
        onChange={(e) => {
          setDraft(e.target.value);
          const n = Number(e.target.value.replace(",", "."));
          if (e.target.value.trim() !== "" && Number.isFinite(n) && n >= min) onCommit(n);
        }}
        onBlur={() => setDraft(null)}
        data-step={step}
      />
    </Field>
  );
}

export function SettingsScreen() {
  const { settings: s, update, reset } = useSettings();
  const perm = useNotificationPermission();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold">Pausa</h2>
        <NumberField label="Fator de pausa" hint={`Pausa = tempo focado ÷ fator. Ex.: 50 min ÷ ${s.factor} = ${Math.round((50 / s.factor) * 10) / 10} min. Mínimo 1.`} value={s.factor} min={1} step={0.5} onCommit={(v) => update({ factor: v })} />
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Pausa mínima (min)" value={s.minBreakMin} min={0} step={1} onCommit={(v) => update({ minBreakMin: v })} />
          <NumberField label="Pausa máxima (min)" value={s.maxBreakMin} min={0} step={1} onCommit={(v) => update({ maxBreakMin: v })} />
        </div>
        <Toggle label="Iniciar pausa automaticamente ao parar" hint="Desligado: ao parar o foco, o timer volta para ocioso." checked={s.autoBreak} onChange={(v) => update({ autoBreak: v })} />
        <Toggle label="Iniciar novo foco após a pausa" hint="Reinicia na mesma tarefa quando a pausa zera." checked={s.autoNextFocus} onChange={(v) => update({ autoNextFocus: v })} />
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold">Som e avisos</h2>
        <Field label="Som do fim da pausa">
          <select className={inputCls} value={s.sound} onChange={(e) => { update({ sound: e.target.value as typeof s.sound }); unlockAudio(); playSound(e.target.value as typeof s.sound, s.volume); }}>
            {SOUNDS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </Field>
        <Field label={`Volume: ${Math.round(s.volume * 100)}%`}>
          <input type="range" min={0} max={1} step={0.05} value={s.volume} onChange={(e) => update({ volume: Number(e.target.value) })} className="min-h-11 accent-[var(--primary)]" />
        </Field>
        <div><Button onClick={() => { unlockAudio(); playSound(s.sound, s.volume); }}>🔊 Testar som</Button></div>
        <Toggle label="Som ao iniciar a pausa" checked={s.breakStartSound} onChange={(v) => update({ breakStartSound: v })} />
        <Toggle label="Notificação do navegador" hint="Aviso quando a pausa terminar, inclusive com a aba em segundo plano." checked={s.notifications} onChange={async (v) => { update({ notifications: v }); if (v) await requestNotificationPermission(); }} />
        {s.notifications && perm === "denied" && <p className="text-xs text-danger">O navegador bloqueou as notificações. Libere nas permissões do site; até lá só o som toca.</p>}
        {s.notifications && perm === "default" && <div><Button onClick={() => void requestNotificationPermission()}>Permitir notificações</Button></div>}
        {perm === "unsupported" && <p className="text-xs text-muted">Este navegador não suporta notificações.</p>}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold">Aparência</h2>
        <div role="radiogroup" aria-label="Tema" className="flex gap-2">
          {([["light", "☀️ Claro"], ["dark", "🌙 Escuro"], ["system", "💻 Sistema"]] as [Theme, string][]).map(([id, label]) => (
            <Button key={id} role="radio" aria-checked={s.theme === id} variant={s.theme === id ? "primary" : "secondary"} onClick={() => update({ theme: id })}>{label}</Button>
          ))}
        </div>
      </Card>

      <DataSection />

      <div><Button variant="ghost" onClick={reset}>Restaurar configurações padrão</Button></div>
    </div>
  );
}
