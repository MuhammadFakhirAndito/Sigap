$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$dir = 'C:\Users\HYPE R Series\Documents\SI\Project\SIGAP\docs\screenshots'

# 1. Desktop 1440 fold view
$deskCard = "$dir\01-beranda-desktop-1440-card-improved.png"
Start-Process -FilePath $chrome -ArgumentList @(
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1440,950',
    "`"--screenshot=$deskCard`"",
    'http://localhost:3000'
) -NoNewWindow -Wait

# 2. Desktop 1440 full page
$desk1440 = "$dir\01-beranda-desktop-1440-full.png"
Start-Process -FilePath $chrome -ArgumentList @(
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1440,2300',
    "`"--screenshot=$desk1440`"",
    'http://localhost:3000'
) -NoNewWindow -Wait

# 3. Mobile 390 fold page
$mob390 = "$dir\01-beranda-mobile-390-card-improved.png"
Start-Process -FilePath $chrome -ArgumentList @(
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=390,844',
    "`"--screenshot=$mob390`"",
    'http://localhost:3000'
) -NoNewWindow -Wait

# Copy to brain artifact directory as well
$brainDir = "C:\Users\HYPE R Series\.gemini\antigravity\brain\3b527663-5cd5-4b3e-a840-9d2a12d6dcf6\screenshots"
if (!(Test-Path $brainDir)) { New-Item -ItemType Directory -Path $brainDir -Force }
Copy-Item "$dir\01-beranda-desktop-1440-card-improved.png" "$brainDir\01-beranda-desktop-1440-card-improved.png" -Force
Copy-Item "$dir\01-beranda-mobile-390-card-improved.png" "$brainDir\01-beranda-mobile-390-card-improved.png" -Force
Copy-Item "$dir\01-beranda-desktop-1440-full.png" "$brainDir\01-beranda-desktop-1440-full.png" -Force

Get-ChildItem -Path $dir | Where-Object { $_.Name -like "*improved*" } | Select-Object Name, Length

