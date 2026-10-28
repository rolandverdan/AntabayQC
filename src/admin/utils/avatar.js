// Turns a chosen image file into a small square JPEG data URL (centre-cropped), so it stays light in browser storage.
export function fileToAvatar(file, size = 192) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) return reject(new Error('Please choose a JPG, PNG, WebP, or GIF image.'))
    if (file.size > 5 * 1024 * 1024) return reject(new Error('That image is larger than 5 MB. Please choose a smaller one.'))
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const side = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('That file could not be read as an image.'))
    }
    img.src = url
  })
}
