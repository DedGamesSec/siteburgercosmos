$ErrorActionPreference = "Stop"
$root = "C:\Users\user\Desktop\сайт"

# --- HEX COLOR MAP: unify every UI color to the 4-tier + neutral design system ---
$colorMap = [ordered]@{
  # old decorative accent -> info
  "#2E7DFF" = "#3B82F6"
  # neutral borders -> canonical border token
  "#1F2937" = "#3C404A"
  "#111827" = "#3C404A"
  # dark surfaces -> canonical surface (panel) or bg
  "#0A162C" = "#0A0A0B"
  "#0F0F12" = "#0A0A0B"
  "#0F0F11" = "#0A0A0B"
  "#0C0D11" = "#0A0A0B"
  "#030406" = "#0A0A0B"
  "#050507" = "#0A0A0B"
  "#060608" = "#0A0A0B"
  "#08080A" = "#0A0A0B"
  "#08080B" = "#0A0A0B"
  "#090A0B" = "#0A0A0B"
  "#090A0E" = "#0A0A0B"
  "#0B0C0E" = "#0A0A0B"
  "#0A0A0C" = "#0A0A0B"
  "#0E0F12" = "#0A0A0B"
  "#111622" = "#12141A"
  "#0C0E14" = "#12141A"
  "#101F3B" = "#12141A"
  "#111A2E" = "#12141A"
  "#15233D" = "#12141A"
  "#141418" = "#12141A"
  "#111319" = "#12141A"
  "#0E0E11" = "#12141A"
  "#111216" = "#12141A"
  "#16161A" = "#12141A"
  "#1D2433" = "#12141A"
  "#1A2333" = "#12141A"
}

# Files: all UI source. Skip astro-data / logo / canvas data (they carry "real sky" colors).
$files = Get-ChildItem -Path (Join-Path $root "src") -Recurse -Include *.tsx,*.ts,*.css | Where-Object {
  $_.Name -notin @("realStarCatalog.ts","celestialCatalog.ts","starNamesRu.ts","skyLabelsI18n.ts","skyCalculations.ts")
}

foreach ($f in $files) {
  $c = Get-Content $f.FullName -Raw
  $orig = $c
  foreach ($k in $colorMap.Keys) { $c = $c.Replace($k, $colorMap[$k]) }
  # radius: single non-pill radius = rounded-md (6px)
  foreach ($r in @("rounded-2xl","rounded-3xl","rounded-xl","rounded-lg")) { $c = $c.Replace($r, "rounded-md") }
  # transitions: single duration
  foreach ($d in @("duration-500","duration-700","duration-200")) { $c = $c.Replace($d, "duration-300") }
  $c = $c.Replace("duration-100", "duration-300")
  if ($c -ne $orig) { Set-Content -Path $f.FullName -Value $c -NoNewline -Encoding UTF8 }
}

echo "DONE"
