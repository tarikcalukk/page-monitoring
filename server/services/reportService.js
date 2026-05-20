const { Parser } = require("json2csv");
const config = require("../config");
const mailService = require("./mailService");

function buildCsvForUser(user) {
  const rows = user.urls.flatMap((urlObj) =>
    ["HASH", "DOM"].flatMap((method) =>
      (urlObj.methods[method]?.history || []).map((entry) => ({
        url: urlObj.url,
        method,
        time: entry.time,
        changed: entry.changed,
        changeTypes: Array.isArray(entry.changeTypes)
          ? entry.changeTypes.join("+")
          : "",
        timeMs: entry.timeMs,
        cpu: entry.cpu,
        memoryMb: entry.memoryMb,
        elementCount: entry.elementCount,
        maxDepth: entry.maxDepth,
        attributeCount: entry.attributeCount,
      })),
    ),
  );

  const parser = new Parser({
    fields: [
      "url",
      "method",
      "time",
      "changed",
      "changeTypes",
      "timeMs",
      "cpu",
      "memoryMb",
      "elementCount",
      "maxDepth",
      "attributeCount",
    ],
  });
  return parser.parse(rows.length ? rows : []);
}

async function sendReportEmail(user) {
  if (
    config.email.deliveryMode === "smtp" &&
    (!config.email.host || !config.email.from)
  ) {
    return {
      sent: false,
      msg: "Email is not configured on the server, but report data is available for CSV export.",
    };
  }

  const csv = buildCsvForUser(user);
  const totalChanges = user.urls.reduce(
    (acc, item) => acc + Number(item.changes?.total || 0),
    0,
  );

  const delivery = await mailService.sendMail({
    from: config.email.from || "Page Monitoring <no-reply@page-monitoring.local>",
    to: user.email,
    subject: "Page Monitoring Report",
    text: `Ukupno nadgledanih URL-ova: ${user.urls.length}\nUkupno detektovanih promjena: ${totalChanges}\nCSV izvjestaj je u prilogu.`,
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;font-size:16px;color:#232526;">
        <h2>Page Monitoring Report</h2>
        <p>Ukupno nadgledanih URL-ova: <b>${user.urls.length}</b></p>
        <p>Ukupno detektovanih promjena: <b>${totalChanges}</b></p>
        <p>CSV izvjestaj sa HASH i DOM metrikama nalazi se u prilogu.</p>
      </div>
    `,
    attachments: [{ filename: "page-monitoring-report.csv", content: csv }],
  });

  return {
    sent: true,
    deliveryMode: delivery.mode,
    msg:
      delivery.mode === "mailpit"
        ? "Report sent to the local Mailpit inbox. Open http://localhost:8025 to view it."
        : "Report sent to your email.",
  };
}

module.exports = {
  buildCsvForUser,
  sendReportEmail,
};
