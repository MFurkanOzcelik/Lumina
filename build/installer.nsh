; Custom NSIS script for Lumina installer
; Adds "Open with Lumina" context menu for text files

!macro customInstall
  ; Register "Open with Lumina" context menu for all files
  WriteRegStr HKCU "Software\Classes\*\shell\OpenWithLumina" "" "Open with Lumina"
  WriteRegStr HKCU "Software\Classes\*\shell\OpenWithLumina" "Icon" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  WriteRegStr HKCU "Software\Classes\*\shell\OpenWithLumina\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'
  
  ; Register for text files specifically
  WriteRegStr HKCU "Software\Classes\.txt\OpenWithList\Lumina.exe" "" ""
  WriteRegStr HKCU "Software\Classes\.md\OpenWithList\Lumina.exe" "" ""
  WriteRegStr HKCU "Software\Classes\.json\OpenWithList\Lumina.exe" "" ""
  WriteRegStr HKCU "Software\Classes\.lum\OpenWithList\Lumina.exe" "" ""
  WriteRegStr HKCU "Software\Classes\.pdf\OpenWithList\Lumina.exe" "" ""
  
  ; Add to "Open With" list
  WriteRegStr HKCU "Software\Classes\Applications\Lumina.exe" "FriendlyAppName" "Lumina"
  WriteRegStr HKCU "Software\Classes\Applications\Lumina.exe\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'
  WriteRegStr HKCU "Software\Classes\Applications\Lumina.exe\SupportedTypes" ".txt" ""
  WriteRegStr HKCU "Software\Classes\Applications\Lumina.exe\SupportedTypes" ".md" ""
  WriteRegStr HKCU "Software\Classes\Applications\Lumina.exe\SupportedTypes" ".json" ""
  WriteRegStr HKCU "Software\Classes\Applications\Lumina.exe\SupportedTypes" ".lum" ""
  WriteRegStr HKCU "Software\Classes\Applications\Lumina.exe\SupportedTypes" ".pdf" ""
  
  ; Refresh shell icons
  System::Call 'shell32.dll::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
!macroend

!macro customUnInstall
  ; Remove "Open with Lumina" context menu
  DeleteRegKey HKCU "Software\Classes\*\shell\OpenWithLumina"
  
  ; Remove from "Open With" list
  DeleteRegKey HKCU "Software\Classes\.txt\OpenWithList\Lumina.exe"
  DeleteRegKey HKCU "Software\Classes\.md\OpenWithList\Lumina.exe"
  DeleteRegKey HKCU "Software\Classes\.json\OpenWithList\Lumina.exe"
  DeleteRegKey HKCU "Software\Classes\.lum\OpenWithList\Lumina.exe"
  DeleteRegKey HKCU "Software\Classes\.pdf\OpenWithList\Lumina.exe"
  DeleteRegKey HKCU "Software\Classes\Applications\Lumina.exe"
  
  ; Refresh shell icons
  System::Call 'shell32.dll::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
!macroend

