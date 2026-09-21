param([Parameter(Mandatory=$true)][ValidateNotNullOrEmpty()][string]$WorkbookPath)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$auditPath = $WorkbookPath
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
        $privateSettingCounts = @{}
        $populatedRows = 0
        foreach ($row in $rows) {
            $record = @{}
            foreach ($cell in $row.c) {
                $value = if ($cell.t -eq 's') { $strings[[int]$cell.v] } elseif ($cell.t -eq 'inlineStr') { $cell.is.InnerText } else { [string]$cell.v }
                $column = $cell.r -replace '\d',''
                if ($row.r -ne '1' -and $headers[$column]) { $record[$headers[$column]] = $value }
                if ($row.r -eq '1') { $headers[$column] = $value }
                elseif ($value -and $headers[$column] -match 'password|token|salt|costPrice|contact|adminNote|reservedStock') {
                    $key = $headers[$column]; $nonempty[$key] = 1 + [int]$nonempty[$key]
                }
            }
            if ($row.r -ne '1') {
                $identity = @('id','orderId','userId','customerId','key','backupId','token') | Where-Object { $record[$_] }
                if ($identity.Count) { $populatedRows++ }
                if ($record.key -match 'api.?key|password|token|secret|salt' -and $record.value) { $privateSettingCounts[[string]$record.key] = 1 + [int]$privateSettingCounts[[string]$record.key] }
            }
        }
        [pscustomobject]@{sheet=[string]$tab.name;formattedDataRows=[Math]::Max(0,$rows.Count-1);rowsWithIdentity=$populatedRows;sensitiveNonemptyCounts=$nonempty;nonemptyCredentialSettings=$privateSettingCounts}
    }
    $embedded = @($auditZip.Entries | Where-Object { $_.FullName -match 'embeddings/|vbaProject|externalLinks/' } | ForEach-Object FullName)
    $patterns = @('-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----','\bgh[pousr]_[A-Za-z0-9]{30,}\b','\bAIza[\w-]{30,}\b','\bya29\.[\w.-]{25,}')
    $credentialPatterns = 0
    foreach ($entry in $auditZip.Entries) {
        if ($entry.FullName -notmatch '\.xml$') { continue }
        $reader = [IO.StreamReader]::new($entry.Open())
        try { $content = $reader.ReadToEnd(); foreach ($pattern in $patterns) { $credentialPatterns += [regex]::Matches($content,$pattern).Count } } finally { $reader.Dispose() }
    }
    [pscustomobject]@{sheets=$summary;embeddedParts=$embedded;recognizedCredentialPatterns=$credentialPatterns;note='Redacted structural scan; not an exhaustive proof that arbitrary cell text contains no private information.'} | ConvertTo-Json -Depth 6
} finally { $auditZip.Dispose() }
