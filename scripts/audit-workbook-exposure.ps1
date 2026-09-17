$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$auditPath = Join-Path $PSScriptRoot '../GUN-SHOP-DMO-V20-FINAL-Database.xlsx'
$auditZip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $auditPath))
function Read-AuditXml([string]$entry) {
    $zipEntry = $auditZip.GetEntry($entry)
    if (-not $zipEntry) { return $null }
    $reader = [IO.StreamReader]::new($zipEntry.Open())
    try { return [xml]$reader.ReadToEnd() } finally { $reader.Dispose() }
}
try {
    $strings = @()
    $shared = Read-AuditXml 'xl/sharedStrings.xml'
    if ($shared) { $strings = @($shared.sst.si | ForEach-Object { $_.InnerText }) }
    $book = Read-AuditXml 'xl/workbook.xml'
    $rels = Read-AuditXml 'xl/_rels/workbook.xml.rels'
    $summary = foreach ($tab in $book.workbook.sheets.sheet) {
        $rel = @($rels.Relationships.Relationship | Where-Object Id -eq $tab.GetAttribute('id','http://schemas.openxmlformats.org/officeDocument/2006/relationships'))[0]
        $target = if ($rel.Target.StartsWith('/')) { $rel.Target.TrimStart('/') } else { 'xl/' + $rel.Target }
        $xml = Read-AuditXml $target
        $rows = @($xml.worksheet.sheetData.row)
        $headers = @{}
        $nonempty = @{}
        foreach ($row in $rows) {
            foreach ($cell in $row.c) {
                $value = if ($cell.t -eq 's') { $strings[[int]$cell.v] } elseif ($cell.t -eq 'inlineStr') { $cell.is.InnerText } else { [string]$cell.v }
                $column = $cell.r -replace '\d',''
                if ($row.r -eq '1') { $headers[$column] = $value }
                elseif ($value -and $headers[$column] -match 'password|token|salt|costPrice|contact|adminNote|reservedStock') {
                    $key = $headers[$column]; $nonempty[$key] = 1 + [int]$nonempty[$key]
                }
            }
        }
        [pscustomobject]@{sheet=[string]$tab.name;dataRows=[Math]::Max(0,$rows.Count-1);sensitiveNonemptyCounts=$nonempty}
    }
    $summary | ConvertTo-Json -Depth 5
} finally { $auditZip.Dispose() }
