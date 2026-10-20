export type RecordingState = { status: 'idle' | 'requesting' | 'recording' | 'ready' | 'error'; url?: string; error?: string }
export type RecorderDependencies = {
  getStream: () => Promise<MediaStream>
  createRecorder: (stream: MediaStream) => MediaRecorder
  createUrl: (blob: Blob) => string
  revokeUrl: (url: string) => void
}
/** Owns all microphone tracks and blob URLs, including late permission resolutions. No network calls. */
export class LocalRecorder {
  private stream?: MediaStream
  private recorder?: MediaRecorder
  private url?: string
  private disposed = false
  private version = 0
  private timer?: ReturnType<typeof setTimeout>
  private pending = false
  constructor(private emit: (state: RecordingState) => void, private deps: RecorderDependencies = {
    getStream: () => {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return Promise.reject(new Error('unsupported'))
      return navigator.mediaDevices.getUserMedia({ audio: true })
    },
    createRecorder: stream => new MediaRecorder(stream),
    createUrl: blob => URL.createObjectURL(blob), revokeUrl: url => URL.revokeObjectURL(url),
  }) {}
  private stopTracks() { this.stream?.getTracks().forEach(track => track.stop()); this.stream = undefined }
  async start() {
    if (this.disposed || this.pending || this.recorder?.state === 'recording') return
    this.pending = true
    this.recorder = undefined
    const version = ++this.version
    if (this.url) { this.deps.revokeUrl(this.url); this.url = undefined }
    this.emit({ status: 'requesting' })
    try {
      const stream = await this.deps.getStream()
      if (this.disposed || version !== this.version) { stream.getTracks().forEach(track => track.stop()); return }
      this.stream = stream
      const recorder = this.deps.createRecorder(stream), chunks: Blob[] = []
      this.recorder = recorder
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
        if (this.stream === stream) this.stream = undefined
        if (this.disposed || version !== this.version) return
        clearTimeout(this.timer)
        const blob = new Blob(chunks, { type: recorder.mimeType || chunks[0]?.type || 'audio/webm' })
        if (!blob.size) { this.emit({ status: 'error', error: 'ยังไม่ได้เสียง ลองอัดใหม่ หรือฝึกตามตัวอย่างได้' }); return }
        this.url = this.deps.createUrl(blob)
        this.emit({ status: 'ready', url: this.url })
      }
      recorder.onerror = () => {
        if (this.disposed || version !== this.version) return
        ++this.version
        clearTimeout(this.timer)
        this.stopTracks()
        if (recorder.state !== 'inactive') recorder.stop()
        this.emit({ status: 'error', error: 'อัดเสียงไม่สำเร็จ ลองใหม่หรือฝึกตามข้อความได้' })
      }
      recorder.start()
      this.emit({ status: 'recording' })
      this.timer = setTimeout(() => this.stop(), 60000)
    } catch (error) {
      if (this.disposed || version !== this.version) return
      this.stopTracks()
      const name = error instanceof Error ? error.name : ''
      this.emit({ status: 'error', error: name === 'NotAllowedError' ? 'ยังไม่ได้รับสิทธิ์ไมค์ คุณยังฟังตัวอย่างและฝึกอ่านต่อได้' : 'ใช้ไมค์ไม่ได้ในเบราว์เซอร์นี้ ลองอุปกรณ์อื่น หรือฝึกตามตัวอย่างได้' })
    } finally { if (version === this.version) this.pending = false }
  }
  stop() {
    clearTimeout(this.timer)
    if (this.pending && !this.recorder) { ++this.version; this.pending = false; if (!this.disposed) this.emit({ status: 'idle' }) }
    if (this.recorder?.state === 'recording') this.recorder.stop()
    this.stopTracks()
  }
  dispose() {
    this.disposed = true
    ++this.version
    this.stop()
    if (this.url) this.deps.revokeUrl(this.url)
    this.url = undefined
  }
}
