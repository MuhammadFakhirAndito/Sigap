$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$dir = 'C:\Users\HYPE R Series\Documents\SI\Project\SIGAP\docs\screenshots'

$deskCard = "$dir\01-beranda-desktop-1440-card-improved.png"
if (Test-Path $deskCard) { Remove-Item $deskCard -Force }

& $chrome --headless=new --disable-gpu --hide-scrollbars --window-size=1440,950 --screenshot=$deskCard http://localhost:3000

$desk1440 = "$dir\01-beranda-desktop-1440-full.png"
if (Test-Path $desk1440) { Remove-Item $desk1440 -Force }

& $chrome --headless=new --disable-gpu --hide-scrollbars --window-size=1440,2300 --screenshot=$desk1440 http://localhost:3000

$mob390 = "$dir\01-beranda-mobile-390-card-improved.png"
if (Test-Path $mob390) { Remove-Item $mob390 -Force }

& $chrome --headless=new --disable-gpu --hide-scrollbars --window-size=390,844 --screenshot=$mob390 http://localhost:3000

# Copy to brain artifact directory as well
$brainDir = "C:\Users\HYPE R Series\.gemini\antigravity\brain\3b527663-5cd5-4b3e-a840-9d2a12d6dcf6\screenshots"
if (!(Test-Path $brainDir)) { New-Item -ItemType Directory -Path $brainDir -Force }
Copy-Item "$dir\01-beranda-desktop-1440-card-improved.png" "$brainDir\01-beranda-desktop-1440-card-improved.png" -Force
Copy-Item "$dir\01-beranda-mobile-390-card-improved.png" "$brainDir\01-beranda-mobile-390-card-improved.png" -Force
Copy-Item "$dir\01-beranda-desktop-1440-full.png" "$brainDir\01-beranda-desktop-1440-full.png" -Force

Get-ChildItem -Path $dir | Where-Object { $_.Name -like "*improved*" } | Select-Object Name, LastWriteTime, Length

# Copy to brain artifact directory as well
$brainDir = "C:\Users\HYPE R Series\.gemini\antigravity\brain\3b527663-5cd5-4b3e-a840-9d2a12d6dcf6\screenshots"
if (!(Test-Path $brainDir)) { New-Item -ItemType Directory -Path $brainDir -Force }
Copy-Item "$dir\01-beranda-desktop-1440-card-improved.png" "$brainDir\01-beranda-desktop-1440-card-improved.png" -Force
Copy-Item "$dir\01-beranda-mobile-390-card-improved.png" "$brainDir\01-beranda-mobile-390-card-improved.png" -Force
Copy-Item "$dir\01-beranda-desktop-1440-full.png" "$brainDir\01-beranda-desktop-1440-full.png" -Force

Get-ChildItem -Path $dir | Where-Object { $_.Name -like "*improved*" } | Select-Object Name, Length

