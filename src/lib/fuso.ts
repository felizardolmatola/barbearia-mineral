import { useEffect, useState } from "react";

const FUSO = "Africa/Maputo";

export function agoraEmMaputo() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const v = (t: string) => partes.find((p) => p.type === t)!.value;
  return {
    dataISO: `${v("year")}-${v("month")}-${v("day")}`,
    minutos: Number(v("hour")) * 60 + Number(v("minute")),
  };
}

/** Faz o componente re-renderizar quando o minuto (ou o dia) muda. */
export function useAgoraMaputo() {
  const [agora, setAgora] = useState(agoraEmMaputo);
  useEffect(() => {
    const id = setInterval(() => {
      setAgora((prev) => {
        const n = agoraEmMaputo();
        return n.dataISO === prev.dataISO && n.minutos === prev.minutos ? prev : n;
      });
    }, 15000);
    return () => clearInterval(id);
  }, []);
  return agora;
}

/** true se a hora (ex.: "08:00") desse dia já começou ou passou. */
export function horaJaPassou(dataISO: string, hora: string, agora = agoraEmMaputo()) {
  if (dataISO < agora.dataISO) return true;
  if (dataISO > agora.dataISO) return false;
  const [h, m] = hora.split(":").map(Number);
  return h! * 60 + m! <= agora.minutos;
}
