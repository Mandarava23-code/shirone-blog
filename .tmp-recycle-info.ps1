$ErrorActionPreference = 'SilentlyContinue'
$policy = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\StorageSense\Parameters\StoragePolicy'
"== StorageSense =="
if (Test-Path $policy) {
    Get-ItemProperty $policy | Select-Object * -ExcludeProperty PS* | Format-List | Out-String
} else {
    "StorageSense key not found"
}

"== Recycle bin volumes =="
$root = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\BitBucket'
Get-ChildItem $root | ForEach-Object {
    $name = $_.PSChildName
    $props = Get-ItemProperty $_.PSPath
    "{0}: MaxCapacity={1} NukeOnDelete={2} VolumeSerialNumber={3}" -f $name, $props.MaxCapacity, $props.NukeOnDelete, $props.VolumeSerialNumber
}

"== Drive mapping =="
Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | Select-Object DeviceID, VolumeSerialNumber, Size | Format-Table -AutoSize | Out-String
