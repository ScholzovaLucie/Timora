import { Button } from "@mui/material";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { cs } from "date-fns/locale";
import { format } from "date-fns";
import { supabase } from "../lib/supabaseClient";

// načti fonty včetně diakritiky

pdfMake.vfs = pdfFonts.vfs;

export default function ExportPdfButton({ user }) {
  const handleExport = async () => {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    const { data: entries, error } = await supabase
      .from("time_entries")
      .select("start_time, end_time, duration_seconds, task:tasks(name)")
      .eq("user_id", user.id)
      .gte("start_time", startOfMonth.toISOString())
      .lte("start_time", endOfMonth.toISOString())
      .order("start_time", { ascending: true });

    const { data: profile, errorProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Chyba při načítání záznamů:", error.message);
      return;
    }

    // seskupení podle dne
    const grouped = {};
    for (const entry of entries) {
      const dayKey = format(new Date(entry.start_time), "d.M.yyyy");
      if (!grouped[dayKey]) {
        grouped[dayKey] = { ranges: [], tasks: new Set(), totalSec: 0 };
      }
      const from = entry.start_time
        ? format(new Date(entry.start_time), "HH:mm")
        : "";
      const to = entry.end_time
        ? format(new Date(entry.end_time), "HH:mm")
        : "";
      if (from && to) grouped[dayKey].ranges.push(`${from}–${to}`);
      if (entry.task?.name) grouped[dayKey].tasks.add(entry.task.name);
      grouped[dayKey].totalSec += entry.duration_seconds || 0;
    }

    const rows = Object.entries(grouped).map(([day, data]) => [
      day,
      data.ranges.join(", "),
      Array.from(data.tasks).join(", "),
      (data.totalSec / 3600).toFixed(2) + " h",
    ]);

    const total = entries.reduce(
      (acc, e) => acc + (e.duration_seconds || 0),
      0
    );

    // PDF definice pro pdfmake
    const docDefinition = {
      content: [
        { text: "Pracovní výkaz", style: "header" },
        { text: `Jméno: ${profile?.name || user.email}` },
        { text: `Měsíc: ${format(today, "LLLL yyyy", { locale: cs })}` },
        {
          style: "tableStyle",
          table: {
            headerRows: 1,
            widths: ["auto", "*", "*", "auto"],
            body: [["Den", "Časy", "Úkoly", "Hodiny"], ...rows],
          },
        },
        {
          text: `Celkem: ${(total / 3600).toFixed(2)} hodin`,
          margin: [0, 10, 0, 0],
          bold: true,
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        tableStyle: {
          margin: [0, 10, 0, 10],
        },
      },
      defaultStyle: {
        font: "Roboto",
      },
    };

    pdfMake
      .createPdf(docDefinition)
      .download(`vykaz_${format(today, "yyyy_MM")}.pdf`);
  };

  return (
    <Button variant="outlined" onClick={handleExport} sx={{ mb: 2 }}>
      Export do PDF
    </Button>
  );
}
