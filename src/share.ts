/**
 * Hand a file to the OS share sheet if available (mobile: save to Files,
 * Drive, Dropbox, …); otherwise trigger a plain browser download.
 * Returns true if the file was shared or downloaded, false if the user
 * cancelled the share sheet.
 */
export async function shareOrDownloadFile(file: File, shareTitle: string): Promise<boolean> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: shareTitle })
      return true
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return false
      throw err
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  URL.revokeObjectURL(url)
  return true
}
